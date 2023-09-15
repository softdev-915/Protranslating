// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const siConnectorPlugin = require('../plugins/si-connector');
const transactionHelper = require('../plugins/transaction-helper');
const attachmentsPlugin = require('../plugins/attachments-plugin');
const arEntityPlugin = require('../plugins/ar-entity-plugin');
const { bigJsToNumber, bigJsToRoundedNumber, decimal128ToNumber } = require('../../../../utils/bigjs');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const { convertToObjectId } = require('../../../../utils/schema');
const importModulePlugin = require('../plugins/import-module');
const Big = require('big.js');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const Decimal128 = mongoose.Types.Decimal128;
const STATUSES = {
  DRAFTED: 'Drafted',
  IN_PROGRESS: 'In Progress',
  POSTED: 'Posted',
  PAID: 'Paid',
  PART_PAID: 'Partially Paid',
  VOIDED: 'Voided',
  REVERSED: 'Reversed',
};

const InvoiceTemplateSchema = new Schema({
  invoice: {
    _id: {
      type: ObjectId,
      ref: 'Template',
    },
    name: String,
    customFields: Object,
    hiddenFields: [{ type: String }],
  },
  email: {
    _id: {
      type: ObjectId,
      ref: 'Template',
    },
    name: String,
  },
}, { _id: false });

const EntryInvoiceSchema = new Schema({
  taskId: ObjectId,
  taskName: {
    type: String,
    default: '',
  },
  requestId: {
    type: ObjectId,
    ref: 'Request',
    set: convertToObjectId,
  },
  requestNo: {
    type: String,
    required: true,
  },
  externalAccountingCode: {
    type: String,
    required: false,
  },
  ability: {
    _id: {
      type: ObjectId,
      ref: 'Ability',
      set: convertToObjectId,
    },
    glAccountNo: {
      type: String,
    },
  },
  purchaseOrder: {
    type: String,
    default: '',
  },
  companyName: {
    type: String,
    required: true,
  },
  internalDepartment: {
    _id: {
      type: ObjectId,
      ref: 'InternalDepartment',
      set: convertToObjectId,
    },
    name: {
      type: String,
      required: true,
    },
    accountingDepartmentId: {
      type: String,
      required: true,
    },
  },
  memo: {
    type: String,
    required: true,
  },
  breakdown: {
    type: String,
    default: '',
  },
  languageCombination: {
    type: String,
    default: '',
  },
  requestDescription: {
    type: String,
    default: '',
  },
  numberTitleLangCombDescription: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  amount: {
    type: Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  localPrice: {
    type: Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  localAmount: {
    type: Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  workflowId: {
    type: ObjectId,
    set: convertToObjectId,
  },
  workflowDescription: {
    type: String,
    default: '',
  },
  show: {
    type: Boolean,
    default: false,
    set: (value) => {
      if (_.isString(value)) {
        return value.toLowerCase() === 'true';
      }

      return value;
    },
  },
  status: {
    type: String,
    enum: ['Posted', 'In Progress', 'Drafted'],
  },
  processed: {
    type: Boolean,
  },
});

const InvoiceSchema = new Schema({
  no: {
    type: String,
  },
  company: {
    type: ObjectId,
    ref: 'Company',
  },
  contact: {
    type: ObjectId,
    ref: 'User',
  },
  purchaseOrder: {
    type: String,
    default: '',
  },
  billingTerm: {
    _id: {
      type: ObjectId,
      ref: 'BillingTerm',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  glPostingDate: {
    type: Date,
    required: true,
  },
  postOutOfPeriod: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: '',
  },
  salesRep: {
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    firstName: String,
    lastName: String,
    email: String,
  },
  revenueRecognition: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  templates: {
    type: InvoiceTemplateSchema,
    required: true,
  },
  entries: {
    type: [EntryInvoiceSchema],
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  reversedOnDate: {
    type: Date,
  },
  reversedMemo: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.keys(STATUSES).map(s => STATUSES[s]),
  },
}, { collection: 'arInvoices', timestamps: true });

InvoiceSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

InvoiceSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance
    .virtual('ID', item => _.get(item, '_id', ''))
    .virtual('Invoice No', item => _.get(item, 'no', ''))
    .virtual('Date', item => _.get(item, 'date', ''))
    .virtual('Company ID', item => _.get(item, 'company._id', ''))
    .virtual('Company Name', item => _.get(item, 'companyName', ''))
    .virtual('Status', item => _.get(item, 'status', ''))
    .virtual('PO #', item => _.get(item, 'purchaseOrder', ''))
    .virtual('Contact Name', item => _.get(item, 'contactName', ''))
    .virtual('Due Date', item => _.get(item, 'dueDate', ''))
    .virtual('Invoice Total', item => _.get(item, 'amount', ''))
    .virtual('Balance', item => _.get(item, 'balance', ''))
    .virtual('Amount Paid', item => _.get(item, 'paid', ''))
    .virtual('Invoice post completion progress', item => _.get(item, 'creationProgress', ''))
    .virtual('Currency', item => _.get(item, 'accounting.currency.isoCode', ''))
    .virtual('Billing Terms', item => _.get(item, 'billingTerm.name', ''))
    .virtual('Contact Email', item => _.get(item, 'contactEmail', ''))
    .virtual('Billing Address', item => _.get(item, 'contactBillingAddress', ''))
    .virtual('Description', item => _.get(item, 'description', ''))
    .virtual('Sales Rep', item => _.get(item, 'salesRepName', ''))
    .virtual('Synced', item => _.get(item, 'isSynced', ''))
    .virtual('Last Sync Date', item => _.get(item, 'lastSyncDate', ''))
    .virtual('Sync Error', item => _.get(item, 'syncError', ''))
    .virtual('Requests', item => _.get(item, 'requestNoList', ''))
    .virtual('Inactive', ({ deleted }) => (deleted ? 'true' : 'false'))
    .virtual('Email Template', item => _.get(item, 'templates.email.name', ''))
    .virtual('Exchange Rate', item => _.get(item, 'exchangeRate', ''))
    .virtual('GL Posting Date', item => _.get(item, 'glPostingDate', ''))
    .virtual('Invoice Template', item => _.get(item, 'templates.invoice.name', ''))
    .virtual('Local Amount', item => _.get(item, 'localAmount', ''))
    .virtual('Local Currency', item => _.get(item, 'accounting.localCurrency.isoCode', ''))
    .virtual('Post out of Period', item => _.get(item, 'postOutOfPeriod', ''))
    .virtual('Send', item => _.get(item, 'sent', ''))
    .virtual('External Accounting Code #', item => _.get(item, 'externalAccountingCode', ''))
    .virtual('Created At', item => _.get(item, 'createdAt', ''))
    .virtual('Created By', item => _.get(item, 'createdBy', ''))
    .virtual('Updated At', item => _.get(item, 'updatedAt', ''))
    .virtual('Updated By', item => _.get(item, 'updatedBy', ''))
    .virtual('Deleted At', item => _.get(item, 'deletedAt', ''))
    .virtual('Deleted By', item => _.get(item, 'deletedBy', ''))
    .virtual('Restored At', item => _.get(item, 'restoredAt', ''))
    .virtual('Restored By', item => _.get(item, 'restoredBy', ''));
};

InvoiceSchema.statics.setEntriesCsvTransformations = function (doc) {
  return {
    _id: doc._id,
    Memo: doc.memo,
    Show: doc.show,
    Price: doc.price,
    taskID: doc.taskId,
    Amount: doc.amount,
    Quantity: doc.quantity,
    requestId: doc.requestId,
    Company: doc.companyName,
    'Task Name': doc.taskName,
    'PO #': doc.purchaseOrder,
    localPrice: doc.localPrice,
    'Request No': doc.requestNo,
    'Local Amount': bigJsToRoundedNumber(doc.localAmount, 2),
    'Int.Dept': _.get(doc, 'internalDepartment.name', doc.internalDepartmentName),
    abilityId: _.get(doc, 'ability._id', doc.ability),
    requestDescription: doc.requestDescription,
    'Request Delivery Date': doc.requestDeliveryDate,
    internalDepartmentId: _.get(doc, 'internalDepartment._id', ''),
    'GL Revenue Account No': _.get(doc, 'ability.glAccountNo', doc.glAccountNo),
    numberTitleLangCombDescription: doc.numberTitleLangCombDescription,
    accountingDepartmentId: _.get(doc, 'internalDepartment.accountingDepartmentId', doc.accountingDepartmentId),
    'External Accounting Code #': doc.externalAccountingCode,
    workflowId: _.get(doc, 'workflowId'),
    workflowDescription: _.get(doc, 'workflowDescription'),
  };
};

InvoiceSchema.statics.mapCsvRowToEntriesSchemaDefinition = () => ({
  _id: '_id',
  Memo: 'memo',
  Show: 'show',
  Price: 'price',
  taskID: 'taskId',
  Amount: 'amount',
  Quantity: 'quantity',
  requestId: 'requestId',
  Company: 'companyName',
  'Task Name': 'taskName',
  'PO #': 'purchaseOrder',
  localPrice: 'localPrice',
  'Request No': 'requestNo',
  'Local Amount': 'localAmount',
  'Int.Dept': 'internalDepartment.name',
  abilityId: 'ability._id',
  'Request Delivery Date': 'requestDeliveryDate',
  internalDepartmentId: 'internalDepartment._id',
  requestDescription: 'requestDescription',
  'GL Revenue Account No': 'ability.glAccountNo',
  numberTitleLangCombDescription: 'numberTitleLangCombDescription',
  accountingDepartmentId: 'internalDepartment.accountingDepartmentId',
  'External Accounting Code #': 'externalAccountingCode',
  workflowId: 'workflowId',
  workflowDescription: 'workflowDescription',
});

InvoiceSchema.statics.getEntriesExportOptions = () =>
  [
    '_id',
    'taskID',
    'Request No',
    'PO #',
    'Company',
    'GL Revenue Account No',
    'Task Name',
    'Memo',
    'Quantity',
    'Price',
    'Amount',
    'Int.Dept',
    'Show',
    'Request Delivery Date',
    'internalDepartment._id',
    'internalDepartment.accountingDepartmentId',
    'internalDepartment.name',
    'requestId',
    'ability._id',
    'ability.glAccountNo',
    'localPrice',
    'requestDescription',
    'memo',
    'numberTitleLangCombDescription',
    'localPrice',
    'Local Amount',
    'workflowId',
    'workflowDescription',
  ];

InvoiceSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Invoice No',
    'Date',
    'Company ID',
    'Company Name',
    'Status',
    'PO #',
    'Contact Name',
    'Due Date',
    'Invoice Total',
    'Balance',
    'Amount Paid',
    'Invoice post completion progress',
    'Currency',
    'Billing Terms',
    'Contact Email',
    'Billing Address',
    'Description',
    'Sales Rep',
    'Synced',
    'Send',
    'Last Sync Date',
    'Sync Error',
    'Requests',
    'Inactive',
    'Email Template',
    'Exchange Rate',
    'GL Posting Date',
    'Invoice Template',
    'Local Amount',
    'Local Currency',
    'Post out of Period',
    'Created At',
    'Created By',
    'Updated At',
    'Updated By',
    'Deleted At',
    'Deleted By',
    'Restored At',
    'Restored By',
  ],
});

InvoiceSchema.statics.groupInvoicesTotalByCompanies = async function (query, paginationParams) {
  const limit = _.get(paginationParams, 'limit', null);
  const page = _.get(paginationParams, 'page', null);
  const aggregation = [
    { $match: query },
    {
      $lookup: {
        from: 'companies',
        localField: 'company',
        foreignField: '_id',
        as: 'company',
      },
    },
    {
      $unwind: {
        path: '$company',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: { companyId: '$company._id', currency: '$accounting.currency.isoCode' },
        companyHierarchy: { $first: '$company.hierarchy' },
        companyName: { $first: '$company.name' },
        currency: { $first: '$accounting.currency.isoCode' },
        totalInvoices: { $sum: '$accounting.amount' },
        totalPaidInvoices: { $sum: '$accounting.paid' },
        totalPartiallyPaidInvoices: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Partially Paid'] }, '$accounting.paid', 0,
            ],
          },
        },
      },
    },
    {
      $addFields: {
        totalBalance: {
          $subtract: ['$totalInvoices', '$totalPaidInvoices'] },
      },
    },
    {
      $project: {
        companyHierarchy: '$companyHierarchy',
        companyName: '$companyName',
        currency: '$currency',
        totalInvoices: {
          $toString: {
            $round: ['$totalInvoices', 2],
          },
        },
        totalPaidInvoices: {
          $toString: {
            $round: ['$totalPaidInvoices', 2],
          },
        },
        totalPartiallyPaidInvoices: {
          $toString: {
            $round: ['$totalPartiallyPaidInvoices', 2],
          },
        },
        totalBalance: {
          $toString: {
            $round: ['$totalBalance', 2],
          },
        },
      },
    },
  ];
  const countAggregation = _.cloneDeep(aggregation);
  if (_.isNumber(page) && page > 0 && _.isNumber(limit) && limit > 0) {
    aggregation.push({ $skip: (page - 1) * limit });
    aggregation.push({ $limit: limit });
  }
  countAggregation.push({ $count: 'total' });
  const result = await this.aggregate([
    {
      $facet: {
        list: aggregation,
        total: countAggregation,
      },
    },
  ]);
  const list = _.get(result, '0.list', []);
  const total = _.get(result, '0.total.0.total', 0);
  return { list, total };
};

InvoiceSchema.statics.setNo = function (invoice, session) {
  if (!_.isNil(invoice.no)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const Counter = mongoose.models.Counter;
    const LspModel = mongoose.models.Lsp;
    Counter.nextEntityNumber({ lspId: invoice.lspId, key: 'invoiceNo', session }, (err, model) => {
      if (_.isNil(err)) {
        LspModel.findOne({ _id: invoice.lspId }).then((lsp) => {
          invoice.no = `${lsp.financialEntityPrefix}I${model.date}-${model.seq}`;
          resolve(invoice.validate());
        });
      } else {
        reject(err);
      }
    });
  });
};

InvoiceSchema.statics.ensureNotProcessedEntries = async function (importedEntriesIdList) {
  const foundInvoice = await this.findOne({ 'entries._id': { $in: importedEntriesIdList } }, { _id: 1 });
  if (foundInvoice) {
    throw new Error('Failed to create invoice from the uploaded file. The uploaded entries are already part of an existing Invoice. No entries were processed.');
  }
};

InvoiceSchema.statics.isValidCsvImportedEntry = (csvRow) => {
  const csvRequiredFields = [
    '_id',
    'Memo',
    'Show',
    'Price',
    'taskID',
    'Amount',
    'Quantity',
    'requestId',
    'Company',
    'Task Name',
    'localPrice',
    'Request No',
    'Local Amount',
    'abilityId',
    'workflowId',
    'Request Delivery Date',
    'internalDepartmentId',
    'GL Revenue Account No',
    'numberTitleLangCombDescription',
    'accountingDepartmentId',
  ];
  return csvRequiredFields.every(fieldName => _.has(csvRow, fieldName) &&
    _.get(csvRow, fieldName, '') !== '');
};

InvoiceSchema.plugin(mongooseDelete, { overrideMethods: true });
InvoiceSchema.plugin(transactionHelper);
InvoiceSchema.plugin(metadata);
InvoiceSchema.plugin(modified);
InvoiceSchema.plugin(lspData);
InvoiceSchema.plugin(lmsGrid.aggregation());
InvoiceSchema.plugin(siConnectorPlugin);
InvoiceSchema.plugin(attachmentsPlugin);
InvoiceSchema.plugin(importModulePlugin);
InvoiceSchema.plugin(arEntityPlugin);
InvoiceSchema.index({ lspId: 1, no: 1 }, { unique: true });
InvoiceSchema.index({ _id: 1, 'entries._id': 1 }, { unique: true });

InvoiceSchema.methods.setAmountInLocal = function () {
  const { accounting } = this;
  const isLocalCurrency = accounting.currency.isoCode === accounting.localCurrency.isoCode;
  if (!isLocalCurrency) {
    if (!_.isEmpty(this.entries)) {
      accounting.amountInLocal = this.entries
        .reduce((acc, en) => acc.plus(en.localAmount), new Big(0));
    } else {
      accounting.amountInLocal = 0;
    }
  } else {
    accounting.amountInLocal = accounting.amount;
  }
};

InvoiceSchema.methods.setBalance = function () {
  const { accounting } = this;
  const paid = _.defaultTo(accounting.paid, 0);
  const paidInLocal = _.defaultTo(accounting.paidInLocal, 0);
  accounting.balance = new Big(accounting.amount).minus(paid).toFixed(2);
  if (accounting.balance === 0) {
    accounting.balanceInLocal = 0;
  } else {
    accounting.balanceInLocal = new Big(accounting.amountInLocal).minus(paidInLocal).toFixed(2);
  }
};

module.exports = InvoiceSchema;
