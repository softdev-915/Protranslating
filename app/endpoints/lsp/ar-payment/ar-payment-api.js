const _ = require('lodash');
const { Types: { ObjectId }, isValidObjectId } = require('mongoose');
const Promise = require('bluebird');
const Big = require('big.js');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');
const {
  _getExtraQueryParams,
  _getExtraPipelines,
  _getBeforeMatchPipeline,
  formatLineItem,
  isAdvance,
  isAdjustment,
  DEBIT_MEMO,
  CREDIT_MEMO,
  INVOICE,
  PAYMENT,
  NON_APPLICABLE_VALUE,
  newLineItemsQuery,
} = require('./ar-payment-api-helpers');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const assignAttachmentManagementMethods = require('../../../utils/attachments');
const CloudStorage = require('../../../components/cloud-storage');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');

class PaymentApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
    this.cloudStorage = new CloudStorage(this.configuration);
    assignAttachmentManagementMethods(this, this.schema.ArPayment);
  }

  async list(filters) {
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };
    if (!this.user.has('AR-PAYMENT_READ_ALL')) {
      this._setRoleFilters(query);
    }
    const list = await searchFactory({
      model: this.schema.ArPayment,
      filters: query,
      extraPipelines: _getExtraPipelines(),
      extraQueryParams: _getExtraQueryParams(),
      utcOffsetInMinutes: filters.__tz,
      beforeMatchPipeline: _getBeforeMatchPipeline(),
    });
    return { list, total: list.length };
  }

  async getById(_id, lean = true) {
    const payment = await this.schema.ArPayment
      .findOne({ lspId: this.lspId, _id })
      .populate([
        {
          path: 'company',
          select: '_id name hierarchy',
          options: { lean: true, withDeleted: true },
        }, {
          path: 'bankAccount',
          select: 'name',
          options: { lean: true, withDeleted: true },
        }, {
          path: 'method',
          select: 'name',
          options: { lean: true, withDeleted: true },
        },
      ]);
    if (_.isNil(payment)) {
      throw new RestError(404, { message: 'Payment not found' });
    }
    if (lean) {
      return payment.toObject();
    }
    return payment;
  }

  async getPaymentLineItems(companyId, currencyId, source, target) {
    const query = newLineItemsQuery(companyId, currencyId);
    const lineItems = {
      source: [],
      target: [],
    };

    if (!_.isNil(source) && source === CREDIT_MEMO) {
      query.type = CREDIT_MEMO;
      lineItems.source = await this.schema.ArAdjustment.find(query).lean();
    } else if (!_.isNil(source)) {
      lineItems.source = await this.schema.ArAdvance.find(query).lean();
    }

    if (target === DEBIT_MEMO) {
      query.type = DEBIT_MEMO;
      lineItems.target = await this.schema.ArAdjustment.find(query).lean();
    } else if (target === INVOICE) {
      delete query.type;
      lineItems.target = await this.schema.ArInvoice.find(query).lean();
    }

    lineItems.source = lineItems.source.map((li) => formatLineItem(li));
    lineItems.target = lineItems.target.map((li) => formatLineItem(li));
    return lineItems;
  }

  async edit(paymentDto) {
    const arPayment = await this.getById(paymentDto._id, false);
    const isDirectPayment = arPayment.sourceType === PAYMENT;
    const updateFields = ['description', 'receiptDate'];
    if (isDirectPayment) {
      if (_.isEmpty(paymentDto.bankAccount)) {
        await this._assignUndepositedAccountIdentifier(paymentDto);
        delete paymentDto.bankAccount;
      }
      updateFields.push('method', 'docNo', 'bankAccount', 'undepositedAccountIdentifier');
    }
    _.assign(arPayment, _.pick(paymentDto, updateFields));
    await arPayment.save();
    const editedArPayment = await this.getById(arPayment.id);
    (new SiConnectorAPI(this.flags)).syncArPayments({ _id: arPayment._id })
      .catch((e) => this.logger.error(e));
    return editedArPayment;
  }

  async create(paymentDto) {
    let paymentDoc;
    this.logger.debug(`Ar payment: ${this.user.email} triggered ar payment creation`);
    await this.provideTransaction(async (session) => {
      this.logger.debug(`Ar payment: ${this.user.email} Locking company hierarchy ${paymentDto.company}`);
      await this.schema.Company.lockCompanyHierarchy(paymentDto.company, session);
      this.logger.debug(`Ar payment: ${this.user.email} finished locking company hierarchy ${paymentDto.company}`);
      await this._populatePaymentEntries(paymentDto, session);
      const { source, target } = paymentDto;
      const docsChanged = target.map((t) => t.doc);
      const exchangeDetails = await this.schema.Lsp.getExchangeDetails(this.lspId, paymentDto.currency);
      if (_.isNil(exchangeDetails)) {
        throw new RestError(400, { message: 'No exhange rate found for selected currency' });
      }
      const amount = paymentDto.amount.toFixed(2);
      const { base, quote, quotation } = exchangeDetails;
      const isTestEmail = !_.isNil(_.get(this.user, 'email', '').match('@sample.com'));
      _.set(paymentDto, 'siConnector', {
        isMocked: isTestEmail && !this.isProd,
        isSynced: false,
        error: null,
      });
      paymentDoc = new this.schema.ArPayment(paymentDto);
      this.logger.debug(`Ar payment: ${this.user.email} created model`);
      paymentDoc.accounting = {
        currency: _.pick(quote, ['_id', 'isoCode']),
        exchangeRate: quotation,
        localCurrency: _.pick(base, ['_id', 'isoCode']),
        amount,
        amountInLocal: new Big(amount).div(quotation).toNumber().toFixed(2),
      };
      if (!_.isEmpty(source)) {
        paymentDoc.source = source.no;
        docsChanged.push(source);
      }
      paymentDoc.target = await this._distributeAllocatedAmount(source, target, amount);
      paymentDoc.lspId = this.lspId;
      this.logger.debug(`Ar payment: ${this.user.email} Saving model`);
      await paymentDoc.save({ session });
      this.logger.debug(`Ar payment: ${this.user.email} Saving changed docs`);
      await Promise.all(docsChanged.map((doc) => doc.pay(session)));
      this.logger.debug(`Ar payment: ${this.user.email} consolidating company balance ${paymentDoc.company}`);
      await this.schema.Company.consolidateBalance(paymentDoc.company, session);
      this.logger.debug(`Ar payment: ${this.user.email} finished consolidating company balance ${paymentDoc.company}`);
    }, undefined, `Ar payment: ${this.user.email}`);
    this.logger.debug(`Ar payment: ${this.user.email} sync ar payment ${_.get(paymentDoc, '_id')}`);
    (new SiConnectorAPI(this.flags)).syncArPayments({ _id: paymentDoc._id })
      .catch((e) => this.logger.error(e));
    return paymentDoc.toObject();
  }

  async _distributeAllocatedAmount(source, target, amount) {
    const paidTargets = [];
    const sourceNo = _.get(source, 'no');

    target.forEach((t) => {
      const { applied: amountToPay, ccPayment } = t;
      if (!_.isEmpty(source)) {
        source.accounting.paid = new Big(source.accounting.paid).plus(amountToPay);
      }
      t.doc.accounting.paid = new Big(t.doc.accounting.paid).plus(amountToPay);
      const { no, date, dueDate } = t.doc;
      paidTargets.push({
        no, date, dueDate, amount: amountToPay, ccPayment,
      });
      if (isAdvance(sourceNo) || isAdjustment(sourceNo)) {
        source.appliedTo = source.appliedTo === NON_APPLICABLE_VALUE ? no : `${source.appliedTo}, ${no}`;
      }
      amount = (new Big(amount)).minus(amount).toNumber();
      if (amount < 0) {
        throw new RestError(400, { message: 'Invalid Payment Amount' });
      }
    });
    return paidTargets;
  }

  async export(filters) {
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };
    const queryObj = await exportFactory(
      this.schema.ArPayment,
      query,
      _getExtraPipelines(),
      _getExtraQueryParams(),
      filters.__tz,
      _getBeforeMatchPipeline(),
    );
    const csvExporter = new CsvExport(queryObj, {
      schema: this.schema.ArPayment,
      lspId: this.lspId,
      logger: this.logger,
      configuration: this.configuration,
      filters: query,
    });
    return csvExporter.export();
  }

  async void(_id, details) {
    _id = new ObjectId(_id);
    const siApi = new SiConnectorAPI(this.flags);
    const paymentInDb = await this.schema.ArPayment.findOne({ _id }).lean();
    if (_.get(paymentInDb, 'siConnector.isSynced', false)) {
      await siApi.getSiMetadata(_id, this.schema.ArPayment, 'arPaymentList', 'arpayment');
    }
    await this.provideTransaction(async (session) => {
      await this.schema.Company.lockCompanyHierarchy(paymentInDb.company, session);
      const payment = await this.schema.ArPayment.findOne({ _id }).session(session);
      if (!_.isEmpty(payment.source)) {
        const paymentObject = payment.toObject();
        await this._getSourceEntity(paymentObject, false, session);
        const { source: sourceDoc } = paymentObject;
        sourceDoc.accounting.paid = new Big(sourceDoc.accounting.paid).minus(payment.accounting.amount);
        if (isAdvance(sourceDoc.no) || isAdjustment(sourceDoc.no)) {
          const targetNos = payment.target.map(({ no }) => no);
          const appliedToNos = sourceDoc.appliedTo.split(',').map((no) => no.trim());
          sourceDoc.appliedTo = _.difference(appliedToNos, targetNos).join(', ');
        }
        await sourceDoc.save({ session });
      }
      await this._getTargetEntities(payment, false, session);
      await Promise.map(payment.target, ({ doc, amount }) => {
        doc.accounting.paid = new Big(doc.accounting.paid).minus(amount);
        doc.accounting.paidInLocal = new Big(doc.accounting.paid).div(
          doc.accounting.exchangeRate,
        ).toFixed(2);
        doc.setAccountingDetails();
        doc.save({ session });
      });
      await payment.void(session, details);
      await this.schema.Company.consolidateBalance(paymentInDb.company, session);
      await siApi.voidArPayment(_id, session);
    });
    return this.getById(_id, false);
  }

  async _populatePaymentEntries(paymentDto, session) {
    if (paymentDto.sourceType === PAYMENT && _.isEmpty(paymentDto.bankAccount)) {
      await this._assignUndepositedAccountIdentifier(paymentDto);
    }
    if (!_.isEmpty(paymentDto.source)) {
      await this._getSourceEntity(paymentDto, true, session);
    }
    await this._getTargetEntities(paymentDto, true, session);
  }

  async _getSourceEntity(paymentDto, performValidation = true, session) {
    const { sourceType, source } = paymentDto;
    const schema = sourceType === CREDIT_MEMO
      ? this.schema.ArAdjustment
      : this.schema.ArAdvance;
    const query = isValidObjectId(source) ? { _id: source } : { no: source };
    this.logger.debug(`Ar payment: ${this.user.email} Locking source ${sourceType === CREDIT_MEMO ? 'ArAdjustment' : 'ArAdvance'} ${source}`);
    paymentDto.source = await schema.lockDocument(query, session);
    this.logger.debug(`Ar payment: ${this.user.email} finished locking source entity ${source}`);
    if (performValidation) {
      this._performEntityValidation(paymentDto.source);
    }
  }

  async _getTargetEntities(paymentDto, performValidation = true, session) {
    const schema = paymentDto.targetType === INVOICE
      ? this.schema.ArInvoice
      : this.schema.ArAdjustment;
    await Promise.map(paymentDto.target, async (li) => {
      const query = _.isNil(li._id) ? { no: li.no } : { _id: li._id };
      this.logger.debug(`Ar payment: ${this.user.email} Locking target entity ${paymentDto.targetType === INVOICE ? 'ArInvoice' : 'ArAdjustment'} ${query}`);
      li.doc = await schema.lockDocument(query, session);
      this.logger.debug(`Ar payment: ${this.user.email} finished Locking target entity ${query}`);
      if (performValidation) {
        this._performEntityValidation(li.doc);
      }
    });
  }

  _setRoleFilters(query) {
    if (this.user.has('AR-PAYMENT_READ_COMPANY')) {
      const userCompany = _.get(this.user, 'company.name');
      query.company = new RegExp(_.escapeRegExp(userCompany), 'i');
    } else if (this.user.has('AR-PAYMENT_READ_OWN')) {
      query.createdBy = this.user.email;
    }
  }

  async _assignUndepositedAccountIdentifier(payment) {
    const lsp = await this.schema.Lsp.findOne({ _id: this.lspId });
    const identifier = _.get(lsp, 'paymentGateway.account');
    if (_.isNil(identifier)) {
      throw new RestError(400, { message: 'No selected bank account' });
    }
    payment.undepositedAccountIdentifier = identifier;
  }

  _performEntityValidation(entity) {
    const balance = _.get(entity, 'accounting.balance', 0);
    if (balance <= 0) {
      throw new RestError(400, { message: `Entity ${entity.no} is already paid` });
    }
    const isSynced = _.get(entity, 'siConnector.isSynced', false);
    if (!isSynced) {
      throw new RestError(400, { message: `Entity ${entity.no} is not synced` });
    }
  }
}

module.exports = PaymentApi;
