const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const connector = require('./index');
const MockConnector = require('./mock');
const logger = require('../../components/log/logger');
const { models: mongooseSchema } = require('../../components/database/mongo');
const { cursorMapAsyncHelper } = require('../../utils/schema');
const { generateExtraPayloadFieldsVendor, payloadsVendor } = require('./vendor');
const { payloadsContact } = require('./contact');
const { payloadsCompany } = require('./company');
const { generateExtraPayloadFieldsApBill, payloadsApBill } = require('./ap-bill');
const { generateExtraPayloadFieldsApAdjustment, payloadsApAdjustment } = require('./ap-adjustment');
const { generateExtraPayloadFieldsApPayment, payloadsApPayment, sendVendorNotifications } = require('./ap-payment');
const { generateExtraPayloadFieldsArAdjustment, payloadsArAdjustment } = require('./ar-adjustment');
const { payloadsArAdvance } = require('./ar-advance');
const { generateExtraPayloadFieldsArInvoice, payloadsArInvoice } = require('./ar-invoice');
const { generateExtraPayloadFieldsArPayment, payloadsArPayment } = require('./ar-payment');
const { isAdjustment, isInvoice, isAdvance } = require('../../endpoints/lsp/ar-payment/ar-payment-api-helpers');
const configuration = require('../../components/configuration');

const isProduction = configuration.environment.NODE_ENV === 'PROD';
const SI_NAME_VENDOR = 'vendor';
const SI_NAME_CONTACT = 'contact';
const SI_NAME_COMPANY = 'customer';
const SI_NAME_AP_BILL = 'apbill';
const SI_NAME_AP_PAYMENT = 'appymt';
const SI_NAME_AP_ADJUSTMENT = 'apadjustment';
const SI_NAME_AR_ADVANCE = 'arpymt';
const SI_NAME_AR_PAYMENT = 'arpayment';
const SI_NAME_AR_INVOICE = 'arinvoice';
const SI_NAME_AR_ADJUSTMENT = 'aradjustment';
const SI_NAME_AR_PAYMENT_REVERSE_FUNCTION = 'reverse_arpayment';
const SI_NAME_AP_PAYMENT_REVERSE_FUNCTION = 'reverse_appayment';
const SI_NAME_AR_INVOICE_REVERSE_FUNCTION = 'reverse_arinvoice';
const ENTITIES_USING_LSP_FIELD_NAME = ['User'];

class SiConnectorAPI {
  constructor(options) {
    this.mock = _.get(options, 'mock', false);
    this.mockServerTime = _.get(options, 'mockServerTime');
    this.mockSchedulerInstantSync = _.get(options, 'mockSchedulerInstantSync', true);
    this.shouldMockSiSyncFail = _.get(options, 'shouldMockSiSyncFail', false);
    this.shouldMockSiDisabled = _.get(options, 'shouldMockSiDisabled', false);
    this.shouldMockSiAuthFail = _.get(options, 'shouldMockSiAuthFail', false);
    this.siMockSyncFrom = _.get(options, 'siMockSyncFrom', null);
    this.shouldGetPayloadWithoutSync = _.get(options, 'shouldGetPayloadWithoutSync', false);
    this.mockPayloadXMLType = _.get(options, 'mockPayloadXMLType', 'create');
    logger.debug('SIConnector: Initiated new instance of SiConnectorAPI');
    this.entitySyncMap = {
      User: this.syncUsers,
      Company: this.syncCompanies,
      Bill: this.syncApBills,
      Invoice: this.syncArInvoices,
      ArAdjustment: this.syncArAdjustments,
      BillAdjustment: this.syncApAdjustments,
      ApPayment: this.syncApPayments,
      ArAdvance: this.syncArAdvances,
      ArPayment: this.syncArPayments,
    };
    this.entitySyncObjectMap = {
      User: this.buildUserSyncObject,
      Company: this.buildCompanySyncObject,
      Bill: this.buildApBillSyncObject,
      Invoice: this.buildArInvoiceSyncObject,
      ArAdjustment: this.buildArAdjustmentSyncObject,
      BillAdjustment: this.buildApAdjustmentSyncObject,
      ApPayment: this.buildApPaymentSyncObject,
      ArAdvance: this.buildArAdvanceSyncObject,
      ArPayment: this.buildArPaymentSyncObject,
    };
    this.getEntitiesMap = {
      User: this.getUsers,
      Company: this.getCompanies,
      Bill: this.getApBills,
      Invoice: this.getArInvoices,
      ArAdjustment: this.getArAdjustments,
      BillAdjustment: this.getApAdjustments,
      ApPayment: this.getApPayments,
      ArAdvance: this.getArAdvances,
      ArPayment: this.getArPayments,
    };
    if (!isProduction) {
      logger.debug(`SIConnector: get connector call. Is mocking? ${this.mock}`);
    }
    this.connector = this.mock ? this.getMockConnector() : connector;
  }

  getMockConnector() {
    const {
      shouldMockSiSyncFail,
      shouldMockSiDisabled,
      shouldMockSiAuthFail,
      siMockSyncFrom,
      mockServerTime,
    } = this;
    return new MockConnector({
      shouldMockSiSyncFail,
      shouldMockSiDisabled,
      shouldMockSiAuthFail,
      siMockSyncFrom,
      mockServerTime,
    });
  }

  get batchSize() {
    return 10;
  }

  async getPayloadForEntity(lspId, entityName, entityId) {
    if (_.isNil(lspId) || _.isEmpty(entityName) || _.isNil(entityId)) return '';
    const connectorInDb = await this.connector.getConnectorByLspId(lspId);
    const canSyncEntities = !_.isNil(connectorInDb)
      && !connectorInDb.deleted
      && !connectorInDb.hasAuthError;
    const canMock = !isProduction && this.mock;
    if ((!canMock && !canSyncEntities) || (canMock && this.shouldMockSiAuthFail)) {
      return '';
    }
    const query = ENTITIES_USING_LSP_FIELD_NAME.includes(entityName) ? { lsp: lspId } : { lspId };
    if (!_.isEmpty(entityId)) {
      query._id = new ObjectId(entityId);
    }
    const entityListStrategy = _.get(this.getEntitiesMap, entityName).bind(this);
    const entityList = await entityListStrategy(query);
    const entity = entityList[0];
    entity.lspId = _.has(entity, 'lspId') ? entity.lspId : lspId;
    const entityStrategy = _.get(this.entitySyncObjectMap, entityName).bind(this);
    const syncEntityObject = await entityStrategy(entity);
    const payload = await this.compilePayloadForEntity(syncEntityObject);
    return payload;
  }

  async syncSingleEntity(lspId, { entity, entityId }) {
    if (_.isNil(lspId)) {
      logger.error('SIConnector: syncSingleEntity. Missing lspId');
      throw new Error('SIConnector: syncSingleEntity. Missing lspId');
    }
    if (_.isEmpty(entity) || _.isNil(entityId)) {
      logger.error('SIConnector: syncSingleEntity. Missing entity parameter');
      throw new Error('SIConnector: syncSingleEntity. Missing entity parameter');
    }
    logger.debug(`SIConnector: syncSingleEntity: Entity: ${entity} Id: ${entityId}`);
    const connectorInDb = await this.connector.getConnectorByLspId(lspId);

    if (_.isNil(connectorInDb)) {
      logger.error('SIConnector: syncSingleEntity. Missing connector in db');
      throw new Error('SIConnector: syncSingleEntity. Missing connector in db');
    }
    logger.debug(`SIConnector: getting connector from db for lspId ${lspId}`);

    const canSyncEntities = !connectorInDb.deleted && !connectorInDb.hasAuthError;
    const canMock = !isProduction && this.mock;
    if ((!canMock && canSyncEntities) || (canMock && !this.shouldMockSiAuthFail)) {
      logger.debug(`SIConnector: building query for syncing record ${entityId} for lspId ${lspId}`);
      const query = {
        lspId,
      };

      if (!_.isNil(entityId)) {
        query._id = new ObjectId(entityId);
      }
      const entityStrategy = _.get(this.entitySyncMap, entity).bind(this);

      await entityStrategy(query);
    }
    const message = (connectorInDb.deleted && `SI connector for lspId ${lspId} is disabled`)
      || (connectorInDb.hasAuthError && `SI connector for lspId ${lspId} has authentication error`);

    logger.info(message, this.connector.logMeta);
  }

  async syncAllEntities(lspId) {
    try {
      logger.debug(`SIConnector: syncAllEntities ${lspId}`);
      const connectorInDb = await this.connector.getConnectorByLspId(lspId);
      logger.debug(`SIConnector: getting connector from db for lspId ${lspId}`);
      const canSyncAllEntities = !connectorInDb.deleted && !connectorInDb.hasAuthError;
      if (canSyncAllEntities) {
        logger.debug(`SIConnector: building query for syncing all records from all collections for lspId ${lspId}`);
        const query = await this.connector.buildQueryForNotSyncedEntities(lspId, this.mock);
        return Promise.mapSeries([
          this.syncUsers.bind(this),
          this.syncCompanies.bind(this),
          this.syncApBills.bind(this),
          this.syncApAdjustments.bind(this),
          this.syncApPayments.bind(this),
          this.syncArAdjustments.bind(this),
          this.syncArAdvances.bind(this),
          this.syncArInvoices.bind(this),
          this.syncArPayments.bind(this),
        ], (fn) => {
          fn(query);
        }).then(() => {
          logger.debug(`SIConnector: Finished syncAllEntities ${lspId}`);
        });
      }
      const message = (connectorInDb.deleted && `SI connector for lspId ${lspId} is disabled`)
        || (connectorInDb.hasAuthError && `SI connector for lspId ${lspId} has authentication error`);
      logger.debug(message, this.connector.logMeta);
    } catch (error) {
      logger.debug(`SIConnector: syncAllEntities error ${error}`);
    }
  }

  buildUserSyncObject(user) {
    const { type } = user;
    let syncPayload;
    if (type === 'Vendor') {
      syncPayload = generateExtraPayloadFieldsVendor(user);
    } else {
      syncPayload = user;
    }
    return {
      dbEntity: user,
      syncPayload,
      siName: type === 'Vendor' ? SI_NAME_VENDOR : SI_NAME_CONTACT,
      mongoCollection: 'users',
      payloads: type === 'Vendor' ? payloadsVendor : payloadsContact,
    };
  }

  getUsers(query) {
    return mongooseSchema.User.findWithDeleted(query)
      .select({ 'vendorDetails.rates': 0 })
      .populate({
        path: 'vendorDetails.billingInformation.billingTerms',
        select: 'name',
        options: { withDeleted: true },
      })
      .populate({
        path: 'vendorDetails.billingInformation.paymentMethod',
        select: 'name',
        options: { withDeleted: true },
      })
      .populate({
        path: 'vendorDetails.billingInformation.taxForm',
        select: 'name',
        options: { withDeleted: true },
      })
      .populate({ path: 'company', select: 'name', options: { withDeleted: true } })
      .lean();
  }

  async syncUsers(query, options) {
    logger.debug(`SIConnector: syncUsers started. query: ${JSON.stringify(query)}`);
    if (_.get(options, 'shouldSkipVendorSync', false)) {
      return [];
    }
    query = { ...query, type: { $in: ['Contact', 'Vendor'] } };
    if (_.get(query, '_id')) {
      query = _.pick(query, '_id');
    }
    const cursor = this.getUsers(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (user) => {
      let userSyncObject;
      try {
        userSyncObject = this.buildUserSyncObject(user);
        return await this.syncEntity(userSyncObject, options);
      } catch (error) {
        if (options.throwError) {
          throw error;
        }
        logger.debug(`Failed to sync user with _id ${user._id}. ${error}`);
      }
    }, {}, 'user');
  }

  async buildCompanySyncObject(company, parentCustomerId) {
    const syncPayload = { ...company };
    if (!_.isNil(parentCustomerId)) {
      Object.assign(syncPayload, { parentCustomerId });
    }
    return {
      dbEntity: company,
      syncPayload,
      siName: SI_NAME_COMPANY,
      mongoCollection: 'companies',
      payloads: payloadsCompany,
    };
  }

  async syncCompany(_id) {
    let companySyncObject;
    try {
      const company = await mongooseSchema.Company
        .findOneWithDeleted({ _id }).select({ 'billingInformation.rates': 0 })
        .populate({ path: 'billingInformation.billingTerm', options: { withDeleted: true } })
        .lean();
      companySyncObject = await this.buildCompanySyncObject(company);
      return await this.syncEntity(companySyncObject);
    } catch (error) {
      logger.debug(`Failed to sync company with _id ${_id}. ${error}`);
    }
  }

  getCompanies(query) {
    return mongooseSchema.Company.findWithDeleted(query)
      .select({ 'billingInformation.rates': 0 })
      .populate({ path: 'billingInformation.billingTerm', options: { withDeleted: true } })
      .lean();
  }

  async syncCompanies(query, options = {}) {
    const cursor = this.getCompanies(query).cursor({ batchSize: this.batchSize });
    return await cursorMapAsyncHelper(cursor, async (company) => {
      let companyAncestors = mongooseSchema.Company.getCompanyAncestors(company);
      let companiesToBeSynced = [company];
      // In case parent companies don't have the lspId set
      if (!_.isNil(companyAncestors) && _.isArray(companyAncestors)) {
        companyAncestors = companyAncestors.map((_company) => {
          _company.lspId = company.lspId;
          return _company;
        });
        companiesToBeSynced = [
          ...companyAncestors,
          company,
        ];
      }
      return await Promise.mapSeries(companiesToBeSynced, async (_company) => {
        const parentId = _.get(_company, 'parentCompany._id', null);
        if (_.isNil(parentId)) {
          return await this.syncCompany(_company._id);
        }
        logger.debug(`About to sync parent company ${parentId} of company with _id ${_company._id}`);
        try {
          const syncedParentCompany = await this.syncCompany(parentId);
          const parentIdFromSI = _.get(syncedParentCompany, 'CUSTOMERID', null);
          const companySyncObject = await this.buildCompanySyncObject(_company, parentIdFromSI);
          await this.syncEntity(companySyncObject, options);
        } catch (error) {
          logger.error(`Failed to sync parent company ${parentId} of company with _id ${_company._id}`);
          throw error;
        }
      });
    }, {}, 'company');
  }

  async buildApAdjustmentSyncObject(apAdjustment) {
    const vendorId = _.get(apAdjustment, 'vendor._id', apAdjustment.vendor);

    logger.debug(`Starting sync for entity Ap adjustment ${this.connector.logMeta}`);
    const mongoCollection = 'billAdjustments';
    let siVendor;
    try {
      [siVendor] = await this.syncUsers({ _id: vendorId }, {
        throwError: true, shouldSkipVendorSync: this.shouldGetPayloadWithoutSync,
      });
      const syncPayload = generateExtraPayloadFieldsApAdjustment(
        apAdjustment,
        { vendorId: this.mock ? vendorId : _.get(siVendor, 'VENDORID', vendorId) },
      );
      return {
        dbEntity: apAdjustment,
        syncPayload,
        siName: SI_NAME_AP_ADJUSTMENT,
        mongoCollection,
        payloads: payloadsApAdjustment,
      };
    } catch (e) {
      logger.debug(`SIConnector: Failed syncing vendor. apAdjustmentId: ${apAdjustment._id}`);
      await this.connector
        .markEntityAsSyncFinished(mongoCollection, { _id: apAdjustment._id }, { error: e.message });
      throw e;
    }
  }

  getApAdjustments(query) {
    return mongooseSchema.BillAdjustment.findWithDeleted(query)
      .populate({
        path: 'lineItems.glAccountNo',
        select: 'number',
        options: { withDeleted: true },
      })
      .populate({
        path: 'lineItems.departmentId',
        select: 'accountingDepartmentId',
        options: { withDeleted: true },
      })
      .populate({ path: 'bill', select: '_id has1099EligibleForm', options: { withDeleted: true } })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .lean();
  }

  async syncApAdjustments(query, options) {
    logger.debug(`SIConnector: syncApAdjustments started. query: ${JSON.stringify(query)}`);
    const cursor = this.getApAdjustments(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (apAdjustment) => {
      let apAdjustmentSyncObject;
      try {
        apAdjustmentSyncObject = await this.buildApAdjustmentSyncObject(apAdjustment);
        return await this.syncEntity(apAdjustmentSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync ap adjustment with err ${error}`);
      }
    }, {}, 'apAdjustment');
  }

  async buildApBillSyncObject(bill) {
    const vendorId = _.get(bill, 'vendor._id', bill.vendor);

    logger.debug(`SIConnector: buildApBillSyncObject started. query: billId: ${bill._id}, bill lspId: ${bill.lspId}`);
    const mongoCollection = 'bills';
    let siVendor;
    try {
      [siVendor] = await this.syncUsers({ _id: vendorId }, {
        throwError: true, shouldSkipVendorSync: this.shouldGetPayloadWithoutSync,
      });
    } catch (e) {
      logger.debug(`SIConnector: Failed syncing vendor. billId: ${bill._id}`);
      await this.connector
        .markEntityAsSyncFinished(mongoCollection, { _id: bill._id }, { error: e.message });
      throw e;
    }

    const syncPayload = generateExtraPayloadFieldsApBill(
      bill,
      { vendorId: this.mock ? vendorId : _.get(siVendor, 'VENDORID', vendorId) },
    );
    return {
      dbEntity: bill,
      syncPayload,
      siName: SI_NAME_AP_BILL,
      mongoCollection: 'bills',
      payloads: payloadsApBill,
    };
  }

  getApBills(query) {
    return mongooseSchema.Bill.find(query)
      .populate({
        path: 'vendor',
        populate: {
          path: 'vendorDetails.billingInformation.billingTerms',
          select: 'name',
        },
        options: { withDeleted: true },
      })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .lean();
  }

  async syncApBills(query, options) {
    logger.debug(`SIConnector: syncApBills started. query: ${JSON.stringify(query)}`);
    const cursor = this.getApBills(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (bill) => {
      let billSyncObject;
      try {
        billSyncObject = await this.buildApBillSyncObject(bill);
        return await this.syncEntity(billSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync ap bill with err ${error}`);
      }
    }, {}, 'bill');
  }

  async _getApPaymentEntriesLookupDict({ lspId, details }) {
    logger.debug(`SIConnector: _getApPaymentEntriesLookupDict started. lspId: ${lspId}`);
    const billsNo = details.filter((e) => e.appliedToType === 'bill').map((e) => e.appliedToNo);
    logger.debug(`SIConnector: Building adjustments no list. lspId: ${lspId}`);
    const adjustmentsNo = [
      ...details.filter((e) => e.appliedToType === 'billAdjustment').map((e) => e.appliedToNo),
      ...details.filter((e) => !_.isNil(e.appliedFromNo)).map((e) => e.appliedFromNo),
    ];
    logger.debug(`SIConnector: Getting metadata for bills started. lspId: ${lspId}`);
    const siBills = await Promise.map(billsNo, async (no) => {
      const metadata = await this.getSiMetadata(
        { lspId, no },
        mongooseSchema.Bill,

        payloadsApBill.exist,

        SI_NAME_AP_BILL,
      );
      return { ...metadata, no };
    });
    logger.debug(`SIConnector: Getting metadata for bill adjustments started. lspId: ${lspId}`);
    const siAdjustments = await Promise.map(adjustmentsNo, async (adjustmentNo) => {
      const metadata = await this.getSiMetadata(
        { lspId, adjustmentNo },
        mongooseSchema.BillAdjustment,

        payloadsApAdjustment.exist,

        SI_NAME_AP_ADJUSTMENT,
      );
      return { ...metadata, no: adjustmentNo };
    });
    logger.debug(`SIConnector: Finished getting metadata for bills and bill adjustments. lspId: ${lspId}`);
    const siEntities = [...siBills, ...siAdjustments];
    const siEntitiesLookupDict = {
      ...siEntities.reduce((agg, b) => ({ ...agg, [b.no]: b.RECORDNO }), {}),
    };
    logger.debug(`SIConnector: Finished _getApPaymentEntriesLookupDict. lspId: ${lspId}`);
    return siEntitiesLookupDict;
  }

  async buildApPaymentSyncObject(apPayment, session) {
    let isMocking = false;
    const { _id, lspId, vendor } = apPayment;
    const apPaymentVendorId = _.get(vendor, '_id', vendor);
    const mongoCollection = 'apPayments';
    let siVendor;
    logger.debug(`SIConnector: buildApPaymentSyncObject: apPayment ${apPayment._id} lspId ${apPayment.lspId} _id ${_id} lspId ${lspId}`);
    logger.debug(`SIConnector: prepare call. Syncing apPayment vendor ${apPaymentVendorId} ApPayment: ${apPayment._id} lspId ${apPayment.lspId}`);
    try {
      [siVendor] = await this.syncUsers({ _id: apPaymentVendorId }, {
        throwError: true, shouldSkipVendorSync: this.shouldGetPayloadWithoutSync, session,
      });
      if (!isProduction) {
        const vendorInDb = await mongooseSchema.User.findOne({
          _id: apPaymentVendorId,
        }, { siConnector: 1 });
        isMocking = _.get(vendorInDb, 'siConnector.isMocked', false);
      } else if (!isMocking && _.isNil(siVendor)) {
        const errorMessage = `Failed syncing user with id: ${apPaymentVendorId}`;
        logger.debug(errorMessage);
        throw new Error(errorMessage);
      }
      logger.debug(`SIConnector: prepare call. Synced apPayment vendor ${apPaymentVendorId} ApPayment: ${apPayment._id} lspId ${apPayment.lspId}`);
      const siVendorId = _.get(siVendor, 'VENDORID', apPaymentVendorId);
      const vendorId = isMocking ? apPaymentVendorId : siVendorId;
      logger.debug(`SIConnector: _getApPaymentEntriesLookupDict call. ApPayment: ${apPayment._id} lspId ${apPayment.lspId}`);
      const siEntitiesLookupDict = await this._getApPaymentEntriesLookupDict(apPayment);
      logger.debug(`SIConnector: _getApPaymentEntriesLookupDict finished. ApPayment: ${apPayment._id} lspId ${apPayment.lspId}`);
      logger.debug(`SIConnector: generateExtraPayloadFieldsApPayment call. ApPayment: ${apPayment._id} lspId ${apPayment.lspId}`);
      const syncPayload = generateExtraPayloadFieldsApPayment(
        { ...apPayment, vendorId },
        siEntitiesLookupDict,
      );
      return {
        dbEntity: apPayment,
        syncPayload,
        siName: SI_NAME_AP_PAYMENT,
        mongoCollection,
        payloads: payloadsApPayment,
        postSync: () => sendVendorNotifications(apPayment),
        reverseFunctionName: SI_NAME_AP_PAYMENT_REVERSE_FUNCTION,
      };
    } catch (e) {
      logger.debug(`SIConnector: Failed building apPayment sync Object for apPaymentId: ${apPayment._id}`);
      await this.connector
        .markEntityAsSyncFinished(mongoCollection, { _id: apPayment._id }, { error: e.message });
      throw e;
    }
  }

  getApPayments(query) {
    return mongooseSchema.ApPayment.find(query)
      .populate({ path: 'vendor', options: { withDeleted: true } })
      .populate({ path: 'paymentMethod', select: 'name', options: { withDeleted: true } })
      .populate({ path: 'bankAccount', select: 'no', options: { withDeleted: true } })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .lean();
  }

  async syncApPayments(query, options) {
    query.status = 'posted';
    logger.debug(`SIConnector: syncApPayments: apPayment ${JSON.stringify(query)}`);
    const cursor = this.getApPayments(query).cursor({ batchSize: this.batchSize });
    logger.debug('SIConnector: syncApPayments: buildApPaymentSyncObject call');
    return cursorMapAsyncHelper(cursor, async (apPayment) => {
      let apPaymentSyncObject;
      try {
        apPaymentSyncObject = await this.buildApPaymentSyncObject(apPayment);
        return await this.syncEntity(apPaymentSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync ap payment with err ${error}`);
      }
    }, {}, 'apPayment');
  }

  async buildArAdjustmentSyncObject(arAdjustment) {
    const companyId = _.get(arAdjustment, 'company._id', arAdjustment.company);
    const siCustomer = await this.getSiMetadata(
      { _id: companyId },
      mongooseSchema.Company,
      payloadsCompany.exist,

      SI_NAME_COMPANY,
    );
    const syncPayload = generateExtraPayloadFieldsArAdjustment(
      { ...arAdjustment, customerId: siCustomer.CUSTOMERID },
    );
    return {
      dbEntity: arAdjustment,
      syncPayload,
      siName: SI_NAME_AR_ADJUSTMENT,
      mongoCollection: 'arAdjustments',
      payloads: payloadsArAdjustment,
    };
  }

  getArAdjustments(query) {
    return mongooseSchema.ArAdjustment.findWithDeleted(query)
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .lean();
  }

  async syncArAdjustments(query, options) {
    const cursor = this.getArAdjustments(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (arAdjustment) => {
      let arAdjustmentSyncObject;
      try {
        arAdjustmentSyncObject = await this.buildArAdjustmentSyncObject(arAdjustment);
        return await this.syncEntity(arAdjustmentSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync arInvoice with _id ${arAdjustment._id}. ${error}`);
      }
    }, {}, 'arAdjustment');
  }

  async buildArAdvanceSyncObject(arAdvance) {
    const companyId = _.get(arAdvance, 'company._id', arAdvance.company);
    const siCustomer = await this.getSiMetadata(
      { _id: companyId },
      mongooseSchema.Company,
      payloadsCompany.exist,
      SI_NAME_COMPANY,
    );
    const syncPayload = { ...arAdvance, customerId: siCustomer.CUSTOMERID };
    return {
      dbEntity: arAdvance,
      syncPayload,
      siName: SI_NAME_AR_ADVANCE,
      mongoCollection: 'arAdvances',
      payloads: payloadsArAdvance,
      reverseFunctionName: SI_NAME_AR_PAYMENT_REVERSE_FUNCTION,
    };
  }

  getArAdvances(query) {
    return mongooseSchema.ArAdvance.find(query)
      .populate({ path: 'bankAccount', select: 'no', options: { withDeleted: true } })
      .populate({ path: 'paymentMethod', select: 'name', options: { withDeleted: true } })
      .populate({ path: 'lspId', select: 'timezone lspAccountingPlatformLocation', options: { withDeleted: true } })
      .lean();
  }

  async syncArAdvances(query, options) {
    const cursor = this.getArAdvances(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (arAdvance) => {
      let arAdvanceSyncObject;
      try {
        arAdvanceSyncObject = await this.buildArAdvanceSyncObject(arAdvance);
        return await this.syncEntity(arAdvanceSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync arInvoice with _id ${arAdvance._id}. ${error}`);
      }
    }, {}, 'arAdvance');
  }

  async buildArInvoiceSyncObject(arInvoice) {
    const companyId = _.get(arInvoice, 'company._id', arInvoice.company);
    const siCustomer = await this.getSiMetadata(
      { _id: companyId },
      mongooseSchema.Company,
      payloadsCompany.exist,
      SI_NAME_COMPANY,
    );
    const syncPayload = generateExtraPayloadFieldsArInvoice(
      { ...arInvoice, customerId: siCustomer.CUSTOMERID },
    );
    return {
      dbEntity: arInvoice,
      syncPayload,
      siName: SI_NAME_AR_INVOICE,
      mongoCollection: 'arInvoices',
      payloads: payloadsArInvoice,
      reverseFunctionName: SI_NAME_AR_INVOICE_REVERSE_FUNCTION,
    };
  }

  getArInvoices(query) {
    return mongooseSchema.ArInvoice.findWithDeleted(query)
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .lean();
  }

  async syncArInvoices(query, options) {
    query.status = 'Posted';
    const cursor = this.getArInvoices(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (arInvoice) => {
      let arInvoiceSyncObject;
      try {
        arInvoiceSyncObject = await this.buildArInvoiceSyncObject(arInvoice);
        return await this.syncEntity(arInvoiceSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync arInvoice with _id ${arInvoice._id}. ${error}`);
      }
    }, {}, 'arInvoice');
  }

  async _getArPaymentEntriesLookupDict({ lspId, source, target }) {
    const portalEntitiesNo = target.map((t) => t.no);

    if (!_.isEmpty(source)) {
      portalEntitiesNo.push(source);
    }
    const fetchSiInfo = async (no) => {
      let siMetadata;

      if (isAdvance(no)) {
        siMetadata = await this.getSiMetadata(
          { lspId, no },
          mongooseSchema.ArAdvance,
          payloadsArAdvance.exist,
          SI_NAME_AR_ADVANCE,
        );
      } else if (isInvoice(no)) {
        siMetadata = await this.getSiMetadata(
          { lspId, no },
          mongooseSchema.ArInvoice,
          payloadsArInvoice.exist,
          SI_NAME_AR_INVOICE,
        );
      } else if (isAdjustment(no)) {
        siMetadata = await this.getSiMetadata(
          { lspId, no },
          mongooseSchema.ArAdjustment,
          payloadsArAdjustment.exist,
          SI_NAME_AR_ADJUSTMENT,
        );
      }
      return { no, ...siMetadata };
    };
    const siEntities = await Promise.mapSeries(portalEntitiesNo, (no) => fetchSiInfo(no));
    const siEntitiesLookupDict = {
      ...siEntities.reduce((agg, b) => ({ ...agg, [b.no]: b.RECORDNO }), {}),
    };
    return siEntitiesLookupDict;
  }

  async buildArPaymentSyncObject(arPayment) {
    const companyId = _.get(arPayment, 'company._id', arPayment.company);
    const siCustomer = await this.getSiMetadata(
      { _id: companyId },
      mongooseSchema.Company,
      payloadsCompany.exist,
      SI_NAME_COMPANY,
    );
    const siEntitiesLookupDict = await this._getArPaymentEntriesLookupDict(arPayment);
    const syncPayload = generateExtraPayloadFieldsArPayment({ ...arPayment, customerId: siCustomer.CUSTOMERID }, siEntitiesLookupDict);
    return {
      dbEntity: arPayment,
      syncPayload,
      siName: SI_NAME_AR_PAYMENT,
      mongoCollection: 'arPayments',
      payloads: payloadsArPayment,
      reverseFunctionName: SI_NAME_AR_PAYMENT_REVERSE_FUNCTION,
    };
  }

  getArPayments(query) {
    return mongooseSchema.ArPayment.findWithDeleted(query)
      .populate({ path: 'method', select: 'name', options: { withDeleted: true } })
      .populate({ path: 'bankAccount', select: 'no', options: { withDeleted: true } })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .lean();
  }

  async syncArPayments(query, options) {
    const cursor = this.getArPayments(query).cursor({ batchSize: this.batchSize });
    return cursorMapAsyncHelper(cursor, async (arPayment) => {
      let arPaymentSyncObject;
      try {
        arPaymentSyncObject = await this.buildArPaymentSyncObject(arPayment);
        return await this.syncEntity(arPaymentSyncObject, options);
      } catch (error) {
        logger.debug(`Failed to sync arInvoice with _id ${arPayment._id}. ${error}`);
      }
    }, {}, 'arPayment');
  }

  async compilePayloadForEntity(syncEntityObject) {
    const { payloads, syncPayload } = syncEntityObject;
    const payloadName = payloads[this.mockPayloadXMLType];
    const payload = await connector.getCompiledPayloadByEntity(payloadName, syncPayload);
    return payload;
  }

  async syncAllRecordsFromEntity(lspId, entityName) {
    try {
      const entityStrategy = _.get(this.entitySyncMap, entityName).bind(this);
      logger.debug(`SIConnector: syncAllRecordsFromEntity from ${entityName}`);
      const connectorInDb = await this.connector.getConnectorByLspId(lspId);
      logger.debug(`SIConnector: getting connector from db for lspId ${lspId}`);
      const canSyncAllEntities = !connectorInDb.deleted && !connectorInDb.hasAuthError;
      if (canSyncAllEntities) {
        const query = await this.connector.buildQueryForNotSyncedEntities(lspId, this.mock);
        logger.debug(`SIConnector: Executing syncAllRecordsFromEntity for ${entityName} for lspId ${lspId}`);
        return entityStrategy(query);
      }
      const message = (connectorInDb.deleted && `SI connector for lspId ${lspId} is disabled`)
        || (connectorInDb.hasAuthError && `SI connector for lspId ${lspId} has authentication error`);
      logger.debug(message, this.connector.logMeta);
    } catch (error) {
      logger.debug(`SIConnector: syncAllRecordsFromEntity for ${entityName} error ${error}`);
    }
  }

  async syncEntity(syncEntityObject, options) {
    if (this.shouldGetPayloadWithoutSync) {
      return this.compilePayloadForEntity(syncEntityObject);
    }
    const {
      dbEntity, siName, payloads, mongoCollection, syncPayload,
    } = syncEntityObject;
    const { _id } = dbEntity;
    const session = _.get(options, 'session', null);

    if (_.get(dbEntity, 'siConnector.isMocked', false)) {
      this.connector = this.getMockConnector();
    }
    const lspId = this.connector.getLspIdFromEntity(dbEntity);
    const connectorInDb = await this.connector.getConnectorByLspId(lspId);
    const debugMessage = `${siName} with _id ${_id} and lspId ${lspId}`;

    logger.debug(`SIConnector: Starting sync for entity ${debugMessage}`, this.connector.logMeta);
    if (this.mockSchedulerInstantSync && !connectorInDb.enableInstantSync) {
      logger.debug(
        `SIConnector: Instant sync is disabled. Entity ${debugMessage} will be synced by a scheduler later`,
        this.connector.logMeta,
      );
      return;
    }
    const throwError = _.get(options, 'throwError', false);

    try {
      logger.debug(`SIConnector: Locking entity ${siName} entity with _id ${_id}`, this.connector.logMeta);
      const entityLockSuccess = await this.connector.markEntityAsSyncInProgress(mongoCollection, { _id }, session);
      if (entityLockSuccess) {
        logger.debug(`SIConnector: Locked entity ${siName} entity with _id ${_id}`, this.connector.logMeta);
        const metadata = await this.connector.syncEntity(syncPayload, payloads, siName);
        if (_.isFunction(syncEntityObject.postSync)) {
          logger.debug(`SIConnector: Executing post sync for ${siName} entity with _id ${_id}`, this.connector.logMeta);
          await syncEntityObject.postSync();
        }
        await this.connector
          .markEntityAsSyncFinished(mongoCollection, { _id }, { metadata }, session);
        logger.debug(`SIConnector: Finished syncing entity ${_id}`, this.connector.logMeta);
        return metadata;
      }
      logger.debug(`Failed to aquire a lock for entity ${debugMessage}`, this.connector.logMeta);
    } catch (e) {
      logger.error(e, this.connector.logMeta);
      await this.connector
        .markEntityAsSyncFinished(mongoCollection, { _id }, { error: e.message }, session);
      if (throwError) {
        throw new Error(`Failed to sync ${syncEntityObject.siName} because ${e}`);
      }
    }
    logger.debug(`SIConnector: Finished sync for entity ${debugMessage}`, this.connector.logMeta);
  }

  async getSiMetadata(query, schema, payload, siName) {
    logger.debug(`SIConnector: Getting si metadata for ${siName} started`);
    const method = _.isFunction(schema.findOneWithDeleted) ? 'findOneWithDeleted' : 'findOne';
    const spaEntity = await schema[method](query).lean();

    if (_.isNil(spaEntity)) {
      logger.error(`SIConnector: Getting si metadata failed for ${schema.modelName}. Entity not found`);
      throw new Error(`Entity ${schema.modelName} was not found in portal`);
    }
    const { _id, siConnector } = spaEntity;
    let metadata = _.get(spaEntity, 'siConnector.metadata');
    if (_.isEmpty(metadata)) {
      const response = await this.connector.sendPayloadRequest(payload, spaEntity);
      logger.debug(`SIConnector: Sending si metadata payload for ${schema.modelName}. ${payload}`);
      if (response.data.count === '0') {
        logger.error(`SIConnector: Failed to get si metadata payload for ${schema.modelName}. ${response}`);
        throw new Error(`Entity ${schema.modelName} with _id ${_id} does not exist in Sage Intacct`);
      }
      metadata = this.connector.getSiMetadataFromResponse(response, siName);
      if (_.isNil(metadata) || _.isArray(metadata)) {
        logger.error(`Bad metadata ${JSON.stringify(metadata)} for entity ${schema.modelName} with _id ${_id}`);
        throw new Error(`Bad metadata ${JSON.stringify(metadata)} for entity ${schema.modelName} with _id ${_id}`);
      }
      await this.connector.updateEntitySiConnectorInfo(
        schema.collection.collectionName,
        { _id },

        { ...siConnector, metadata },
      );
    }
    return metadata;
  }

  async voidArAdvance(_id, session) {
    const advance = await mongooseSchema.ArAdvance.findOne({ _id })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .session(session)
      .lean();
    const arAdvanceSyncObject = await this.buildArAdvanceSyncObject(advance);
    await this.voidEntity(arAdvanceSyncObject, session);
  }

  async voidArPayment(_id, session) {
    const payment = await mongooseSchema.ArPayment.findOne({ _id })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .session(session)
      .lean();
    const arPaymentVoidPayload = await this.buildArPaymentSyncObject(payment);
    await this.voidEntity(arPaymentVoidPayload, session);
  }

  async voidApPayment(_id, session) {
    const apPayment = await mongooseSchema.ApPayment.findOne({ _id })
      .populate({ path: 'vendor', options: { withDeleted: true } })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .session(session)
      .lean();
    const apPaymentSyncObject = await this.buildApPaymentSyncObject(apPayment, session);
    await this.voidEntity(apPaymentSyncObject, session);
  }

  async voidArInvoice(_id, session) {
    const arInvoice = await mongooseSchema.ArInvoice.findOneWithDeleted({ _id })
      .populate({ path: 'lspId', select: 'timezone', options: { withDeleted: true } })
      .session(session)
      .lean();
    const arInvoiceSyncObject = await this.buildArInvoiceSyncObject(arInvoice);
    await this.voidEntity(arInvoiceSyncObject, session);
  }

  async voidEntity(syncEntityObject, session) {
    const {
      dbEntity, payloads, mongoCollection, reverseFunctionName,
    } = syncEntityObject;
    const { _id, siConnector: { metadata } } = dbEntity;

    logger.info(dbEntity.voidDetails, this.connector.logMeta);
    if (_.isNil(dbEntity)) {
      throw new Error(`Entity with id ${_id} was not found in portal`);
    }
    if (_.has(dbEntity, 'siConnector.connectorStartedAt')) {
      throw new Error(`Cannot void entity with _id ${_id} because it is being synced`);
    }
    if (_.isEmpty(metadata)) {
      logger.debug(`Entity with _id ${_id} does not exists in SI and won't be voided there.`, this.connector.logMeta);
      return;
    }
    let error;

    try {
      await this.connector.sendPayloadRequest(payloads.void, { ...dbEntity, reverseFunctionName });
    } catch (e) {
      error = e;
    }
    await this.connector.markEntityAsSyncFinished(
      mongoCollection,
      { _id },
      { metadata, isVoided: _.isNil(error) },
      session,
    );
    if (!_.isNil(error)) {
      throw error;
    }
  }

  testConnectivity(lspId) {
    return this.connector.testConnectivity(lspId);
  }
}

module.exports = SiConnectorAPI;
