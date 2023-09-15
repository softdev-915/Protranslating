const _ = require('lodash');
const Promise = require('bluebird');
const handlebars = require('handlebars');
const { Types: { ObjectId } } = require('mongoose');
const csvWriter = require('csv-write-stream');
const moment = require('moment');
const apiResponse = require('../../../components/api-response');
const EmailQueue = require('../../../components/email/templates');
const { validObjectId, areObjectIdsEqual } = require('../../../utils/schema');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const AbstractRequestAPI = require('../request/abstract-request-api');
const { CsvExport } = require('../../../utils/csvExporter');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { getExtension } = require('../../../utils/file');
const { decimal128ToNumber } = require('../../../utils/bigjs');
const { getRoles, hasRole } = require('../../../utils/roles');
const { buildDateQuery } = require('../../../components/database/mongo/query/date');
const { toUserFullName } = require('../../../utils/user');

const STATUS_NAMES = { posted: 'Posted', partiallyPaid: 'Partially Paid', paid: 'Paid' };
const createBillRow = (doc) => {
  const row = {
    'Bill No.': doc.no,
    'Bill ID': doc._id.toString(),
    'Request Numbers': doc.requestNumbersText,
    'Bill Date': doc.date,
    'Due Date': doc.dueDate,
    'Payment Schedule Date': doc.paymentScheduleDate,
    Status: _.get(STATUS_NAMES, doc.status, ''),
    'GL Posting Date': doc.glPostingDate,
    Synced: doc.isSyncedText,
    'Sync Error': doc.syncError,
    'Last Sync Date': doc.connectorEndedAt,
    'Vendor Name': doc.vendorName,
    'Vendor ID': doc.vendorId,
    'Vendor Email': doc.vendorEmail,
    'Billing Address': doc.billingAddress,
    'Bill Payment Notes': doc.vendorBillPaymentNotes,
    'Vendor Id': doc.vendorId,
    'Vendor Company': doc.vendorCompany,
    'Vendor billing term': doc.vendorBillingTermName,
    'Payment method': doc.vendorPaymentMethodName,
    'Total balance': doc.totalBalance,
    'WT Fee Waived': doc.wtFeeWaived,
    'Bill On Hold': doc.billOnHoldText,
    '1099 ': _.isEmpty(doc.has1099EligibleForm) ? 'FALSE' : 'TRUE',
    'Priority Pay': doc.vendorPriorityPay,
    'Bill Balance': doc.balance,
    'Amount Paid': doc.amountPaid,
    'Total Amount': doc.totalAmount,
    'Created by': doc.createdBy,
    'Created at': doc.createdAt,
    'Updated by': doc.updatedBy,
    'Updated at': doc.updatedAt,
    Inactive: doc.inactiveText,
    'Restored by': doc.restoredBy,
    'Restored at': doc.restoredAt,
  };
  return row;
};
const billingAddressConcatArray = [
  '$billVendor.vendorDetails.address.line1',
  ' ',
  '$billVendor.vendorDetails.address.line2',
  ' ',
  '$billVendor.vendorDetails.address.city',
  ' ',
  '$billVendor.vendorDetails.address.state.name',
  ' ',
  '$billVendor.vendorDetails.address.country.name',
];
const { RestError } = apiResponse;
const BILL_APPROVE_STATUS = 'approve';
class BillApi extends AbstractRequestAPI {
  constructor(options) {
    super(options);
    this.FilePathFactory = FilePathFactory;
    this.emailQueue = new EmailQueue(
      this.logger,
      this.schema,
      this.configuration,
    );
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };
    let vendorId = _.get(filters, 'vendorId');
    delete filters.vendorId;
    const canNotReadAllBills = this.user.has('BILL_READ_OWN') && !this.user.has('BILL_READ_ALL');
    if (canNotReadAllBills) {
      vendorId = new ObjectId(this.user._id);
    }
    if (!_.isEmpty(_.get(filters, '_id', ''))) {
      query._id = filters._id;
    }
    let pipeline = [];
    let match = {};
    if (canNotReadAllBills || !_.isEmpty(vendorId)) {
      match = {
        vendor: new ObjectId(vendorId),
      };
    }
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const paginationFilters = _.get(filters, 'paginationParams.filter');
    let filter = paginationFilters;
    if (_.isString(paginationFilters)) {
      filter = JSON.parse(paginationFilters);
    }
    if (_.get(filter, 'hasPositiveBalance', false)) {
      Object.assign(match, {
        balance: { $gt: 0 },
      });
    }
    const isSynced = _.get(filter, 'isSynced');
    if (!_.isNil(isSynced)) {
      match['siConnector.isSynced'] = isSynced.toString() === 'true';
    }
    const requestNumbersText = _.get(filter, 'requestNumbersText', '');
    if (!_.isEmpty(requestNumbersText)) {
      const requestNumbers = requestNumbersText.split(',').map((rn) => rn.trim());
      const allBlockMatches = requestNumbers.map((rn) => ({ $elemMatch: { no: rn } }));
      match = { ...match, requests: { $all: allBlockMatches } };
    }
    pipeline = [{
      $match: match,
    }];
    pipeline = _.concat(pipeline, [
      {
        $addFields: {
          isSyncedText: { $toString: '$siConnector.isSynced' },
          connectorEndedAt: { $toString: '$siConnector.connectorEndedAt' },
          syncError: { $toString: '$siConnector.error' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorObj',
        },
      },
      {
        $addFields: {
          billVendor: {
            $arrayElemAt: ['$vendorObj', 0],
          },
          requestNumbersText: {
            $reduce: {
              input: '$requests.no',
              initialValue: '',
              in: {
                $concat: [
                  '$$value',
                  { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                  '$$this'],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'paymentMethods',
          let: { paymentMethodId: { $toObjectId: '$billVendor.vendorDetails.billingInformation.paymentMethod' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$paymentMethodId'],
                },
              },
            },
            {
              $project: { _id: 1, name: 1 },
            },
          ],
          as: 'vendorPaymentMethod',
        },
      },
      {
        $lookup: {
          from: 'billingTerms',
          let: { billingTermId: { $toObjectId: '$billVendor.vendorDetails.billingInformation.billingTerms' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$billingTermId'],
                },
              },
            },
            {
              $project: { _id: 1, name: 1 },
            },
          ],
          as: 'vendorBillingTerm',
        },
      },

      {
        $addFields: {
          billingAddress: {
            $concat: billingAddressConcatArray,
          },
          billPaymentMethod: {
            $arrayElemAt: ['$vendorPaymentMethod', 0],
          },
          billBillingTerm: {
            $arrayElemAt: ['$vendorBillingTerm', 0],
          },
        },
      },
      {
        $addFields: {
          vendorEmail: '$billVendor.email',
          vendorId: '$billVendor._id',
          totalBalance: 0,
          billOnHoldText: { $toString: '$billOnHold' },
          billPaymentMethodId: { $ifNull: ['$paymentMethod._id', '$billPaymentMethod._id'] },
          vendorCompany: '$billVendor.vendorDetails.vendorCompany',
          vendorPaymentMethodName: { $ifNull: ['$paymentMethod.name', '$billPaymentMethod.name'] },
          vendorWtFeeWaived: { $ifNull: ['$wtFeeWaived', '$billVendor.vendorDetails.billingInformation.wtFeeWaived'] },
          vendorPriorityPay: { $ifNull: ['$priorityPayment', '$billVendor.vendorDetails.billingInformation.wtFeeWaived'] },
          vendorBillingTermName: { $ifNull: ['$billingTerm.name', '$billVendor.vendorDetails.billingInformation.billingTerm.name'] },
          vendorBillPaymentNotes: { $ifNull: ['$billPaymentNotes', '$billVendor.vendorDetails.billingInformation.billPaymentNotes'] },
          vendorName: {
            $cond: {
              if: { $ne: [{ $ifNull: ['$billVendor.vendorDetails.vendorCompany', ''] }, ''] },
              then: '$billVendor.vendorDetails.vendorCompany',
              else: {
                $concat: [
                  { $ifNull: ['$billVendor.firstName', ''] },
                  ' ',
                  { $ifNull: ['$billVendor.middleName', ''] },
                  {
                    $cond: {
                      if: { $eq: [{ $ifNull: ['$billVendor.middleName', ''] }, ''] },
                      then: '',
                      else: ' ',
                    },
                  },
                  { $ifNull: ['$billVendor.lastName', ''] },
                ],
              },
            },
          },
        },
      }]);
    if (_.has(filter, 'billPaymentMethodId')) {
      pipeline.push({
        $match: {
          billPaymentMethodId: new ObjectId(filter.billPaymentMethodId),
        },
      });
    }
    pipeline.push({
      $project: {
        billVendor: 0,
        vendorObj: 0,
        billBillingTerm: 0,
        billPaymentMethod: 0,
        vendorBillingTerm: 0,
        vendorPaymentMethod: 0,
      },
    });
    pipeline.push({
      $project: {
        schedulerType: 1,
      },
    });
    const extraQueryParameters = [
      'vendorName',
      'billPaymentMethodId',
      'vendorPaymentMethodName',
      'vendorBillingTermName',
      'vendorWtFeeWaived',
      'inactiveText',
      'isSyncedText',
      'syncError',
      'billingAddress',
      'billOnHoldText',
      'vendorBillPaymentNotes',
      'vendorPriorityPay',
      'vendorCompany',
      'vendorEmail',
      'vendorId',
    ];
    return {
      query,
      pipeline,
      extraQueryParameters,
    };
  }

  /** Returns a csv file
   * @param {Object} filters to filter the bill names returned.
   */
  async billExport(filters, res) {
    this.logger.debug(`User ${this.user.email} retrieved the bill list export file`);
    try {
      const { query, pipeline, extraQueryParameters } = this._getQueryFilters(filters);
      this.logger.debug(`Making main requests query for user: (${this.user.email}`);
      const canReadAllFields = this.user.has('BILL_READ_ALL');
      const columnOptions = this.schema.Bill.getExportOptions(canReadAllFields);
      const writer = csvWriter(columnOptions);
      const csvFileName = CsvExport.buildProperFilename(query, this.schema.Bill);
      const requestHeaders = {
        'Content-Type': 'text/csv',
        'Content-disposition': `attachment;filename=${csvFileName}.csv`,
      };
      res.writeHead(200, requestHeaders);
      writer.pipe(res);
      const cursor = await exportFactory(
        this.schema.Bill,
        query,
        pipeline,
        extraQueryParameters,
        filters.__tz,
      );
      await cursor.eachAsync(async (doc) => {
        const row = createBillRow(doc);
        this.logger.debug(`Finished building csv row for csv with filters ${JSON.stringify(filters)}`);
        return writer.write(row);
      });
      this.logger.debug('Finished building csv');
      return res.end();
    } catch (e) {
      if (e instanceof RestError) {
        throw e;
      }
      this.logger.error(`Error populating and filtering bill records. Error: ${e}`);
      throw new RestError(500, { message: 'Error retrieving bill records', stack: e.stack });
    }
  }

  /**
   * Returns the bill list
   * @param {Object} filters to filter the bill returned.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the bill list`);
    let list = [];

    try {
      const { query, pipeline, extraQueryParameters } = this._getQueryFilters(
        filters,
      );
      list = await searchFactory({
        model: this.schema.Bill,
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams: extraQueryParameters,
        utcOffsetInMinutes: filters.__tz,
      });
      const NUMBER_FIELDS = ['taskAmount', 'totalAmount', 'amountPaid', 'balance'];
      list = list.map((r) => {
        NUMBER_FIELDS.forEach((field) => {
          _.set(r, field, decimal128ToNumber(_.get(r, field, 0)));
        });
        if (!_.isEmpty(r.serviceDetails)) {
          r.serviceDetails = r.serviceDetails.map((detail) => {
            detail.taskAmount = decimal128ToNumber(detail.taskAmount);
            return detail;
          });
        }
        return r;
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing bill aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  find(query) {
    return this.schema.Bill.find(query);
  }

  async findByIds(billIds) {
    const POPULATE_FIELDS = [
      { path: 'vendor' },
    ];

    const bills = await this.schema.Bill.find({
      _id: { $in: billIds },
      lspId: this.lspId,
    })
      .populate(POPULATE_FIELDS)
      .lean();
    if (_.isNil(bills)) return;
    this.logger.debug(
      `User ${this.user.email} retrieved bills by ${billIds.join(',')}`,
    );
    return {
      list: bills,
      total: bills.length,
    };
  }

  async findOne(billId) {
    const POPULATE_FIELDS = [
      {
        path: 'vendor',
        options: { withDeleted: true },
        select: `
          firstName
          middleName
          lastName
          email
          billingAddress
          vendorDetails.address
          vendorDetails.priorityPay
          vendorDetails.phoneNumber
          vendorDetails.billBalance
          vendorDetails.vendorCompany
          vendorDetails.billingInformation.wtFeeWaived
          vendorDetails.billingInformation.taxId
          vendorDetails.billingInformation.taxForm
          vendorDetails.billingInformation.priorityPayment
          vendorDetails.billingInformation.billPaymentNotes
          vendorDetails.billingInformation.billsOnHold
          vendorDetails.billingInformation.paymentMethod
          vendorDetails.billingInformation.billingTerms
        `,
        populate: [{
          path: 'vendorDetails.billingInformation.paymentMethod',
          select: '_id name',
          options: { withDeleted: true },
        },
        {
          path: 'vendorDetails.billingInformation.billingTerms',
          select: '_id name',
          options: { withDeleted: true },
        }],
      },
    ];
    const projection = this.user.has('BILL_READ_ALL') ? {} : {
      'vendor.vendorDetails.billingInformation.wtFeeWaived': 0,
      'vendor.vendorDetails.billingInformation.priorityPayment': 0,
      'vendor.vendorDetails.billingInformation.billPaymentNotes': 0,
      glPostingDate: 0,
      billOnHold: 0,
    };
    const query = { _id: billId, lspId: this.lspId };
    const bill = await this.schema.Bill.findOne(query, projection).populate(POPULATE_FIELDS);
    if (_.isNil(bill)) return;
    bill.maskPIIValues(bill);
    this.logger.debug(`User ${this.user.email} retrieved bill name ${billId}`);
    return bill;
  }

  async update(bill) {
    const isValidId = validObjectId(bill._id);
    if (!isValidId) {
      this.logger.debug(`Invalid ObjectId ${bill._id} for bill entity when trying to update`);
      throw new RestError(500, { message: `Error updating bill, Invalid ObjectId ${bill._id} for bill entity` });
    }
    const billInDb = await this.schema.Bill.findOne({
      _id: bill._id,
      lspId: this.lspId,
    });
    let paymentMethodInDb = billInDb.paymentMethod;
    let billingTermInDb = billInDb.billingTerms;

    if (_.isNil(billInDb)) {
      throw new RestError(400, { message: `Bill ${bill._id} does not exist` });
    }
    billInDb.restoreMaskedValues(bill, billInDb);
    let updatedBill;
    if (!this.user.has('BILL-ACCT_UPDATE_ALL')) {
      const fieldsToOverride = [
        'serviceDetails',
        'billOnHold',
        'paymentMethod',
        'billingTerms',
      ];
      fieldsToOverride.forEach((field) => {
        _.set(bill, field, _.get(billInDb, field));
      });
      updatedBill = bill;
    } else {
      paymentMethodInDb = await this.schema.PaymentMethod.findOneWithDeleted({
        _id: new ObjectId(bill.paymentMethod),
        lspId: this.lspId,
      }, { _id: 1, name: 1 });
      billingTermInDb = await this.schema.BillingTerm.findOneWithDeleted({
        _id: new ObjectId(bill.billingTerms),
        lspId: this.lspId,
      }, { _id: 1, name: 1 });
      updatedBill = _.omit(bill, ['paymentMethod', 'billingTerms']);
      Object.assign(updatedBill, {
        siConnector: _.assign(bill.siConnector, {
          connectorEndedAt: bill.updatedAt,
        }),
      });
    }
    billInDb.safeAssign(updatedBill);
    billInDb.paymentMethod = paymentMethodInDb;
    billInDb.billingTerms = billingTermInDb;
    const billUpdated = await this._save(billInDb);
    return billUpdated;
  }

  async _save(bill) {
    try {
      const newBill = await bill.save();
      return newBill;
    } catch (err) {
      const DUPLICATED_ERR_MESSAGE = `User ${this.user.email} couldn't create the bill: ${
        bill.no
      }`;
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`${DUPLICATED_ERR_MESSAGE} due to err: duplicated key`);
        throw new RestError(409, {
          message: `Bill with no: ${bill.no} already exists`,
        });
      }
      this.logger.debug(`${DUPLICATED_ERR_MESSAGE} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }

  async buildFilePath(billId, documentId) {
    const { lspId } = this;
    const fileStorageFacade = new this.FileStorageFacade(
      lspId,
      this.configuration,
      this.logger,
    );
    const bill = await this.schema.Bill.findById(billId);
    const canDownloadFiles = this._canDownloadFiles(bill.vendor);
    if (!canDownloadFiles) {
      throw new RestError(403, { message: 'User is not authorized' });
    }
    const document = bill.documents.find(
      (doc) => doc._id.toString() === documentId,
    );
    if (!document) {
      throw new RestError(404, {
        message: `The document ${documentId} does not exist`,
      });
    } else if (document.deletedByRetentionPolicyAt) {
      // will only be executed if document.deletedByRetentionPolicyAt has a date
      throw new RestError(404, {
        message: `The document ${documentId} has been removed by document retention policy`,
      });
    }
    const file = fileStorageFacade.billFile(billId, document);
    return { file, document };
  }

  async zipFilesStream(billId, res) {
    const bill = await this.findOne(billId);
    if (_.isNil(bill)) {
      this.logger.info(`No bill with id ${billId} `);
      throw new RestError(404, {
        message: `bill ${billId} does not exist`,
      });
    }
    const documentsFiltered = _.filter(bill.documents, (d) => !d.deleted);
    if (_.isEmpty(documentsFiltered)) {
      this.logger.info(`bill ${billId} has no documents`);
      throw new RestError(400, {
        message: 'No documents available to download',
      });
    }
    const files = documentsFiltered.map((document) => {
      if (_.isEmpty(_.get(document, 'cloudKey', ''))) {
        const file = this.buildFilePath(billId, document._id);
        document.cloudKey = file.path;
        const extension = getExtension(document.name);
        document.path = file.path.replace(document.name, `${document._id.toString()}${extension}`);
      }
      return document;
    });
    try {
      await this.cloudStorage.streamZipFile({ res, files, zipFileName: `${bill.no}.zip` });
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }

  async changeStatus(_id, status) {
    let billInDb;
    if (validObjectId(_id)) {
      billInDb = await this.schema.Bill.findById(_id);
    }
    if (!billInDb) {
      throw new RestError(400, { message: `Bill ${billInDb._id} does not exist` });
    }
    if (status === BILL_APPROVE_STATUS) {
      const providerId = _.get(billInDb, 'provider._id');
      const isSameStatus = billInDb.status === status;
      let err = null;
      if (this.user._id !== providerId) {
        err = new Error('User is not authorized to change bill status');
      } else if (isSameStatus) {
        err = new Error('Bill is already approved');
      }
      if (err) {
        this.logger.error(`Error approving bill. Error: ${err.message}`);
        throw new RestError(400, { message: err, stack: err.stack });
      }
    }
    billInDb.safeAssign({ status });
    const billUpdated = await this._save(billInDb);
    return billUpdated;
  }

  async retrieveVendorTotalAmounts(dateFilterTotalAmountPosted, dateFilterTotalAmountPaid, tz) {
    try {
      const utcOffsetInMinutes = _.toNumber(tz);
      const [billsForTotalAmountPosted, billsForTotalAmountPaid] = await Promise.all([
        this.schema.Bill.find({
          vendor: this.user._id,
          date: buildDateQuery(dateFilterTotalAmountPosted, utcOffsetInMinutes),
        }).select({ totalAmount: 1, amountPaid: 1 }).lean().exec(),
        this.schema.Bill.find({
          vendor: this.user._id,
          date: buildDateQuery(dateFilterTotalAmountPaid, utcOffsetInMinutes),
        }).select({ totalAmount: 1, amountPaid: 1 }).lean().exec(),
      ]);
      const totalAmountPosted = billsForTotalAmountPosted
        .reduce((amountPaid, bill) => amountPaid + decimal128ToNumber(bill.totalAmount), 0);
      const totalAmountPaid = billsForTotalAmountPaid
        .reduce((amountPaid, bill) => amountPaid + decimal128ToNumber(bill.amountPaid), 0);
      return { totalAmountPosted, totalAmountPaid };
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error ocurred upon retrieving vendor total amounts Err: ${message}`);
      throw new RestError(500, { message: 'Error ocurred upon retrieving vendor total amounts' });
    }
  }

  _canDownloadFiles(vendorId) {
    const isOwner = areObjectIdsEqual(this.user._id, vendorId);
    const userRoles = getRoles(this.user);
    const canUpdateAll = hasRole('BILL_UPDATE_ALL', userRoles);
    return canUpdateAll || isOwner;
  }

  async getPreview(billModel, template, lspInDb, footerTemplate, utcOffsetInMinutes) {
    const bill = billModel.toJSON();
    const lsp = { ...lspInDb, ...bill.lspId };
    lsp.logoImage = _.get(lsp, 'logoImage.base64Image', '');
    const totalAmount = Number(bill.totalAmount).toFixed(2);
    const balance = Number(bill.balance).toFixed(2);
    const amountPaid = Number(bill.amountPaid).toFixed(2);
    const vendorCompany = _.get(bill.vendor.vendorDetails, 'vendorCompany');
    const billVendorCompany = _.isEmpty(vendorCompany)
      ? toUserFullName(bill.vendor) : vendorCompany;
    const status = bill.status.replace(/^./, (str) => str.toUpperCase());
    const lspLocalCurrency = this.user.lsp.currencyExchangeDetails.find((e) => _.get(e, 'base._id', e.base).toString()
      === _.get(e, 'quote._id', e.quote).toString()
      && e.quotation === 1);
    const currency = await this.schema.Currency.findOne({ _id: lspLocalCurrency.base }, { isoCode: 1 }).lean();
    Object.assign(bill, {
      lsp,
      dueDate: moment.utc(bill.dueDate).utcOffset(utcOffsetInMinutes).format('MM/DD/YYYY'),
      date: moment.utc(bill.date).utcOffset(utcOffsetInMinutes).format('MM/DD/YYYY'),
      totalAmount,
      balance,
      paymentMethod: _.get(bill, 'vendor.vendorDetails.billingInformation.paymentMethod'),
      billingTerms: _.get(bill, 'vendor.vendorDetails.billingInformation.billingTerms'),
      amountPaid,
      status,
      currency,
      vendorCompany: billVendorCompany,
      templateLogo: `/static/lsp-logos/${template.logoName}`,
    });
    const compiledTemplate = handlebars.compile(template.template);
    return {
      template: compiledTemplate({ bill }),
      footerTemplate: _.get(footerTemplate, 'description', ''),
    };
  }
}

module.exports = BillApi;
