const mongoose = require('mongoose');
const _ = require('lodash');
const handlebars = require('handlebars');
const helpers = require('helpers-for-handlebars');
const moment = require('moment');
const Promise = require('bluebird');

const { ObjectId } = mongoose.Types;
const SchemaAwareAPI = require('../../schema-aware-api');
const CloudStorage = require('../../../components/cloud-storage');
const { RestError } = require('../../../components/api-response');
const { toCommaDecimalFormat, sum, transformDecimal128FieldsDeep } = require('../../../utils/bigjs/index');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const assignAttachmentManagementMethods = require('../../../utils/attachments');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const loadCustomHelpers = require('../../../utils/handlebars');
const { decimal128ToNumber } = require('../../../utils/bigjs');
const { validObjectId, convertToObjectId } = require('../../../utils/schema');
const { forEachTask } = require('../request/workflow-helpers');
const { getRequestInvoiceStatus, getCustomFieldsForTemplate, getHiddenFieldsForTemplate } = require('./ar-invoice-helper');

const POSTED_STATUS = 'Posted';
const DRAFTED_STATUS = 'Drafted';
const REVERSED_STATUS = 'Reversed';
const CONTACT_PROJECTION = {
  _id: 1,
  company: 1,
  firstName: 1,
  lastName: 1,
  email: 1,
  inactiveNotifications: 1,
  deleted: 1,
  terminated: 1,
  'contactDetails.billingAddress': 1,
  'contactDetails.billingEmail': 1,
};

helpers({ handlebars });

loadCustomHelpers(handlebars);

const ROLES = {
  READ_ALL: 'INVOICE_READ_ALL',
  READ_OWN: 'INVOICE_READ_OWN',
  READ_COMPANY: 'INVOICE_READ_COMPANY',
};
const CONTACT_TYPE = 'Contact';
const NOT_INVOICED_STATUS = 'Not Invoiced';
const INVOICED_STATUS = 'Invoiced';
const PARTIALLY_INVOICED_STATUS = 'Partially Invoiced';
const APPROVED_STATUS = 'Approved';
const TASK_CANCELLED_STATUS = 'Cancelled';
const PROVIDER_STATUS_CANCELLED = 'cancelled';
const REQUEST_INVOICED_STATUS = 'Invoiced';
const ENTRIES_SYNC_FAILED_POPULATE_OPTIONS = [
  { path: 'entries.ability._id', select: 'glAccountNo', options: { lean: true } },
  { path: 'entries.internalDepartment._id', select: 'name accountingDepartmentId', options: { lean: true } },
];

const INVOICE_REQUEST_SELECT = `_id no title deliveryDate expectedStartDate actualStartDate requestType memo referenceNumber
  recipient adjuster contact catTool purchaseOrder languageCombinationsText`;

function toTemplateDateFormat(date) {
  if (!_.isNil(date)) {
    return moment(date).utc().format('MM/DD/YYYY');
  }
}

class ArInvoiceApi extends SchemaAwareAPI {
  constructor(logger, { user, configuration, flags }) {
    super(logger, { user, enableTransactions: true, flags });
    this.configuration = configuration;
    this.cloudStorage = new CloudStorage(this.configuration);
    this.lsp = null;
    assignAttachmentManagementMethods(this, this.schema.ArInvoice);
    this.mock = _.get(flags, 'mock', false);
    this.lspExchangeDetails = [];
  }

  _getCompanyCurrencyFilter(filter) {
    return {
      companyId: new ObjectId(filter.company),
      'accounting.currency._id': new ObjectId(filter.currency),
      'siConnector.isSynced': true,
    };
  }

  _getQuery(filters) {
    const query = { lspId: this.lspId };
    if (filters && filters._id) {
      query._id = filters._id;
    }
    const paginationParams = _.get(filters, 'paginationParams');
    const paginationFilter = _.get(paginationParams, 'filter');

    if (_.has(paginationFilter, 'company') && _.has(paginationFilter, 'currency')) {
      Object.assign(query, this._getCompanyCurrencyFilter(paginationFilter));
    } else {
      Object.assign(query, paginationParams);
    }
    if (!this.user.has('INVOICE_READ_ALL')) {
      this._setRoleFilters(query);
    }
    return query;
  }

  _getBeforeMatchPipeline() {
    return [{
      $lookup: {
        from: 'companies',
        let: {
          company: '$company',
        },
        pipeline: [
          { $match: { $expr: { $eq: ['$$company', '$_id'] } } },
          {
            $project: {
              _id: 1,
              name: 1,
              hierarchy: 1,
              status: 1,
            },
          },
        ],
        as: 'companyObj',
      },
    },
    {
      $lookup: {
        from: 'users',
        let: {
          salesRep: '$contact',
        },
        pipeline: [
          { $match: { $expr: { $eq: ['$$salesRep', '$_id'] } } },
          {
            $project: CONTACT_PROJECTION,
          },
        ],
        as: 'contactObj',
      },
    },
    {
      $addFields: {
        company: { $arrayElemAt: ['$companyObj', 0] },
        contact: { $arrayElemAt: ['$contactObj', 0] },
      },
    },
    {
      $addFields: {
        companyId: '$company._id',
        contactId: '$contact._id',
        contactEmail: '$contact.email',
        contactName: { $concat: ['$contact.firstName', ' ', '$contact.lastName'] },
        companyHierarchy: '$company.hierarchy',
        companyName: '$company.name',
        isSyncedText: { $toString: '$siConnector.isSynced' },
      },
    }];
  }

  _getProgressCalculationPipelines() {
    return {
      firstStage: {
        $addFields: {
          inProgressEntriesNumber: {
            $size: {
              $filter: {
                input: '$entries',
                as: 'entry',
                cond: {
                  $eq: ['$$entry.status', 'In Progress'],
                },
              },
            },
          },
          postedEntriesNumber: {
            $size: {
              $filter: {
                input: '$entries',
                as: 'entry',
                cond: {
                  $eq: ['$$entry.processed', true],
                },
              },
            },
          },
          totalEntriesNumber: { $size: '$entries' },
        },
      },
      lastStage: [{
        $addFields: {
          postedPercentage: {
            $cond: {
              if: { $gt: ['$totalEntriesNumber', 0] },
              then: {
                $multiply: [{
                  $divide: [
                    { $toInt: '$postedEntriesNumber' },
                    { $toInt: '$totalEntriesNumber' },
                  ],
                },
                100,
                ],
              },
              else: 0,
            },
          },
          creationProgress: {
            $cond: {
              if: { $gt: ['$totalEntriesNumber', 0] },
              then: {
                $multiply: [{
                  $divide: [
                    { $toInt: '$inProgressEntriesNumber' },
                    { $toInt: '$totalEntriesNumber' },
                  ],
                },
                100,
                ],
              },
              else: 0,
            },

          },
          firstStagePercentage: {
            $cond: {
              if: { $gt: ['$totalEntriesNumber', 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $toInt: '$inProgressEntriesNumber' },
                      { $toInt: '$totalEntriesNumber' },
                    ],
                  },
                  50,
                ],
              },
              else: 0,
            },

          },
        },
      },
      {
        $addFields: {
          creationProgress: {
            $cond: {
              if: { $gt: ['$postedPercentage', 0] },
              then: { $sum: ['$postedPercentage', '$firstStagePercentage'] },
              else: '$firstStagePercentage',
            },
          },
        },
      },
      {
        $addFields: {
          creationProgress: {
            $toString: {
              $round: ['$creationProgress', 2],
            },
          },
        },
      },
      {
        $addFields: {
          creationProgress: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [{ $eq: ['$status', 'In Progress'] }, { $eq: ['$creationProgress', '100'] }],
                  },
                  then: '99%',
                },
                {
                  case: {
                    $in: ['$status', ['Posted', 'Paid', 'Voided', 'Partially Paid']],
                  },
                  then: '100%',
                },
              ],
              default: { $concat: ['$creationProgress', '%'] },
            },
          },
        },
      },
      ],
    };
  }

  _getExtraPipelines(timezoneValue) {
    const diffMinutes = parseInt(timezoneValue, 10);
    const { firstStage } = this._getProgressCalculationPipelines();
    Object.assign(firstStage.$addFields, {
      contactBillingAddress: {
        $concat: [
          '$contact.contactDetails.billingAddress.line1', ' ',
          '$contact.contactDetails.billingAddress.line2', ' ',
          '$contact.contactDetails.billingAddress.city', ' ',
          '$contact.contactDetails.billingAddress.state.name', ' ',
          '$contact.contactDetails.billingAddress.country.name', ' ',
          '$contact.contactDetails.billingAddress.zip', ' ',
        ],
      },
      salesRepName: { $concat: ['$salesRep.firstName', ' ', '$salesRep.lastName'] },
      amount: { $toDouble: '$accounting.amount' },
      balance: { $toDouble: '$accounting.balance' },
      paid: { $toDouble: '$accounting.paid' },
      exchangeRate: { $toDouble: '$accounting.exchangeRate' },
      localAmount: { $toDouble: '$accounting.amountInLocal' },
      syncError: '$siConnector.error',
      isSynced: '$siConnector.isSynced',
      lastSyncDate: _.isNaN(diffMinutes)
        ? '$siConnector.connectorEndedAt'
        : { $add: ['$siConnector.connectorEndedAt', diffMinutes * 60 * 1000] },
      requestNoList: {
        $map: { input: '$entries', in: '$$this.requestNo' },
      },
    });
    return [
      firstStage,
      ...this._getProgressCalculationPipelines().lastStage,
      {
        $project: {
          siConnector: 0,
          companyObj: 0,
          contactObj: 0,
          totalEntriesNumber: 0,
          firstStagePercentage: 0,
          inProgressEntriesNumber: 0,
          postedEntriesNumber: 0,
        },
      },
    ];
  }

  _getExtraQueryParams() {
    return [
      'contactName',
      'companyHierarchy',
      'contactId',
      'contactEmail',
      'contactBillingAddress',
      'companyName',
      'companyId',
      'amount',
      'balance',
      'accounting.currency.isoCode',
      'exchangeRate',
      'localAmount',
      'billingTerm.name',
      'templates.email.name',
      'templates.invoice.name',
      'salesRepName',
      'syncError',
      'isSynced',
      'isSyncedText',
      'lastSyncDate',
      'accounting.localCurrency.isoCode',
      'paid',
      'requestNoList',
    ];
  }

  async list(filters) {
    const query = this._getQuery(filters);
    const extraPipelines = this._getExtraPipelines(filters.__tz);
    const extraQueryParams = this._getExtraQueryParams();
    const beforeMatchPipeline = this._getBeforeMatchPipeline();
    const list = await searchFactory({
      model: this.schema.ArInvoice,
      filters: query,
      extraPipelines,
      extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
      beforeMatchPipeline,
    });
    return { list, total: list.length };
  }

  async export(filters) {
    const query = this._getQuery(filters);

    try {
      const beforeMatchPipeline = this._getBeforeMatchPipeline();
      const queryObj = await exportFactory(
        this.schema.ArInvoice,
        query,
        this._getExtraPipelines(filters.__tz),
        this._getExtraQueryParams(),
        filters.__tz,
        beforeMatchPipeline,
      );
      const csvExporter = new CsvExport(queryObj, {
        schema: this.schema.ArInvoice,
        lspId: this.lspId,
        logger: this.logger,
        configuration: this.configuration,
      });
      return csvExporter.export();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error exporting to CSV: ${message}`);
      throw new RestError(500, { message });
    }
  }

  async getById(_id, extraLookupOptions, includeEntries) {
    let lookupOptions = this._getBeforeMatchPipeline();
    const projectOptions = {
      $project: {
        totalEntriesNumber: 0,
        firstStagePercentage: 0,
        inProgressEntriesNumber: 0,
        postedEntriesNumber: 0,
        companyObj: 0,
        contactObj: 0,
        companyHierarchy: 0,
        companyId: 0,
        companyName: 0,
        contactName: 0,
        isSyncedText: 0,
      },
    };
    if (!_.isNil(extraLookupOptions)) {
      lookupOptions = lookupOptions.concat(extraLookupOptions);
    }
    if (!includeEntries) {
      Object.assign(projectOptions.$project, { entries: 0 });
    }
    const invoiceAggregation = await this.schema.ArInvoice
      .aggregateWithDeleted([
        {
          $match: {
            _id: new ObjectId(_id),
            lspId: this.lspId,
          },
        },
        this._getProgressCalculationPipelines().firstStage,
        ...this._getProgressCalculationPipelines().lastStage,
        ...lookupOptions,
        projectOptions,
      ]);
    if (_.isEmpty(invoiceAggregation)) {
      throw new RestError(404, { message: `Invoice ${_id} not found` });
    }
    const invoice = invoiceAggregation[0];
    return transformDecimal128FieldsDeep(invoice);
  }

  getImportedEntries(session) {
    const pipelines = [{
      $match: {
        userId: new ObjectId(this.user._id),
        lspId: new ObjectId(this.lspId),
      },
    },
    {
      $addFields: {
        entryId: {
          $convert: {
            input: '$_id',
            to: 'objectId',
          },
        },
      },
    },
    {
      $project: {
        entry: 1,
      },
    },
    ];
    return this.schema.ArInvoiceEntryTemp.aggregate(pipelines).session(session).cursor({ batchSize: 1000 });
  }

  async runPreCreationValidations(invoiceData) {
    if (_.isNil(this.lsp.financialEntityPrefix)) {
      this.logger.debug(`Invoice: ${this.user.email}. Error: Financial Entity Prefix must be specified in the lsp settings`);
      throw new RestError(400, { message: 'Financial Entity Prefix must be specified in the lsp settings' });
    }
    this.logger.debug(`Invoice: ${this.user.email} getting exchange details`);
    if (_.isNil(this.lspExchangeDetails)) {
      this.logger.debug(`Invoice: ${this.user.email}. Error: No exchange rate found for selected currency`);
      throw new RestError(404, { message: 'No exchange rate found for selected currency' });
    }
    this.logger.debug(`Invoice: ${this.user.email} triggered invoice creation for company ${invoiceData.company}`);
    if (_.isNil(this.lsp.financialEntityPrefix)) {
      this.logger.debug(`Invoice: ${this.user.email}. Error: Financial Entity Prefix must be specified in the lsp settings`);
      throw new RestError(400, { message: 'Financial Entity Prefix must be specified in the lsp settings' });
    }
  }

  async create(invoiceData) {
    try {
      this.lsp = await this.schema.Lsp.findById(this.lspId, 'financialEntityPrefix');
      const currencyId = _.get(invoiceData, 'accounting.currency._id', invoiceData.accounting.currency);
      this.lspExchangeDetails = await this.schema.Lsp.getExchangeDetails(this.lspId, currencyId);
      this.logger.debug(`Invoice: ${this.user.email} triggered invoice creation for company ${invoiceData.company}`);
      let newInvoice;

      await this.provideTransaction(async (session) => {
        const { company, salesRep } = invoiceData;
        if (_.isEmpty(salesRep)) delete invoiceData.salesRep;
        this.logger.debug(`Invoice: ${this.user.email}. Locking company hierarchy ${invoiceData.company}`);
        await this.schema.Company.lockCompanyHierarchy(company, session);
        this.logger.debug(`Invoice: ${this.user.email} starting create transaction`);
        if (_.isEmpty(invoiceData.entries)) {
          invoiceData.status = DRAFTED_STATUS;
          newInvoice = await this.createInvoiceModel(invoiceData, session);
          await this.createInvoiceFromCsv(newInvoice, session);
        } else {
          invoiceData.status = POSTED_STATUS;
          newInvoice = await this.createInvoiceModel(invoiceData, session);
          this.logger.debug(`Invoice: ${this.user.email} Saved newInvoice`);
          await this.updateRequestsByInvoice(newInvoice, session);
          this.logger.debug(`Invoice: ${this.user.email}. Finished creating simple invoice`);
          this.logger.debug(`Invoice: ${this.user.email}. Consolidating balance for company ${invoiceData.company}`);
          await this.schema.Company.consolidateBalance(newInvoice.company, session);
        }
        this.logger.debug(`Invoice: ${this.user.email}. Finished consolidating balance for company ${invoiceData.company}`);
      }, undefined, `Invoice: ${this.user.email}`);
      this.logger.debug(`Invoice: ${this.user.email}. Starting to sync invoice ${_.get(newInvoice, '_id')}`);
      (new SiConnectorAPI(this.flags)).syncArInvoices({ _id: _.get(newInvoice, '_id', '') })
        .catch((e) => this.logger.error(e));
      return _.omit(newInvoice.toObject(), ['entries']);
    } catch (err) {
      this.logger.error(`Invoice: Failed to create invoices. User is: ${this.user.email}. ${err}`);
      const message = _.get(err, 'message', 'Unknown error');

      throw new RestError(500, { message: `An error occurred during update: ${message}` });
    }
  }

  async _setInvoiceEntries(entries, newInvoice, session) {
    return this.schema.ArInvoice.findOneAndUpdate(
      { _id: newInvoice._id },
      { $push: { entries: { $each: entries } } },
      { session },
    );
  }

  _setRequestInvoicingStatus(entries, session) {
    return this.schema.Request.updateMany({ _id: { $in: entries.map((e) => new ObjectId(e.requestId)) } }, {
      $set: {
        'workflows.$[workflow].tasks.$[task].invoiceDetails.$[invoiceDetail].invoice.status': DRAFTED_STATUS,
      },
    }, {
      new: true,
      session,
      $arrayFilters: [
        { 'task._id': { $in: entries.map((e) => new ObjectId(e.taskId)) } },
        { 'workflow._id': { $in: entries.map((e) => new ObjectId(e.workflowId)) } },
        { 'invoiceDetail.invoice._id': entries.map((e) => new ObjectId(e._id)) },
      ],
    });
  }

  async _appendEntriesToDraftedInvoice(entries, newInvoice, session) {
    if (entries.length > 0) {
      return await Promise.all([
        this._setInvoiceEntries(entries, newInvoice, session),
        this._setRequestInvoicingStatus(entries, session),
      ]);
    }
  }

  async createInvoiceFromCsv(newInvoice, session) {
    let entries = [];
    const updatesLimit = 2000;
    let updatesCounter = 0;
    const cursor = this.getImportedEntries(session);
    try {
      let hasProcessedEntries = false;
      await cursor.eachAsync(async ({ entry }) => {
        hasProcessedEntries = true;
        entry.status = DRAFTED_STATUS;
        entry.processed = false;
        entry.show = entry.show === 'TRUE';
        const hasMoreEntries = await cursor.cursor.hasNext();
        if (updatesCounter >= updatesLimit || !hasMoreEntries) {
          entries.push(entry);
          await this._appendEntriesToDraftedInvoice(entries, newInvoice, session);
          updatesCounter = 0;
          entries = [];
        } else {
          entries.push(entry);
          updatesCounter++;
        }
      });
      if (!hasProcessedEntries) {
        throw new Error('Failed to create invoice from the uploaded file. The uploaded entries are already part of an existing Invoice. No entries were processed.');
      }
    } catch (err) {
      if (!err.toString().match('MongoError: Cursor is closed')) {
        this.logger.debug(`Invoice: ${this.user.email}. Error: ${err}`);
        throw new RestError(500, { message: `Invoice creation failed: ${err}` });
      }
    }
  }

  async createInvoiceModel(invoice, session) {
    const { quotation, base, quote } = this.lspExchangeDetails;
    const invoiceEntries = _.get(invoice, 'entries', []);
    let invoiceAmount = 0;
    if (!_.isEmpty(invoiceEntries)) {
      invoiceAmount = invoiceEntries.reduce((agg, invoiceEntry) => sum(decimal128ToNumber(invoiceEntry.amount), agg), 0).toFixed(2);
    }
    const invoiceModel = Object.assign(invoice, {
      siConnector: {
        isMocked: this.mock,
        isSynced: false,
        error: null,
      },
      company: new ObjectId(invoice.company),
      contact: new ObjectId(invoice.contact),
      accounting: {
        currency: _.pick(quote, ['_id', 'isoCode']),
        localCurrency: _.pick(base, ['_id', 'isoCode']),
        exchangeRate: quotation,
        amount: invoiceAmount,
      },
      lspId: this.lspId,
    });
    if (_.has(invoice, 'salesRep')) {
      const salesRepId = new mongoose.Types.ObjectId(_.get(invoice, 'salesRep._id', invoice.salesRep));

      if (validObjectId(salesRepId)) {
        this.logger.debug(`Invoice: ${this.user.email} searching for sales rep ${invoice.salesRep}`);
        invoiceModel.salesRep = await this.schema.User.findOneWithDeleted({ _id: salesRepId }, '_id firstName lastName email').lean();
      }
    }
    this.logger.debug(`Invoice: ${this.user.email} Returning new ar invoice model`);
    const newInvoiceSchema = new this.schema.ArInvoice(invoiceModel);
    newInvoiceSchema.setAccountingDetails();
    await this.schema.ArInvoice.setNo(newInvoiceSchema, session);
    const newInvoice = await newInvoiceSchema.save({ session });
    return newInvoice;
  }

  async edit(invoiceData) {
    const _id = new mongoose.Types.ObjectId(invoiceData._id);
    const invoiceInDb = await this.schema.ArInvoice.findOne({
      _id,
      lspId: this.lspId,
    });

    if (_.isNil(invoiceInDb)) {
      throw new Error(`Invoice ${_id} does not exist`);
    }
    const newData = _.pick(invoiceData, ['templates', 'entries', 'siConnector', 'description']);
    if (this.mock) {
      _.set(newData, 'siConnector.isMocked', true);
    }
    const isSynced = _.get(invoiceInDb, 'siConnector.isSynced', false);
    const hasSyncedError = _.get(invoiceInDb, 'siConnector.error', '');

    if (!isSynced && hasSyncedError) {
      await this._updateInvoiceIfSyncFailed(newData, invoiceData, invoiceInDb);
    }
    newData.entries = invoiceInDb.entries.map((entry) => {
      const foundEntry = _.find(newData.entries, { _id: entry._id.toString() });

      if (!_.isEmpty(foundEntry)) {
        entry.show = foundEntry.show;
      }
      return entry;
    });
    invoiceInDb.safeAssign(newData);
    try {
      await invoiceInDb.save();
    } catch (err) {
      throw new Error(_.get(err, 'message', ''));
    }
    (new SiConnectorAPI(this.flags)).syncArInvoices({ _id: invoiceInDb._id })
      .catch((e) => this.logger.error(e));
    return this.getById(invoiceInDb._id);
  }

  async _updateInvoiceIfSyncFailed(newData, invoiceData, invoiceInDb) {
    const editableFields = _.pick(invoiceData, ['billingTerm', 'date', 'dueDate', 'glPostingDate', 'postOutOfPeriod', 'description']);

    Object.assign(newData, editableFields);
    await invoiceInDb.populate(ENTRIES_SYNC_FAILED_POPULATE_OPTIONS);
    invoiceInDb.entries.forEach((entry) => {
      const abilityPopulated = entry.ability._id;

      entry.ability = { ...abilityPopulated };
      const intDepPopulated = entry.internalDepartment._id;

      entry.internalDepartment = { ...intDepPopulated };
    });
  }

  async getRequestsForUpdate(invoice) {
    this.logger.debug(`Invoice: ${this.user.email} Getting requests for update`);
    const requestsTaskForUpdate = {};
    const requestsIdSet = new Set();

    _.each(invoice.entries, (entry) => {
      const { requestId } = entry;

      requestsIdSet.add(requestId);
      const keyExists = _.has(requestsTaskForUpdate, requestId);
      const { taskId } = entry;

      if (keyExists) {
        requestsTaskForUpdate[entry.requestId].push(taskId);
      } else {
        requestsTaskForUpdate[entry.requestId] = [taskId];
      }
    });
    const requests = await this.schema.Request.find(
      {
        lspId: this.lspId,
        _id: { $in: [...requestsIdSet] },
      },
    );
    this.logger.debug(`Invoice: ${this.user.email} Found requests for update. Length ${requests.length}`);
    return {
      requests,
      requestsTaskForUpdate,
    };
  }

  getUpdateTasksInvoiceDetailsOperation(request, workflow, taskIds, entryIds) {
    const filter = {
      _id: new ObjectId(request._id),
      lspId: this.lspId,
      requestInvoiceStatus: { $nin: [INVOICED_STATUS] },
    };
    const update = {
      $set: {
        'workflows.$[workflow].tasks.$[task].invoiceDetails.$[invoiceDetail].invoice.isInvoiced': true,
      },
    };
    return {
      updateOne: {
        filter,
        update,
        upsert: false,
        arrayFilters: [
          { 'workflow._id': new ObjectId(workflow._id) },
          { 'task._id': { $in: taskIds } },
          { 'invoiceDetail.invoice._id': { $in: entryIds } },
        ],
      },
    };
  }

  getUpdateTasksStatusOperations(request, workflow, taskIdsByStatus) {
    return Object.keys(taskIdsByStatus).map((status) => {
      const taskIds = taskIdsByStatus[status];
      const filter = {
        _id: new ObjectId(request._id),
        lspId: this.lspId,
        requestInvoiceStatus: { $nin: [INVOICED_STATUS] },
      };
      const update = {
        $set: {
          'workflows.$[workflow].tasks.$[task].status': status,
        },
      };
      return {
        updateOne: {
          filter,
          update,
          upsert: false,
          arrayFilters: [
            {
              'workflow._id': new ObjectId(workflow._id),
            },
            {
              'task._id': { $in: taskIds },
            },
          ],
        },
      };
    });
  }

  getReverseTasksStatusOperations(request, workflow, taskIds, entryIds) {
    const filter = {
      _id: new ObjectId(request._id),
      lspId: this.lspId,
      requestInvoiceStatus: { $in: [PARTIALLY_INVOICED_STATUS, INVOICED_STATUS] },
    };
    const update = {
      $set: {
        'workflows.$[workflow].tasks.$[task].status': APPROVED_STATUS,
        'workflows.$[workflow].tasks.$[task].invoiceDetails.$[invoiceDetail].invoice.isInvoiced': false,
      },
    };
    return {
      updateOne: {
        filter,
        update,
        upsert: false,
        arrayFilters: [
          { 'workflow._id': convertToObjectId(workflow._id) },
          { 'task._id': { $in: taskIds } },
          { 'invoiceDetail.invoice._id': { $in: entryIds } },
        ],
      },
    };
  }

  async reverseRequestInvoiceStatus(request, session) {
    this.logger.debug(`Invoice: ${this.user.email} Started reverseRequestInvoiceStatus`);
    const requestInDb = await this.schema.Request
      .findOne({ _id: convertToObjectId(request._id) }, 'workflows').session(session);
    this.logger.debug(`Invoice: ${this.user.email} Found requests for reverseRequestInvoiceStatus`);
    let invoiceDetailsInvoiced = 0;
    forEachTask(requestInDb, ({ task }) => {
      const invoiceDetails = _.get(task, 'invoiceDetails', []);
      invoiceDetails.forEach((details) => {
        const isInvoiced = _.get(details, 'invoice.isInvoiced', false);
        if (isInvoiced) {
          invoiceDetailsInvoiced++;
        }
      });
    });
    const requestInvoiceStatus = invoiceDetailsInvoiced === 0
      ? NOT_INVOICED_STATUS : PARTIALLY_INVOICED_STATUS;
    this.logger.debug(`Invoice: ${this.user.email} Started updating request for reverseRequestInvoiceStatus`);
    const updatedRequest = await this.schema.Request.findOneAndUpdate(
      {
        _id: convertToObjectId(request._id),
        requestInvoiceStatus: {
          $in: [PARTIALLY_INVOICED_STATUS, REQUEST_INVOICED_STATUS],
        },
      },
      {
        $set: {
          requestInvoiceStatus,
        },
      },
      { session, new: true },
    );
    this.logger.debug(`Invoice: ${this.user.email} Finished updating request for reverseRequestInvoiceStatus`);
    if (_.isNil(updatedRequest)) {
      this.logger.debug(`Invoice: ${this.user.email}. Failed to reverseRequestInvoiceStatus due to concurrency issues`);
      throw new RestError(422, { message: 'Failed to update request due to concurrency issues' });
    }
  }

  async reverseInvoice(invoiceId, reversedOnDate, memo) {
    try {
      const siApi = new SiConnectorAPI(this.flags);
      this.logger.debug(`Invoice: ${this.user.email} Started reversing process for Invoice ${invoiceId}`);
      const invoiceInDb = await this.schema.ArInvoice.findOne({
        _id: invoiceId,
        lspId: this.lspId,
        deleted: false,
      });
      if (_.isNil(invoiceInDb)) {
        throw new Error(`Invoice ${invoiceId} does not exist, reversing process aborted`);
      }
      if (invoiceInDb.accounting.paid !== 0 || !invoiceInDb.siConnector.isSynced) {
        throw new Error(`Invoice ${invoiceId} cannot revert`);
      }
      const entryIds = _.get(invoiceInDb, 'entries', []).map((entry) => convertToObjectId(entry._id));
      await this.provideTransaction(async (session) => {
        const { requests, requestsTaskForUpdate } = await this.getRequestsForUpdate(invoiceInDb);
        const tasksUpdates = [];
        await Promise.mapSeries(requests, async (request) => {
          const tasksIds = requestsTaskForUpdate[request._id.toString()];
          request.workflows.forEach((workflow) => {
            const taskIds = [];
            workflow.tasks.forEach((task) => {
              const isSameTask = tasksIds.some((taskId) => taskId.equals(task._id));
              if (!isSameTask) {
                return;
              }
              taskIds.push(convertToObjectId(task._id));
            });
            tasksUpdates.push(this.getReverseTasksStatusOperations(
              request,
              workflow,
              taskIds,
              entryIds,
            ));
          });
          this.logger.debug(`Invoice: ${this.user.email} Starting bulk write requests`);
          await this.schema.Request.bulkWrite(tasksUpdates, { session });
          this.logger.debug(`Invoice: ${this.user.email} Finished bulk write requests`);
          await this.reverseRequestInvoiceStatus(request, session);
        });
        this.logger.debug(`Invoice: ${this.user.email} Soft deleting invoice`);
        await this.schema.ArInvoice.findOneAndUpdate(
          {
            _id: invoiceInDb._id,
            lspId: this.lspId,
            deleted: false,
          },
          {
            $set: {
              reversedOnDate,
              reversedMemo: memo,
              deleted: true,
              status: REVERSED_STATUS,
              entries: [],
              'accounting.amount': 0,
              'accounting.amountInLocal': 0,
              'accounting.balance': 0,
              'accounting.balanceInLocal': 0,
            },
          },
          { session },
        );
        await siApi.voidArInvoice(invoiceInDb._id, session);
        this.logger.debug(`Invoice: ${this.user.email} Finished reversing process`);
      });
      return this.getById(invoiceInDb._id);
    } catch (err) {
      this.logger.error(`Invoice: Failed to reverse an invoice. User is: ${this.user.email}. ${err}`);
      const message = _.get(err, 'message', 'Unknown error');
      throw new RestError(500, { message: `An error occurred during reversing an invoice: ${message}` });
    }
  }

  async updateRequestsByInvoice(invoice, session) {
    const { requests, requestsTaskForUpdate } = await this.getRequestsForUpdate(invoice);
    const entries = _.get(invoice, 'entries', []);
    const entriesIdsToEntriesMap = entries.reduce((res, entry) => {
      res[entry._id.toString()] = entry;
      return res;
    }, {});
    this.logger.debug(`Invoice: ${this.user.email} Locking requests for update`);
    await Promise.map(requests, async (request) => {
      this.logger.debug(`Invoice: ${this.user.email} Finished locking requests for update`);
      const tasksIds = requestsTaskForUpdate[request._id.toString()];
      let totalProcessedTasks = 0;
      request.workflows.forEach((workflow) => {
        const isWorkflowInvoiced = workflow.tasks.every((task) => task.status === INVOICED_STATUS);

        if (isWorkflowInvoiced) {
          return;
        }
        workflow.tasks.forEach((task) => {
          const isSameTask = tasksIds.some((taskId) => taskId.equals(task._id));

          if (!isSameTask) {
            return;
          }
          if (task.status === TASK_CANCELLED_STATUS) {
            const allCancelled = task.providerTasks.every(
              (pt) => pt.status === PROVIDER_STATUS_CANCELLED,
            );
            if (allCancelled) {
              return;
            }
          }
          totalProcessedTasks++;
          const isMinChargeTask = decimal128ToNumber(task.minCharge) === decimal128ToNumber(task.total);
          task.invoiceDetails.forEach((invoiceDetail) => {
            if (invoiceDetail.invoice.isInvoiced) {
              return;
            }
            const invoiceId = _.get(invoiceDetail, 'invoice._id');
            const shouldMarkAsInvoiced = isMinChargeTask
              || _.has(entriesIdsToEntriesMap, invoiceId.toString());
            invoiceDetail.invoice.isInvoiced = shouldMarkAsInvoiced;
          });
          const isTaskInvoiced = task.invoiceDetails.every(
            (invoiceDetail) => invoiceDetail.invoice.isInvoiced,
          );
          task.status = isTaskInvoiced ? INVOICED_STATUS : PARTIALLY_INVOICED_STATUS;
        });
        request.markModified('workflows');
      });
      this.logger.debug(`Invoice: ${this.user.email} finished iterating requests`);
      if (totalProcessedTasks === 0) {
        this.logger.debug(`Invoice: ${this.user.email}. Error: Items already invoiced`);
        throw new RestError(422, { message: 'Items already invoiced' });
      }
      request.requestInvoiceStatus = getRequestInvoiceStatus(request);
      await request.save({ session });
    }, { concurrency: 50 });
    this.logger.debug(`Invoice: ${this.user.email} finished updating requests`);
  }

  async getFromRequestCurrencyPoLists(companyId) {
    const childCompanies = await this.schema.Company
      .getCompanyFamily(this.lspId, new ObjectId(companyId), { childrenOnly: true });
    const companiesIds = [
      ...childCompanies.map((child) => child._id),
      new ObjectId(companyId),
    ];

    const data = await this.schema.Request.aggregate([
      {
        $match: {
          lspId: this.lspId,
          'company._id': { $in: companiesIds },
          requestInvoiceStatus: { $ne: INVOICED_STATUS },
          'workflows.tasks.status': { $in: [PARTIALLY_INVOICED_STATUS, APPROVED_STATUS] },
        },
      },
      {
        $group: {
          _id: null,
          purchaseOrderOptions: {
            $addToSet: {
              $cond: [{ $ne: ['$purchaseOrder', ''] }, '$purchaseOrder', '$noval'],
            },
          },
          currencyOptions: {
            $addToSet: {
              $cond: [{ $ne: ['$quoteCurrency._id', ''] }, '$quoteCurrency._id', '$noval'],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          purchaseOrderOptions: 1,
          currencyOptions: 1,
        },
      },
    ]);
    const purchaseOrderOptions = _.get(data, '0.purchaseOrderOptions', []);
    const currencyOptions = _.get(data, '0.currencyOptions', []);
    return { purchaseOrderOptions, currencyOptions };
  }

  transformMoneyToCommaDecimalFormat(newInvoice) {
    Object.keys(newInvoice.accounting).forEach((key) => {
      if (key !== 'currency' && key !== 'localCurrency') {
        newInvoice.accounting[key] = toCommaDecimalFormat(newInvoice.accounting[key]);
      }
    });
    newInvoice.entries.forEach((entry) => {
      entry.price = toCommaDecimalFormat(entry.price);
      entry.amount = toCommaDecimalFormat(entry.amount);
    });
  }

  async prepareInvoice(invoice, lspInDb, template) {
    invoice.entries = invoice.entries.filter((entry) => entry.show === true);
    if (_.isEmpty(invoice.entries)) {
      throw new Error('all entries have flag show=false');
    }
    const salesRepFullName = `${_.get(invoice.salesRep, 'firstName', '')} ${_.get(invoice.salesRep, 'lastName', '')}`.trim();
    const isInvoiceDetailsVisible = !_.isEmpty(invoice.description)
      || !_.isEmpty(invoice.purchaseOrder)
      || !_.isEmpty(salesRepFullName);
    invoice = Object.assign(invoice, {
      isInvoiceDetailsVisible,
      salesRepFullName,
    });
    const requestIdList = invoice.entries.map((entry) => entry.requestId);
    const requests = await this.schema.Request
      .find({ lspId: this.lspId, _id: { $in: requestIdList } })
      .select(INVOICE_REQUEST_SELECT)
      .lean();

    invoice.entries.forEach((entry) => {
      entry.recipient = _.get(_.find(requests, { _id: entry.requestId }), 'recipient');
    });
    if (_.get(template, 'groupTaskItemsPerWorkflow', false)) {
      invoice.entries = this._groupInvoiceEntriesByWorkflowId(invoice.entries);
    }
    const request = requests[0];
    const lsp = { ...lspInDb, ...invoice.lspId };
    delete invoice.lspId;
    invoice.templateLogo = `/static/lsp-logos/${template.logoName}`;
    lsp.logoImage = _.get(lsp, 'logoImage.base64Image', '');
    const city = _.get(lsp, 'addressInformation.city', '');
    const state = _.get(lsp, 'addressInformation.state.name', '');
    const zip = _.get(lsp, 'addressInformation.zip', '');
    const country = _.get(lsp, 'addressInformation.country.name', '');
    const address = `${city} ${state} ${zip} ${country}`;

    _.set(lsp, 'addressInformation.address', address);
    request.expectedStartDate = toTemplateDateFormat(request.expectedStartDate);
    request.actualStartDate = toTemplateDateFormat(request.actualStartDate);
    Object.assign(invoice, {
      lsp,
      contact: Object.assign(
        invoice.contact,
        { billingAddress: invoice.contact.contactDetails.billingAddress },
      ),
      dueDate: toTemplateDateFormat(invoice.dueDate),
      date: toTemplateDateFormat(invoice.date),
      request,
    });
    this.transformMoneyToCommaDecimalFormat(invoice);
    return invoice;
  }

  _groupInvoiceEntriesByWorkflowId(entries) {
    const groupedEntries = entries.reduce((agg, entry) => {
      const workflowId = _.get(entry, 'workflowId');
      if (_.isUndefined(agg[workflowId])) {
        agg[workflowId] = { ...entry, amount: decimal128ToNumber(_.get(entry, 'amount')) };
      } else {
        let total = sum(decimal128ToNumber(entry.amount), agg[workflowId].amount, { precision: 2 });
        if (!_.isNumber(total)) {
          total = total.toNumber();
        }
        agg[workflowId].amount = total;
      }
      return agg;
    }, {});
    return Object.values(groupedEntries);
  }

  async getTemplateData(invoice, template, footerTemplate, lsp, currency) {
    const newInvoice = await this.prepareInvoice(invoice, lsp, template);
    const customFields = getCustomFieldsForTemplate(invoice, template);
    const hiddenFields = getHiddenFieldsForTemplate(invoice, template);
    const hideableFields = _.get(template, 'hideableFields', []);
    const footerTemplateDescription = _.get(footerTemplate, 'description', '');
    const currencySymbol = _.get(currency, 'list.[0].symbol', '');
    return {
      template: template.template,
      footerTemplate: footerTemplateDescription,
      invoice: newInvoice,
      customFields,
      hiddenFields,
      currencySymbol,
      hideableFields,
    };
  }

  async getInvoiceActivity(id) {
    const extraLookupOptions = [
      {
        $lookup: {
          from: 'templates',
          let: {
            templateId: '$templates.email._id',
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$$templateId', '$_id'] } } },
            {
              $project: {
                _id: 1,
                name: 1,
                template: 1,
              },
            },
          ],
          as: 'template',
        },
      },
      {
        $addFields: {
          invoiceTemplate: { $arrayElemAt: ['$template', 0] },
        },
      },
    ];
    const invoice = await this.getById(id, extraLookupOptions, true);
    const emailDetails = await this.getEmailDetails(invoice);
    return { activityType: 'Email', subject: `Invoice number: ${invoice.no}`, emailDetails };
  }

  async getEmailDetails(invoice) {
    const internalDepartments = new Set();
    const requests = [];
    await Promise.map(invoice.entries, (entry) => {
      if (!requests.find((r) => r.no === entry.requestNo)) {
        requests.push({ _id: entry.requestId, no: entry.requestNo });
      }
      internalDepartments.add(entry.internalDepartment._id);
    });
    const emailTemplate = _.get(invoice, 'invoiceTemplate');
    const compiledTemplate = handlebars.compile(emailTemplate.template);
    const htmlBody = compiledTemplate({
      invoice: {
        no: invoice.no,
        contact: `${invoice.contact.firstName} ${invoice.contact.lastName}`,
      },
    });
    const company = _.pick(invoice.company, ['_id', 'hierarchy', 'name', 'status']);
    const emailDetails = {
      isInvoice: true,
      from: invoice.createdBy,
      to: [invoice.contact.contactDetails.billingEmail],
      cc: [],
      bcc: [],
      internalDepartments: [...internalDepartments],
      company,
      requests,
      emailTemplate: emailTemplate.name,
      htmlBody,
      invoiceNo: invoice.no,
    };
    return emailDetails;
  }

  _setRoleFilters(query) {
    if (this.user.has(ROLES.READ_COMPANY)) {
      const companyId = new ObjectId(_.get(this.user, 'company._id'));
      const companyName = _.get(this.user, 'company.name');
      query.$or = [
        { companyId },
        { companyHierarchy: new RegExp(`^${_.escapeRegExp(companyName)} :`, 'i') },
        { companyHierarchy: new RegExp(`: ${_.escapeRegExp(companyName)} :`, 'i') },
      ];
    } else if (this.user.has(ROLES.READ_OWN)) {
      if (this.user.type === CONTACT_TYPE) {
        query.contactId = new mongoose.Types.ObjectId(this.user._id);
      } else {
        query.createdBy = this.user.email;
      }
    }
  }
}

module.exports = ArInvoiceApi;
