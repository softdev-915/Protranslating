const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const Promise = require('bluebird');
const mongoConnection = require('../../../components/database/mongo');
const apiResponse = require('../../../components/api-response');
const { CsvExport } = require('../../../utils/csvExporter');
const EmailQueue = require('../../../components/email/templates');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const { provideTransaction } = require('../../../components/database/mongo/utils');
const AbstractRequestAPI = require('../request/abstract-request-api');
const { areObjectIdsEqual } = require('../../../utils/schema');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { parsePaginationFilter } = require('../../../utils/request');
const {
  sum, bigJsToNumber, ensureNumber, decimal128ToNumber,
} = require('../../../utils/bigjs');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const assignAttachmentManagementMethods = require('../../../utils/attachments');
const { getRoles, hasRole } = require('../../../utils/roles');

const { RestError } = apiResponse;
const ID_PREFIX_BILL_ADJUSTMENT = 'BA_';
const ID_PREFIX_BILL = 'B_';
const ACCOUNT_PAYABLE_TYPE_BILL_ADJUSTMENT = 'billAdjustment';
const ACCOUNT_PAYABLE_TYPE_BILL = 'bill';
const FILTER_KEYS = {
  bill: 'details.appliedTo',
};
const DRAFTED_STATUS = 'drafted';
const convertApPaymentDecimalsToNumbers = (apPayment) => {
  apPayment.totalPaymentAmount = _.defaultTo(decimal128ToNumber(apPayment.totalPaymentAmount), 0);
  apPayment.totalAppliedCredit = _.defaultTo(decimal128ToNumber(apPayment.totalAppliedCredit), 0);
  apPayment.details = apPayment.details.map((details) => {
    details.appliedCredits = _.defaultTo(decimal128ToNumber(details.appliedCredits), 0);
    details.paymentAmount = _.defaultTo(decimal128ToNumber(details.paymentAmount), 0);

    return details;
  });

  return apPayment;
};

const handleFileUpload = async function (apPaymentId, fileUploadInfo) {
  const apPayment = await this.entitySchema.findOne({ _id: apPaymentId });

  if (_.isNil(apPayment)) {
    throw new RestError(500, { message: `AP PAyment with id: ${apPaymentId} was not found` });
  }
  const canUpdateAttachments = this._canUpdateAttachments(apPayment.vendor);

  if (!canUpdateAttachments) {
    throw new RestError(403, { message: 'User is not authorized' });
  }
  const attachments = _.get(apPayment, 'attachments', []);

  apPayment.attachments = _.unionBy([fileUploadInfo], attachments, 'name');
  await apPayment.save();

  return { attachments: apPayment.attachments };
};

const deleteFile = async function (apPaymentId, attachmentId) {
  const apPayment = await this.entitySchema.findOne({ _id: apPaymentId });

  if (_.isNil(apPayment)) {
    throw new RestError(500, { message: `AP PAyment with id: ${apPaymentId} was not found` });
  }
  const canUpdateAttachments = this._canUpdateAttachments(apPayment.vendor);

  if (!canUpdateAttachments) {
    throw new RestError(403, { message: 'User is not authorized' });
  }
  const attachments = _.get(apPayment, 'attachments', []);
  const attachmentToDelete = attachments.find((attachment) => areObjectIdsEqual(attachment._id, attachmentId));

  if (_.isNil(attachmentToDelete)) {
    throw new RestError(404, { message: `Attachment ${attachmentId} not found` });
  }
  await this.cloudStorage.deleteFile(attachmentToDelete.cloudKey);
  apPayment.attachments = _.differenceBy(attachments, [attachmentToDelete], '_id');
  await apPayment.save();
};

const getFileStream = async function getFileStream(apPaymentId, attachmentId) {
  const apPayment = await this.entitySchema.findOne({ _id: apPaymentId });

  if (_.isNil(apPayment)) {
    throw new RestError(500, { message: `AP PAyment with id: ${apPaymentId} was not found` });
  }
  const canUpdateAttachments = this._canUpdateAttachments(apPayment.vendor);

  if (!canUpdateAttachments) {
    throw new RestError(403, { message: 'User is not authorized' });
  }
  const attachments = _.get(apPayment, 'attachments', []);
  const attachment = attachments.find((a) => areObjectIdsEqual(a._id, attachmentId));

  if (_.isNil(attachment)) {
    throw new RestError(404, { message: `Attachment ${attachmentId} not found` });
  }
  const cloudFile = await this.cloudStorage.gcsGetFile(attachment.cloudKey);

  return {
    fileReadStream: cloudFile.createReadStream(),
    filename: attachment.name,
  };
};

class ApPaymentApi extends AbstractRequestAPI {
  constructor(logger, options) {
    options.log = logger;
    super(options);
    this.FilePathFactory = FilePathFactory;
    this.emailQueue = new EmailQueue(
      this.logger,
      this.schema,
      this.configuration,
    );
    this.transactionSession = null;
    assignAttachmentManagementMethods(this, this.schema.ApPayment);
    this.handleFileUpload = handleFileUpload;
    this.detach = deleteFile;
    this.getFileStream = getFileStream;
    this.syncEntityOnCreation = _.get(options, 'flags.syncEntityOnCreation', false);
  }

  canImportCsv() {
    return this.user.has('AP-PAYMENT_CREATE_ALL');
  }

  _canUpdateAttachments(vendorId) {
    const isOwner = areObjectIdsEqual(this.user._id, vendorId);
    const userRoles = getRoles(this.user);
    const canUpdateAll = hasRole('AP-PAYMENT_UPDATE_ALL', userRoles);

    return canUpdateAll || isOwner;
  }

  _getQueryFilters(filters = {}) {
    const query = { lspId: this.lspId };

    if (!_.isEmpty(filters._id)) {
      query._id = filters._id;
    }
    Object.assign(query, _.get(filters, 'paginationParams', {}));
    if (!_.isEmpty(_.get(query, 'filter.bill', ''))) {
      const filter = _.omit(parsePaginationFilter(query.filter), ['bill']);

      filter[FILTER_KEYS.bill] = query.filter.bill;
      query.filter = filter;
    }
    let pipeline = [];

    if (this.user.has('AP-PAYMENT_READ_OWN') && !this.user.has('AP-PAYMENT_READ_ALL')) {
      pipeline.push({
        $match: { vendor: new ObjectId(this.user._id) },
      });
    }
    pipeline = pipeline.concat([
      {
        $lookup: {
          from: 'paymentMethods',
          localField: 'paymentMethod',
          foreignField: '_id',
          as: 'paymentMethod',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'apPaymentVendor',
        },
      },
      {
        $unwind: { path: '$paymentMethod', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'bankAccounts',
          localField: 'bankAccount',
          foreignField: '_id',
          as: 'bankAccount',
        },
      },
      {
        $unwind: { path: '$bankAccount', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          vendorObj: { $arrayElemAt: ['$apPaymentVendor', 0] },
        },
      },
      {
        $addFields: {
          vendorName: {
            $cond: {
              if: { $ne: [{ $ifNull: ['$vendorObj.vendorDetails.vendorCompany', ''] }, ''] },
              then: '$vendorObj.vendorDetails.vendorCompany',
              else: {
                $concat: [
                  { $ifNull: ['$vendorObj.firstName', ''] },
                  ' ',
                  { $ifNull: ['$vendorObj.middleName', ''] },
                  {
                    $cond: {
                      if: { $eq: [{ $ifNull: ['$vendorObj.middleName', ''] }, ''] },
                      then: '',
                      else: ' ',
                    },
                  },
                  { $ifNull: ['$vendorObj.lastName', ''] },
                ],
              },
            },
          },
          ptPayOrPayPal: '$vendorObj.vendorDetails.billingInformation.ptPayOrPayPal',
          totalPaymentAmount: { $sum: '$details.paymentAmount' },
          totalAppliedCredit: { $sum: '$details.appliedCredits' },
          paymentAmount: '$details.paymentAmount',
          creditsToApply: '$details.creditsToApply',
          appliedCredits: '$details.appliedCredits',
          appliedFrom: '$details.appliedFrom',
          appliedFromNo: '$details.appliedFromNo',
          appliedTo: '$details.appliedTo',
          accountPayableId: '$details.appliedTo',
          appliedToNo: '$details.appliedToNo',
          appliedToNoText: {
            $reduce: {
              input: '$details.appliedToNo',
              initialValue: '',
              in: {
                $concat: [
                  '$$value',
                  { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                  '$$this'],
              },
            },
          },
          appliedToTypeText: {
            $reduce: {
              input: '$details.appliedToType',
              initialValue: '',
              in: {
                $concat: [
                  '$$value',
                  { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                  '$$this'],
              },
            },
          },
          vendorCity: '$vendorObj.vendorDetails.address.city',
          vendorCountry: '$vendorObj.vendorDetails.address.country.name',
          vendorState: '$vendorObj.vendorDetails.address.state.name',
          vendorZip: '$vendorObj.vendorDetails.address.zip',
          vendorAddress: {
            $concat: [
              '$vendorObj.vendorDetails.address.line1', ' ', '$vendorObj.vendorDetails.address.line2',
            ],
          },
          amountPaid: {
            $toString: '$amountPaid',
          },
          paymentMethod: '$paymentMethod.name',
          bankAccount: '$bankAccount.name',
          lastSyncDate: '$siConnector.connectorEndedAt',
          isSynced: { $toString: '$siConnector.isSynced' },
          syncError: '$siConnector.error',
        },
      },
      {
        $project: {
          siConnector: 0,
          vendorObj: 0,
          apPaymentVendor: 0,
        },
      },
    ]);

    return {
      query,
      pipeline,
      extraQueryParams: ['vendorName', 'status', 'appliedToNoText', 'appliedToTypeText', 'totalPaymentAmount', 'totalAppliedCredit', 'vendorAddress', 'ptPayOrPayPal',
        'lastSyncDate', 'isSynced', 'syncError', 'vendorCity', 'vendorCountry', 'vendorState', 'vendorZip'],
    };
  }

  async export(filters) {
    this.logger.debug(`User ${this.user.email} retrieved an activity list export file`);
    const { query, pipeline, extraQueryParams } = await this._getQueryFilters(filters);
    const cursor = await exportFactory(
      this.schema.ApPayment,
      query,
      pipeline,
      extraQueryParams,
      filters.__tz,
    );
    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.ApPayment,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters,
    });

    return csvExporter.export();
  }

  /** Returns a csv file
   * @param {Object} filters to filter the ap payments response
   */
  async accountPayableListExport(list) {
    try {
      this.schema.ApPayment.getExportOptions = this.schema.ApPayment
        .getAccountPayableListExportOptions;
      this.schema.ApPayment.setCsvTransformations = this.schema.ApPayment
        .setAccountPayableCsvTransformations;
      const csvExporter = new CsvExport(list, {
        schema: this.schema.ApPayment,
        lspId: this.lspId,
        logger: this.logger,
        configuration: this.configuration,
      });

      return csvExporter.export();
    } catch (e) {
      if (e instanceof RestError) {
        throw e;
      }
      this.logger.error(`Error populating and filtering ap payment records. Error: ${e}`);
      throw new RestError(500, { message: 'Error retrieving ap payment', stack: e.stack });
    }
  }

  async list(filters) {
    const { query, pipeline, extraQueryParams } = this._getQueryFilters(filters);
    const list = await searchFactory({
      model: this.schema.ApPayment,
      filters: query,
      extraPipelines: pipeline,
      extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    });

    return {
      list: list
        .map(convertApPaymentDecimalsToNumbers)
        .map((apPayment) => {
          apPayment.details = this.mergeApPaymentDetails(apPayment.details);

          return apPayment;
        }),
      total: list.length,
    };
  }

  async getById(apPaymentId) {
    const query = { _id: new ObjectId(apPaymentId), lspId: this.lspId };

    if (this.user.has('AP-PAYMENT_READ_OWN') && !this.user.has('AP-PAYMENT_READ_ALL')) {
      query.vendor = new ObjectId(this.user._id);
    }
    let apPayment = await this.schema.ApPayment.findOne(query).populate([
      { path: 'paymentMethod', select: 'name' },
      { path: 'bankAccount', select: 'name' },
      {
        path: 'vendor',
        options: { withDeleted: true },
        select: '_id email firstName lastName vendorDetails.vendorCompany vendorDetails.address vendorDetails.billingInformation.ptPayOrPayPal',
      },
    ]);

    apPayment = convertApPaymentDecimalsToNumbers(apPayment.toObject());
    const apChecks = await this.schema.Check.find({
      apPaymentId, accountPayableId: { $in: apPayment.details.map(({ appliedTo }) => appliedTo) },
    });

    if (!_.isEmpty(apChecks)) {
      apPayment.details = apPayment.details.map((detail) => {
        const apCheck = apChecks.find(({ accountPayableId }) => areObjectIdsEqual(accountPayableId, detail.appliedTo));

        detail.checkNo = _.get(apCheck, 'checkNo', '');

        return detail;
      });
    }
    apPayment.amountPaid = _.get(apPayment, 'amountPaid', 0).toString();
    apPayment.details = this.mergeApPaymentDetails(apPayment.details);

    return apPayment;
  }

  async deductCreditsFromDebitMemos(vendorId, creditsToApply, session) {
    this.logger.debug(`Ap payment: ${this.user.email}. started deductCreditsFromDebitMemos ${vendorId}`);
    const query = { vendor: vendorId, type: 'Debit Memo', adjustmentBalance: { $gt: 0 } };
    const cursor = this.schema.BillAdjustment.find(query, null, { sort: { _id: -1 } })
      .session(session)
      .cursor();
    const result = [];
    this.logger.debug(`Ap payment: ${this.user.email}. deductCreditsFromDebitMemos. Started cursor.eachAsync ${vendorId}`);
    await cursor.eachAsync(async (debitMemo) => {
      const {
        _id, adjustmentNo, adjustmentBalance, adjustmentTotal,
      } = debitMemo;

      if (creditsToApply === 0) {
        return;
      }
      const appliedCredits = _.min([creditsToApply, adjustmentBalance]);
      const amountPaid = debitMemo.amountPaid + appliedCredits;
      const adjBalance = debitMemo.adjustmentBalance - appliedCredits;
      this.logger.debug(`Ap payment: ${this.user.email}. updating BillAdjustment balance ${_id}`);
      await this.schema.BillAdjustment.findOneAndUpdate({
        _id,
        adjustmentBalance: { $gt: 0 },
      }, {
        $set: {
          adjustmentBalance: _.round(ensureNumber(adjBalance), 2),
          amountPaid: _.round(ensureNumber(amountPaid), 2),
        },
      }, { session, new: true });
      this.logger.debug(`Ap payment: ${this.user.email}. finished updating BillAdjustment balance ${_id}`);
      const adjustmentDetails = {
        adjustmentTotal,
        adjustmentBalance: adjBalance,
        amountPaid,
      };

      await this.schema.BillAdjustment.findOneAndUpdate(
        { _id },
        {
          $set: {
            status: this.schema.BillAdjustment.getStatus(adjustmentDetails),
          },
        },
        { session, new: true },
      );
      this.logger.debug(`Ap payment: ${this.user.email}. finished updating BillAdjustment status after balance ${_id}`);
      result.push({ appliedFrom: _id, appliedFromNo: adjustmentNo, appliedCredits });
      creditsToApply -= appliedCredits;
      if (creditsToApply < 0) {
        throw new Error(`Credits to apply cannot be less than 0, failed processing vendor with id: ${vendorId}`);
      }
    });

    return result;
  }

  async updateBillAdjustment(_id, amount, session) {
    this.logger.debug(`Ap payment: ${this.user.email}. Starting updateBillAdjustment ${_id}`);
    await this.schema.BillAdjustment.lockDocument({ _id }, session);
    this.logger.debug(`Ap payment: ${this.user.email}. finished locking BillAdjustment ${_id}`);
    const updatedBillAdjustment = await this.schema.BillAdjustment.findOneAndUpdate(
      {
        _id: new ObjectId(_id),
      },
      {
        $inc: { amountPaid: amount, adjustmentBalance: -amount },
      },
      { session, new: true },
    );
    this.logger.debug(`Ap payment: ${this.user.email}. updated BillAdjustment ${_id}`);
    if (_.isNil(updatedBillAdjustment)) {
      throw new RestError(404, `Failed to adjust balance and amount paid. Bill adjustment _id ${_id} not found`);
    }
    await this.schema.BillAdjustment.findOneAndUpdate(
      { _id: updatedBillAdjustment._id },
      {
        $set: {
          status: this.schema.BillAdjustment.getStatus(updatedBillAdjustment),
        },
      },
      { session, new: true },
    );
    this.logger.debug(`Ap payment: ${this.user.email}. updated BillAdjustment status ${_id}`);
    const { vendor, adjustmentNo } = updatedBillAdjustment;

    return {
      vendorId: vendor,
      appliedToDetails: {
        appliedTo: new ObjectId(_id),
        appliedToNo: adjustmentNo,
        appliedToType: ACCOUNT_PAYABLE_TYPE_BILL_ADJUSTMENT,
      },
    };
  }

  async updateBill(_id, amount, session) {
    this.logger.debug(`Ap payment: ${this.user.email}. Starting updateBill ${_id}`);
    await this.schema.Bill.lockDocument({ _id }, session);
    this.logger.debug(`Ap payment: ${this.user.email}. finished locking Bill ${_id}`);
    const updatedBill = await this.schema.Bill.findOneAndUpdate({ _id }, {
      $inc: { amountPaid: amount, balance: -amount },
    }, { session, new: true });
    this.logger.debug(`Ap payment: ${this.user.email}. updated Bill ${_id}`);
    if (_.isNil(updatedBill)) {
      throw new RestError(400, { message: `Not enough credits available in bill ID ${_id} to create the payment` });
    }
    await this.schema.Bill.findOneAndUpdate({ _id: updatedBill._id }, {
      $set: { status: this.schema.Bill.getStatus(updatedBill) },
    }, { session, new: true });
    this.logger.debug(`Ap payment: ${this.user.email}. updated Bill status ${_id}`);
    const { vendor, no } = updatedBill;

    return {
      vendorId: vendor,
      appliedToDetails: {
        appliedTo: new ObjectId(_id),
        appliedToNo: no,
        appliedToType: ACCOUNT_PAYABLE_TYPE_BILL,
      },
    };
  }

  buildPaymentBatch(detailsByVendor, apPayment) {
    return Object.keys(detailsByVendor).map((vendorId) => {
      const combinedDetails = detailsByVendor[vendorId].map((detail) => {
        const details = [];
        const { paymentAmount, appliedToDetails, appliedFromDetails } = detail;

        if (detail.paymentAmount > 0) {
          details.push({ ...appliedToDetails, paymentAmount });
        }
        if (!_.isNil(appliedFromDetails)) {
          return details.concat(appliedFromDetails.map((debitMemoDetails) => ({ ...appliedToDetails, ...debitMemoDetails })));
        }

        return details;
      });

      return {
        ..._.cloneDeep(apPayment),
        details: _.flatten(combinedDetails),
        lspId: this.lspId,
        createdBy: this.user.email,
        vendor: new ObjectId(vendorId),
      };
    });
  }

  async edit(apPayment) {
    const editedApPayment = _.pick(apPayment, ['paymentDate', 'paymentMethod', 'bankAccount']);
    const dbApPayment = await this.schema.ApPayment.findOne({
      _id: apPayment._id,
    });

    if (dbApPayment.siConnector.isSynced || _.isEmpty(dbApPayment.siConnector.error)) {
      throw new Error('You cannot update this record because it is already synced');
    }
    if (_.isNil(apPayment.paymentDate)) {
      throw new Error('The payment date is mandatory');
    }
    if (!_.isNil(editedApPayment.paymentMethod)) {
      editedApPayment.paymentMethod = new ObjectId(editedApPayment.paymentMethod);
    } else {
      throw new Error('The payment method is mandatory');
    }
    if (!_.isNil(editedApPayment.bankAccount)) {
      editedApPayment.bankAccount = new ObjectId(editedApPayment.bankAccount);
    } else {
      throw new Error('The bank account is mandatory');
    }
    await this.schema.ApPayment.findOneAndUpdate({
      _id: apPayment._id,
    }, {
      $set: editedApPayment,
    });

    return this.getById(dbApPayment._id);
  }

  _getImportedEntries(session) {
    const pipelines = [{
      $match: {
        userId: new ObjectId(this.user._id),
        lspId: new ObjectId(this.lspId),
      },
    },
    {
      $group: {
        _id: '$entry.vendorId',
        entries: {
          $push: {
            status: DRAFTED_STATUS,
            accountPayableId: '$entry.accountPayableId',
            no: '$entry.no',
            appliedToType: '$entry.appliedToType',
            creditsAvailable: { $toDecimal: '$entry.creditsAvailable' },
            creditsToApply: { $toDecimal: '$entry.creditsToApply' },
            billBalance: { $toDecimal: '$entry.billBalance' },
            paymentMethod: '$entry.paymentMethod',
            paymentAmount: { $toDecimal: '$entry.paymentAmount' },
          },
        },
      },
    },
    ];
    return this.schema.ApPaymentDetailTemp
      .aggregate(pipelines)
      .session(session)
      .cursor({ batchSize: 1 });
  }

  _getTargetVendorDetails(detail, session) {
    this.logger.debug(`Ap payment: ${this.user.email}. Starting _getTargetVendorDetails`);
    const { summaryPaymentAmount } = detail;
    const accountPayableId = _.get(detail, 'accountPayableId', '');
    const isBill = accountPayableId.startsWith(ID_PREFIX_BILL);
    const isAdjustment = accountPayableId.startsWith(ID_PREFIX_BILL_ADJUSTMENT);

    if (isAdjustment) {
      return this.updateBillAdjustment(
        accountPayableId.replace(ID_PREFIX_BILL_ADJUSTMENT, ''),
        summaryPaymentAmount,
        session,
      );
    } if (isBill) {
      return this.updateBill(
        accountPayableId.replace(ID_PREFIX_BILL, ''),
        summaryPaymentAmount,
        session,
      );
    }
    throw new Error('Invalid account payable id');
  }

  _groupDetailsByVendor(details) {
    const detailsByVendor = {};

    details.forEach((detail) => {
      const vendorId = detail.vendorId.toString();

      if (_.isUndefined(detailsByVendor[vendorId])) {
        detailsByVendor[vendorId] = [];
      }
      detailsByVendor[vendorId].push(detail);
    });

    return detailsByVendor;
  }

  formatApPaymentDetails(apPayment) {
    apPayment.details.forEach((detail) => {
      detail.creditsToApply = _.round(detail.creditsToApply, 2);
      detail.paymentAmount = _.round(detail.paymentAmount, 2);
      detail.summaryPaymentAmount = bigJsToNumber(sum(detail.creditsToApply, detail.paymentAmount));
    });

    return apPayment;
  }

  async setAppliedToDetails(apPayment, session) {
    this.logger.debug(`Ap payment: ${this.user.email}. Starting setAppliedToDetails`);
    const { PAYMENT_WRITE_PARALLEL_OPERATIONS_NUMBER } = this.configuration.environment;
    await Promise.map(apPayment.details, async (detail) => {
      const { vendorId, appliedToDetails } = await this._getTargetVendorDetails(detail, session);

      detail.vendorId = vendorId;
      detail.appliedToDetails = appliedToDetails;
    }, { concurrency: PAYMENT_WRITE_PARALLEL_OPERATIONS_NUMBER });
  }

  async createPayments(session, apPayment) {
    this.logger.debug(`Ap payment: ${this.user.email}. Starting createPayments`);
    const { PAYMENT_WRITE_PARALLEL_OPERATIONS_NUMBER } = this.configuration.environment;
    this.formatApPaymentDetails(apPayment);
    await this.setAppliedToDetails(apPayment, session);
    this.logger.debug(`Ap payment: ${this.user.email}. Finished setAppliedToDetails`);
    const detailsByVendor = this._groupDetailsByVendor(apPayment.details);

    await Promise.map(Object.keys(detailsByVendor), async (vendorId) => {
      const details = detailsByVendor[vendorId];

      await Promise.mapSeries(details, async (detail) => {
        if (detail.creditsToApply > 0) {
          detail.appliedFromDetails = await this.deductCreditsFromDebitMemos(detail.vendorId, detail.creditsToApply, session);
        }
      });
    }, { concurrency: PAYMENT_WRITE_PARALLEL_OPERATIONS_NUMBER });
    const paymentByVendors = this.buildPaymentBatch(detailsByVendor, apPayment);
    this.logger.debug(`Ap payment: ${this.user.email}. Built payment batch`);
    const paymentsToCreate = paymentByVendors.map((payment) => {
      const paymentToCreate = new this.schema.ApPayment(payment);

      paymentToCreate.safeAssign(paymentToCreate);

      return paymentToCreate.toObject();
    });
    this.logger.debug(`Ap payment: ${this.user.email}. created payment models`);
    const createdApPayments = await this.schema.ApPayment.create(paymentsToCreate);
    this.logger.debug(`Ap payment: ${this.user.email}. saved payment models`);
    return createdApPayments;
  }

  async createPaymentViaCsv(apPayment, session) {
    const paymentsBatch = [];
    const vendorCursor = this._getImportedEntries(session);
    try {
      let hasProcessedEntries = false;
      await vendorCursor.eachAsync(async (vendor) => {
        hasProcessedEntries = true;
        const apPaymentModel = Object.assign(apPayment, {
          lspId: this.lspId,
          createdBy: this.user.email,
          vendor: new ObjectId(vendor._id),
          status: DRAFTED_STATUS,
          entries: vendor.entries,
        });
        const paymentToCreate = new this.schema.ApPayment(apPaymentModel);
        paymentToCreate.safeAssign(paymentToCreate);
        this.logger.debug(`Ap payment: ${this.user.email}. saved payment models`);
        paymentsBatch.push(paymentToCreate);
      });
      if (!hasProcessedEntries) {
        throw new Error('Failed to create payment from the uploaded file. The uploaded entries are already part of an existing payment. No entries were processed.');
      }
      return this.schema.ApPayment.create(paymentsBatch, { session });
    } catch (err) {
      if (!err.toString().match('MongoError: Cursor is closed')) {
        this.logger.debug(`Invoice: ${this.user.email}. Error: ${err}`);
        throw new RestError(500, { message: `Invoice creation failed: ${err}` });
      }
    }
  }

  async createPaymentViaGrid(apPayment, session) {
    let shouldMock = this.isTestingUser() || (this.environmentName !== 'PROD' && this.syncEntityOnCreation === true);
    if (!this.mock) {
      shouldMock = false;
    }
    Object.assign(apPayment, {
      siConnector: {
        isMocked: shouldMock,
        isSynced: false,
        error: null,
      },
    });
    const createdApPayments = await this.createPayments(session, apPayment);
    const detailsByVendor = this._groupDetailsByVendor(apPayment.details);
    await Promise.mapSeries(Object.keys(detailsByVendor), async (vendorId) => {
      this.logger.debug(`Ap payment: ${this.user.email}. Locking vendor ${vendorId}`);
      await this.schema.User.lockDocument({ _id: vendorId }, session);
      this.logger.debug(`Ap payment: ${this.user.email}. Finished locking vendor ${vendorId}`);
      await this.schema.User.consolidateVendorBalance(vendorId, session);
      this.logger.debug(`Ap payment: ${this.user.email}. Finished consolidate Vendor Balance ${vendorId}`);
    });
    return createdApPayments;
  }

  async create(apPayment) {
    this.logger.debug(`Ap payment: ${this.user.email} triggered ap payment creation`);
    let createdApPayments;
    this.logger.debug(`Ap payment: ${this.user.email}. Starting mongoose session`);
    const session = await mongoConnection.mongoose.startSession();
    this.logger.debug(`Ap payment: ${this.user.email}. Finished starting mongoose session`);
    try {
      this.logger.debug(`Ap payment: ${this.user.email}. Executing transaction`);
      await session.withTransaction(async () => {
        if (_.isEmpty(apPayment.details)) {
          createdApPayments = await this.createPaymentViaCsv(apPayment, session);
        } else {
          createdApPayments = await this.createPaymentViaGrid(apPayment, session);
        }
        return !_.isNil(createdApPayments);
      });
      this.logger.debug(`Ap payment: ${this.user.email}. Finished executing transaction`);
      return createdApPayments;
    } catch (err) {
      this.logger.debug(`Ap payment: ${this.user.email} Failed to create ap payments: Error: ${err}`);
      throw err;
    } finally {
      this.logger.debug(`Ap payment: ${this.user.email}. Ending mongoose session`);
      await session.endSession();
      this.logger.debug(`Ap payment: ${this.user.email}. Finished ending mongoose session`);
    }
  }

  async rollbackBalances(apPayment, session) {
    await Promise.map(apPayment.details, async (details) => {
      const summaryRollbackAmount = -bigJsToNumber(sum(details.appliedCredits, details.paymentAmount));
      const isBillAdjustment = details.appliedToType === ACCOUNT_PAYABLE_TYPE_BILL_ADJUSTMENT;
      const isBill = details.appliedToType === ACCOUNT_PAYABLE_TYPE_BILL;

      if (isBillAdjustment) {
        await this.updateBillAdjustment(details.appliedTo, summaryRollbackAmount, session);
      } else if (isBill) {
        await this.updateBill(details.appliedTo, summaryRollbackAmount, session);
      } else {
        throw new RestError(400, { message: `Invalid AP Payment detail. ID: ${apPayment._id}` });
      }
    }, { concurrency: 100 });
    const detailsWithCreditsApplied = apPayment.details
      .filter((detail) => !_.isNil(detail.appliedFromNo));
    const detailsGrouppedByAppliedFromNo = _.groupBy(detailsWithCreditsApplied, 'appliedFromNo');

    await Promise.map(Object.values(detailsGrouppedByAppliedFromNo), async (details) => {
      const { appliedFrom } = details[0];
      const totalAppliedCredits = details.reduce((total, detail) => total + detail.appliedCredits, 0);

      await this.schema.BillAdjustment.lockDocument({ _id: appliedFrom }, session);
      const updatedBillAdjustment = await this.schema.BillAdjustment
        .findOneAndUpdate(
          { _id: appliedFrom },
          {
            $inc: {
              adjustmentBalance: totalAppliedCredits,
              amountPaid: -totalAppliedCredits,
            },
          },
          { session, new: true },
        );

      await this.schema.BillAdjustment.findOneAndUpdate(
        { _id: updatedBillAdjustment._id },
        {
          $set: {
            status: this.schema.BillAdjustment.getStatus(updatedBillAdjustment),
          },
        },
        { session },
      );
    });
    await this.schema.User.lockDocument({ _id: apPayment.vendor }, session);
    await this.schema.User.consolidateVendorBalance(apPayment.vendor, session);
  }

  async void(_id, details) {
    _id = new ObjectId(_id);
    const siApi = new SiConnectorAPI(this.flags);
    const paymentInDb = await this.schema.ApPayment.findOne({ _id }).lean();

    if (_.get(paymentInDb, 'voidDetails.isVoided')) {
      throw new Error('AP Payment already voided');
    }
    if (paymentInDb.siConnector.isSynced && paymentInDb.totalPaymentAmount === 0) {
      throw new Error('This payment cannot be voided');
    }
    if (_.get(paymentInDb, 'siConnector.isSynced', false)) {
      await siApi.getSiMetadata(_id, this.schema.ApPayment, 'apPaymentList', 'appymt');
    }
    await provideTransaction(async (session) => {
      const apPayment = await this.schema.ApPayment.findOne({ _id }).session(session);

      await this.rollbackBalances(apPayment, session);
      apPayment.safeAssign({
        details: [],
        status: 'voided',
        voidDetails: { ...details, isVoided: true },
      });
      await apPayment.save({ session });
      await siApi.voidApPayment(_id, session);
    });

    return this.getById(_id);
  }

  mergeApPaymentDetails(apPaymentDetails) {
    return Object.values(_.groupBy(apPaymentDetails, 'appliedToNo'))
      .map((details) => details.reduce((acc, detail) => ({
        ...acc,
        ...detail,
        appliedCredits: detail.appliedCredits + acc.appliedCredits,
        paymentAmount: detail.paymentAmount + acc.paymentAmount,
      }), { appliedCredits: 0, paymentAmount: 0 }));
  }
}

module.exports = ApPaymentApi;
