const mongoose = require('mongoose');
const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const { exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const { RestError } = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const { searchFactory, countFactory } = require('../../../utils/pagination');
const { decimal128ToNumber, bigJsToRoundedNumber } = require('../../../utils/bigjs');
const { areObjectIdsEqual } = require('../../../utils/schema');

const { ObjectId } = mongoose.Types;
const WORKFLOW_TASK_STATUS_APPROVED = 'Approved';
const WORKFLOW_TASK_STATUS_PARTIALLY_INVOICED = 'Partially Invoiced';
const PROVIDER_TASK_STATUS_APPROVED = 'approved';

class ArInvoiceEntryApi extends SchemaAwareAPI {
  constructor(logger, { user, configuration }) {
    super(logger, { user });
    this.configuration = configuration;
    this.showEntriesIds = [];
    this.show = false;
  }

  canImportCsv() {
    return this.user.has(['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL']);
  }

  _manageShowFilter(params) {
    this.showEntriesIds = _.get(params, 'showEntriesIds', []).map((id) => new ObjectId(id));
    if (!_.isEmpty(this.showEntriesIds)) {
      const filter = JSON.parse(params.filter);
      this.show = filter.show;
    }
  }

  async _getQueryNewInvoiceEntries(filters) {
    const params = _.get(filters, 'params');
    const paginationParams = _.get(filters, 'paginationParams', {});
    this._manageShowFilter(params);
    const childCompanies = await this.schema.Company
      .getCompanyFamily(this.lspId, new ObjectId(params.companyId), { childrenOnly: true });
    const companiesIds = [
      ...childCompanies.map((child) => child._id),
      new ObjectId(params.companyId),
    ];
    const query = {
      lspId: this.lspId,
      'company._id': { $in: companiesIds },
      'quoteCurrency._id': new ObjectId(params.currencyId),
      'workflows.tasks.status': { $in: [WORKFLOW_TASK_STATUS_PARTIALLY_INVOICED, WORKFLOW_TASK_STATUS_APPROVED] },
      ...paginationParams,
    };
    if (_.has(params, 'purchaseOrder')) {
      query.purchaseOrder = params.purchaseOrder;
    }
    return query;
  }

  _getExtraPipelinesNewInvoiceEntries(filters) {
    const currencyId = new ObjectId(_.get(filters, 'params.currencyId'));
    const workflowPath = '$workflows';
    const tasksPath = `${workflowPath}.tasks`;
    const invoiceDetailsPath = `${tasksPath}.invoiceDetails`;
    const invoicePath = `${invoiceDetailsPath}.invoice`;
    const matchStage1 = {
      'workflows.tasks.status': { $in: [WORKFLOW_TASK_STATUS_APPROVED, WORKFLOW_TASK_STATUS_PARTIALLY_INVOICED] },
      'workflows.tasks.providerTasks.status': PROVIDER_TASK_STATUS_APPROVED,
    };
    const lookUpInternalDepartments = {
      from: 'internalDepartments',
      let: { internalDepartmentId: { $toObjectId: '$internalDepartment._id' } },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$_id', '$$internalDepartmentId'],
            },
          },
        },
        {
          $project: { _id: 1, name: 1, accountingDepartmentId: 1 },
        },
      ],
      as: 'internalDepartments',
    };
    const lookupLsp = {
      from: 'lsp',
      localField: 'lspId',
      foreignField: '_id',
      as: 'lsp',
    };
    const addFieldsStage1 = {
      internalDepartment: { $arrayElemAt: ['$internalDepartments', 0] },
      requestId: '$_id',
      requestDeliveryDate: '$deliveryDate',
      externalAccountingCode: '$externalAccountingCode.name',
      _id: `${invoicePath}._id`,
      isInvoiced: `${invoicePath}.isInvoiced`,
      currencyExchangeDetail: {
        $arrayElemAt: [
          {
            $filter: {
              input: '$lsp.currencyExchangeDetails',
              as: 'item',
              cond: { $eq: ['$$item.quote', currencyId] },
            },
          }, 0,
        ],
      },
    };
    const matchStage2 = {
      isInvoiced: false,
    };
    if (!_.isEmpty(this.showEntriesIds)) {
      matchStage2._id = { $in: this.showEntriesIds };
    }
    const addFieldsStage2 = {
      accountingDepartmentId: '$internalDepartment.accountingDepartmentId',
      internalDepartmentName: '$internalDepartment.name',
      requestNo: '$no',
      requestDescription: `${tasksPath}.description`,
      workflowId: `${workflowPath}._id`,
      workflowDescription: `${workflowPath}.description`,
      taskId: `${tasksPath}._id`,
      taskName: `${tasksPath}.ability`,
      companyName: '$company.name',
      translationUnitName: { $ifNull: [`${invoicePath}.translationUnit.name`, ''] },
      dateOfApproval: `${tasksPath}.dateOfApproval`,
      isLanguageCombinationExist: {
        $convert: {
          input: { $concat: ['$workflows.srcLang.name', '$workflows.tgtLang.name'] },
          to: 'bool',
          onNull: false,
        },
      },
      localTaskTotal: `${tasksPath}.total`,
      taskTotal: `${tasksPath}.foreignTotal`,
      reverseEx: { $divide: [1, '$currencyExchangeDetail.quotation'] },
      minCharge: `${tasksPath}.foreignMinCharge`,
      price: `${invoicePath}.foreignUnitPrice`,
      amount: `${invoicePath}.foreignTotal`,
      breakdown: { $ifNull: [`${invoicePath}.breakdown.name`, ''] },
    };
    const addFieldsStage3 = {
      localMinCharge: { $divide: ['$minCharge', '$currencyExchangeDetail.quotation'] },
      localPrice: { $divide: ['$price', '$currencyExchangeDetail.quotation'] },
      isTotalGreaterOrDiscount: {
        $or: [
          { $gt: ['$taskTotal', '$minCharge'] },
          { $lt: ['$taskTotal', 0] },
        ],
      },
      wordsBreakdown: {
        $cond: [
          { $eq: ['$translationUnitName', 'Words'] },
          '$breakdown',
          '',
        ],
      },
      languageCombination: {
        $cond: [
          '$isLanguageCombinationExist',
          { $concat: ['$workflows.srcLang.name', ' to ', '$workflows.tgtLang.name'] },
          '',
        ],
      },
      languageCombinationDelimiter: { $cond: ['$isLanguageCombinationExist', '-', ''] },
    };
    const addFieldsStage4 = {
      numberTitleLangCombDescription: { $concat: ['$requestNo', ' - ', '$title', ' - ', '$languageCombination'] },
      quantity: { $cond: ['$isTotalGreaterOrDiscount', `${invoicePath}.quantity`, 1] },
      quantityMemo: `${invoicePath}.quantity`,
      price: { $cond: ['$isTotalGreaterOrDiscount', '$price', '$minCharge'] },
      localPrice: { $cond: ['$isTotalGreaterOrDiscount', '$localPrice', '$localMinCharge'] },
      amount: { $cond: ['$isTotalGreaterOrDiscount', '$amount', '$minCharge'] },
    };
    const addFieldsStage5 = {
      price: { $toDouble: '$price' },
      localPrice: { $toDouble: '$localPrice' },
      quantity: '$quantity',
      quantityMemo: { $toString: '$quantityMemo' },
      amount: { $toDouble: '$amount' },
      localAmount: { $toDouble: { $multiply: ['$localPrice', '$quantity'] } },
      show: this.show,
    };
    const lookUpAbilities = {
      from: 'abilities',
      let: { taskName: '$taskName', lspId: '$lspId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$name', '$$taskName'] },
                { $eq: ['$lspId', '$$lspId'] },
              ],
            },
          },
        },
        {
          $project: { name: 1, glAccountNo: 1 },
        },
      ],
      as: 'abilities',
    };
    const addFieldsStage6 = {
      ability: { $arrayElemAt: ['$abilities', 0] },
      memo: {
        $concat: [
          '$requestNo', '-', '$taskName', '$languageCombinationDelimiter', '$languageCombination', '-',
          '$quantityMemo', ' ', '$translationUnitName', ' ', '$wordsBreakdown',
        ],
      },
    };
    const addFieldsStage7 = {
      glAccountNo: '$ability.glAccountNo',
    };
    const cleanStage = {
      _id: 1,
      workflowId: 1,
      workflowDescription: 1,
      taskId: 1,
      taskName: 1,
      requestId: 1,
      requestDeliveryDate: 1,
      requestNo: 1,
      localTaskTotal: 1,
      reverseEx: 1,
      glAccountNo: 1,
      purchaseOrder: 1,
      companyName: 1,
      ability: 1,
      internalDepartment: 1,
      internalDepartmentName: 1,
      memo: 1,
      requestDescription: 1,
      numberTitleLangCombDescription: 1,
      quantity: 1,
      price: 1,
      localPrice: 1,
      amount: 1,
      localAmount: 1,
      show: 1,
      minCharge: 1,
      taskTotal: 1,
      isInvoiced: 1,
      externalAccountingCode: 1,
      breakdown: 1,
      languageCombination: 1,
    };
    const unsetStage = [
      'lsp',
      'partners',
      'title',
      'abilities',
      'company',
      'contact',
      'workflows',
      'quoteDueDate',
      'receptionDate',
      'repSignOff',
      'deliveryDate',
      'requestInvoiceStatus',
      'requireQuotation',
      'restoredAt',
      'rooms',
      'rush',
      'softwareRequirements',
      'sourceDocumentsList',
      'status',
      'translationUnitName',
      'turnaroundTime',
      'actualStartDate',
      'adjuster',
      'assignmentStatus',
      'billGp',
      'billTotal',
      'bucketPrefixes',
      'cancelledAt',
      'catTool',
      'comments',
      'competenceLevels',
      'completedAt',
      'currencyExchangeDetail',
      'dateOfApproval',
      'deliveryMethod',
      'departmentNotes',
      'documentTypes',
      'expectedDurationTime',
      'expectedStartDate',
      'finalDocuments',
      'internalComments',
      'isLanguageCombinationExist',
      'isQuoteApproved',
      'isTotalGreaterOrDiscount',
      'languageCombinationDelimiter',
      'late',
      'opportunityNo',
      'projectManagers',
      'projectedCostGp',
      'actualDeliveryDate',
      'atendees',
      'wordsBreakdown',
      'deletedAt',
      'foreignBillTotal',
      'foreignProjectedCostTotal',
      'languageCombinations',
      'languageCombinationsText',
    ];
    const extraPipelines = [
      { $lookup: lookupLsp },
      { $unwind: '$lsp' },
      { $lookup: lookUpInternalDepartments },
      { $unwind: workflowPath },
      { $unwind: tasksPath },
      { $match: matchStage1 },
      { $unwind: invoiceDetailsPath },
      { $addFields: addFieldsStage1 },
      { $match: matchStage2 },
      { $addFields: addFieldsStage2 },
      { $addFields: addFieldsStage3 },
      { $addFields: addFieldsStage4 },
      { $addFields: addFieldsStage5 },
      { $lookup: lookUpAbilities },
      { $addFields: addFieldsStage6 },
      { $addFields: addFieldsStage7 },
      { $sort: { dateOfApproval: 1 } },
      { $project: cleanStage },
      { $unset: unsetStage },
    ];
    return extraPipelines;
  }

  _getExtraQueryParams() {
    return [
      '_id', 'requestNo', 'internalDepartmentName', 'requestDeliveryDate', 'request', 'companyName', 'glAccountNo', 'taskName',
      'quantity', 'price', 'memo', 'amount', 'show', 'requestDescription', 'purchaseOrder', 'externalAccountingCode',
    ];
  }

  _getQueryExistingInvoiceEntries(filters) {
    const params = _.get(filters, 'params');
    const paginationParams = _.omit(_.get(filters, 'paginationParams', {}), '__tz');
    const query = {
      lspId: this.lspId,
      _id: new ObjectId(params._id),
      ...paginationParams,
    };
    return query;
  }

  _getExtraPipelinesExistingInvoiceEntries() {
    const unwind = { path: '$entries' };
    const project = {
      requestNo: 1,
      requestId: 1,
      _id: 1,
      requestDeliveryDate: 1,
      requestDescription: 1,
      purchaseOrder: 1,
      companyName: 1,
      taskName: 1,
      glAccountNo: 1,
      memo: 1,
      internalDepartmentName: 1,
      numberTitleLangCombDescription: 1,
      internalDepartment: 1,
      accountingDepartmentId: 1,
      internalDepartmentId: 1,
      workflowId: 1,
      taskId: 1,
      ability: 1,
      show: 1,
      localPrice: 1,
      localAmount: 1,
      amount: { $toDouble: '$amount' },
      quantity: { $toDouble: '$quantity' },
      price: { $toDouble: '$price' },
      externalAccountingCode: 1,
    };
    const extraPipelines = [
      { $unwind: unwind },
      {
        $addFields: {
          requestId: '$entries.requestId',
          requestNo: '$entries.requestNo',
          ability: '$entries.ability',
          requestDescription: '$entries.requestDescription',
          numberTitleLangCombDescription: '$entries.numberTitleLangCombDescription',
          companyName: '$entries.companyName',
          workflowId: '$entries.workflowId',
          taskId: '$entries.taskId',
          taskName: '$entries.taskName',
          purchaseOrder: '$entries.purchaseOrder',
          price: '$entries.price',
          amount: '$entries.amount',
          quantity: '$entries.quantity',
          show: '$entries.show',
          memo: '$entries.memo',
          _id: '$entries._id',
          externalAccountingCode: '$entries.externalAccountingCode',
          localPrice: { $toString: '$entries.localPrice' },
          localAmount: { $toString: { $multiply: ['$entries.localPrice', '$entries.quantity'] } },
        },
      },
      {
        $addFields: {
          internalDepartment: '$entries.internalDepartment',
          accountingDepartmentId: '$entries.internalDepartment.accountingDepartmentId',
          internalDepartmentId: '$entries.internalDepartment._id',
          internalDepartmentName: {
            $cond: [
              { $ifNull: ['$entries.internalDepartment.name', false] },
              '$entries.internalDepartment.name',
              '$entries.internalDepartmentName',
            ],
          },
          glAccountNo: {
            $cond: [
              { $ifNull: ['$entries.ability.glAccountNo', false] },
              '$entries.ability.glAccountNo',
              '$entries.glAccountNo',
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'requests',
          as: 'requestObj',
          let: { requestId: '$requestId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$requestId', '$_id'] },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          requestDeliveryDate: '$requestObj.deliveryDate',
        },
      },
      {
        $project: project,
      },
    ];
    return extraPipelines;
  }

  groupInvoiceEntriesByMinCharge(list) {
    const groupedList = [];
    list.forEach((entry) => {
      entry.taskTotal = decimal128ToNumber(entry.taskTotal);
      entry.localTaskTotal = decimal128ToNumber(entry.localTaskTotal);
      entry.minCharge = decimal128ToNumber(entry.minCharge);
      if (entry.minCharge === 0 || entry.taskTotal > entry.minCharge) {
        groupedList.push(entry);
        return;
      }
      const sameTaskExists = groupedList.some((ge) => areObjectIdsEqual(ge.workflowId, entry.workflowId)
        && areObjectIdsEqual(ge.taskId, entry.taskId));
      if (!sameTaskExists) {
        const modifiedEntry = {
          ...entry,
          quantity: 1,
          taskName: entry.taskName += ' - Min. charge',
          price: entry.minCharge,
        };
        groupedList.push(modifiedEntry);
      }
    });
    return groupedList;
  }

  async export(filters, res) {
    const hasInvoiceId = _.has(filters, 'params._id');
    const schema = hasInvoiceId ? this.schema.ArInvoice : this.schema.Request;
    try {
      const query = hasInvoiceId
        ? this._getQueryExistingInvoiceEntries(filters)
        : await this._getQueryNewInvoiceEntries(filters);
      const pipelines = hasInvoiceId
        ? this._getExtraPipelinesExistingInvoiceEntries()
        : this._getExtraPipelinesNewInvoiceEntries(filters);
      const columnOptions = this.schema.ArInvoice.getEntriesExportOptions();
      const writer = csvWriter(columnOptions);
      const csvFileName = CsvExport.buildProperFilename(query, this.schema.ArInvoice);
      const requestHeaders = {
        'Content-Type': 'text/csv',
        'Content-disposition': `attachment;filename=${csvFileName}.csv`,
      };
      res.writeHead(200, requestHeaders);
      writer.pipe(res);
      const cursor = await exportFactory(
        schema,
        query,
        pipelines,
        this._getExtraQueryParams(),
        filters.__tz,
      );
      const writtenEntries = [];
      await cursor.eachAsync((doc) => {
        const row = this.schema.ArInvoice.setEntriesCsvTransformations(doc);
        const taskTotal = decimal128ToNumber(doc.taskTotal);
        const minCharge = decimal128ToNumber(doc.minCharge);
        if (hasInvoiceId || minCharge === 0 || taskTotal > minCharge) {
          writtenEntries.push(doc);
          return writer.write(row);
        }
        const sameTaskExists = writtenEntries.some((writtenEntry) => areObjectIdsEqual(writtenEntry.workflowId, doc.workflowId)
          && areObjectIdsEqual(writtenEntry.taskId, doc.taskId));
        if (!sameTaskExists) {
          const modifiedRow = {
            ...row,
            Quantity: 1,
            'Task Name': row['Task Name'] += ' - Min. charge',
            Price: doc.minCharge,
          };
          writtenEntries.push(doc);
          return writer.write(modifiedRow);
        }
      });
      return res.end();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error exporting to CSV: ${message}`);
      throw new RestError(500, { message });
    }
  }

  async listNewInvoiceEntries(filters) {
    const query = await this._getQueryNewInvoiceEntries(filters);
    const extraPipelines = this._getExtraPipelinesNewInvoiceEntries(filters);
    const extraQueryParams = this._getExtraQueryParams();
    const countResult = await countFactory(
      this.schema.Request,
      query,
      extraPipelines,
      extraQueryParams,
      filters.__tz,
      true,
    );
    let list = await searchFactory({
      model: this.schema.Request,
      filters: query,
      extraPipelines,
      extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    });
    this._roundLocalAmount(list);
    // TODO should be part of the aggregation, this is the quickest way to solve this now
    list = this.groupInvoiceEntriesByMinCharge(list);
    return { list, total: list.length, totalRecords: countResult.length };
  }

  async listExistingInvoiceEntries(filters) {
    const query = this._getQueryExistingInvoiceEntries(filters);
    const extraPipelines = this._getExtraPipelinesExistingInvoiceEntries();
    const extraQueryParams = this._getExtraQueryParams();
    const list = await searchFactory({
      model: this.schema.ArInvoice,
      filters: query,
      extraPipelines,
      extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    });
    this._roundLocalAmount(list);
    return { list, total: list.length };
  }

  _roundLocalAmount(list) {
    list.forEach((entry) => {
      entry.localAmount = bigJsToRoundedNumber(entry.localAmount, 2);
    });
  }
}

module.exports = ArInvoiceEntryApi;
