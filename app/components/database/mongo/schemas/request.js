const mongoose = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const bigjs = require('big.js');
const moment = require('moment');
const mongooseDelete = require('mongoose-delete');
const { stripHtml } = require('string-strip-html');
const humanInterval = require('human-interval');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const transactionHelper = require('../plugins/transaction-helper');
const { RestError } = require('../../../api-response');
const { validObjectId, transformDecimal128Fields, convertToObjectId } = require('../../../../utils/schema');
const { sanitizeHTML } = require('../../../../utils/security/html-sanitize');
const { joinObjectsByProperty } = require('../../../../utils/arrays');
const {
  sum, div, minus, multiply, ensureNumber, bigJsToNumber, decimal128ToNumber, toBigJs,
} = require('../../../../utils/bigjs');
const { getRequestDocuments } = require('../../../../endpoints/lsp/request/request-api-helper');
const IpPatentSchema = require('./ip-patent');
const importModulePlugin = require('../plugins/import-module');
const { getRequestInvoiceStatus } = require('../../../../endpoints/lsp/ar-invoice/ar-invoice-helper');
const { buildISODateQuery } = require('../query/date');
const { WorkflowSchema, RequestLanguageSchema } = require('./subschemas/workflow.js');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const HUMAN_READABLE_STATUSES = {
  toBeTreated: 'To be processed',
  approved: 'In progress',
  cancelled: 'Cancelled',
  delivered: 'Completed',
  quotationRequired: 'On Hold',
  waitingForApproval: 'Waiting for approval',
  waitingForClientPo: 'Waiting for Client PO',
  waitingForQuote: 'Waiting for Quote',
};
const PROVIDER_TASK_STATUS_CANCELLED = 'cancelled';
const MAX_COMMENT_LENGTH = 5000;
const REQUEST_EXPORT_FIELDS = [
  'Request No.',
  'Reference Number',
  'Contact',
  'Contact Email',
  'Company',
  'Company Hierarchy',
  'Title',
  'Competence Levels',
  'Project Managers',
  'Reception date',
  'Delivery Date',
  'Request Status',
  'Status',
  'Overdue',
  'Final Documents',
  'Created by',
  'Created at',
  'Updated by',
  'Updated at',
  'Inactive',
  'Restored by',
  'Restored at',
  'Cancelled',
  'Completed',
  'Partners',
  'Quote Target Date & Time',
  'Quote Expected Close Date',
  'Quote Approval Date',
  'Assignment Status',
  'Late',
  'Rush',
  'Complaint/Nonconformance',
  'PO required',
  'Department Notes',
  'Scheduling Status',
  'Memo',
  'Scheduling Company',
  'Scheduling Contact',
  'Invoice total',
  'Projected cost total',
  'Foreign Bill total',
  'Actual Billable Cost Total',
  'Language Combinations',
  'Patent App.Num',
  'Patent Pub.Num',
  'Request Type',
  'Actual GP %',
  'Also Deliver To',
  'Cancelled at',
  'Completed at',
  'Expected Duration',
  'ID',
  'Insurance Company',
  'Invoice Total',
  'Invoice to Company',
  'Invoice to Contact',
  'LSP Internal Department',
  'Location of the Request',
  'Number of Attendees',
  'Number of Rooms',
  'Opportunity No.',
  'Other CC',
  'PO',
  'Projected GP',
  'Projected Total Cost',
  'Quote required',
  'Recipient',
  'Request Actual End',
  'Request Actual Start',
  'Request Expected Start',
  'Request Invoice Status',
  'Source Documents',
  'Turnaround time notes',
  'Delivered at',
];
const CONTACT_EXPORT_FIELDS = [
  'ID',
  'Request No.',
  'Contact',
  'Contact Email',
  'Instructions and Comments',
  'Language Combinations',
  'Source Documents',
  'Company',
  'Company Hierarchy',
  'Quote required',
  'Title',
  'Other CC',
  'Project Managers',
  'Request Type',
  'PO',
  'PO required',
  'Also Deliver To',
  'Delivery Date',
  'Quote Target Date & Time',
  'Quote Expected Close Date',
  'Quote Approval Date',
  'Turnaround time notes',
  'Request Status',
  'Final Documents',
  'Completed at',
  'Request Invoice Status',
  'Overdue',
  'Created at',
  'Updated at',
  'Deleted at',
  'Restored at',
  'Created by',
  'Updated by',
  'Deleted by',
  'Restored by',
];

const RequestDocumentSchema = new Schema({
  name: String,
  isReference: {
    type: Boolean,
    default: false,
  },
  isInternal: {
    type: Boolean,
    default: false,
  },
  isTranslated: {
    type: Boolean,
    default: null,
  },
  OCRStatus: {
    type: String,
    enum: ['not_sent', 'processing', 'processing_complete'],
    default: 'not_sent',
  },
  OCROperationCode: String,
  OCRCloudKey: String,
  OCRFinishedAt: Date,
  mime: String,
  encoding: String,
  size: Number,
  url: String,
  importSuccess: {
    type: Boolean,
    default: false,
  },
  importInfo: {
    lastModified: String,
    md5: String,
    size: String,
    key: String,
  },
  final: {
    type: Boolean,
    default: false,
  },
  // only used in final files
  completed: {
    type: Boolean,
    default: false,
  },
  translation: {
    type: ObjectId,
    ref: 'BasicCatToolTranslation',
  },
  deletedByRetentionPolicyAt: {
    type: Date,
    default: null,
  },
  user: ObjectId,
  createdBy: String,
  ip: String,
  md5Hash: {
    type: String,
    default: 'pending',
  },
  cloudKey: String,
  isPortalCat: {
    type: Boolean,
    default: false,
  },
  isRemovedFromPortalCat: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const RequestFinalDocumentSchema = new Schema({
  name: String,
  isReference: {
    type: Boolean,
    default: false,
  },
  isInternal: {
    type: Boolean,
    default: false,
  },
  mime: String,
  encoding: String,
  size: Number,
  url: String,
  final: {
    type: Boolean,
    default: false,
  },
  translation: {
    type: ObjectId,
    ref: 'BasicCatToolTranslation',
  },
  deletedByRetentionPolicyAt: {
    type: Date,
    default: null,
  },
  user: ObjectId,
  createdBy: String,
  ip: String,
  md5Hash: {
    type: String,
    default: 'pending',
  },
  cloudKey: String,
}, { timestamps: true });

const LanguageCombinationSchema = new Schema({
  srcLangs: [RequestLanguageSchema],
  tgtLangs: [RequestLanguageSchema],
  documents: [RequestDocumentSchema],
  languagesKey: String,
});

const BillSchema = new Schema({
  _id: { type: ObjectId, ref: 'Bill' },
  no: { type: String },
});

const MtSettingsLanguageCombination = new Schema({
  srcLang: {
    type: String,
    required: true,
  },
  tgtLang: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  mtEngine: {
    type: ObjectId,
    ref: 'MtEngine',
    required: true,
  },
  isPortalMt: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const RequestSchema = new Schema({
  no: {
    type: String,
  },
  sourceDocumentsList: {
    type: String,
    default: '',
  },
  opportunityNo: {
    type: String,
    set: (value) => value || null,
  },
  title: {
    type: String,
  },
  departmentNotes: {
    type: String,
  },
  isMocked: {
    type: Boolean,
    default: false,
  },
  late: {
    type: Boolean,
    default: false,
  },
  rush: {
    type: Boolean,
    default: false,
  },
  complaint: {
    type: Boolean,
    default: false,
  },
  repSignOff: {
    type: Boolean,
    default: false,
  },
  serviceDeliveryTypeRequired: {
    type: Boolean,
    default: false,
  },
  documentTypes: {
    type: [{
      _id: ObjectId,
      name: String,
    }],
    default: [],
  },
  assignmentStatus: {
    type: {
      _id: {
        type: Schema.ObjectId,
        validate: {
          validator(_id) {
            if (!_.isNil(_id) && _id !== '') {
              const lspId = _.get(this, 'lspId');

              if (!validObjectId(_id)) {
                throw new Error(`Invalid ObjectId ${_id} for assignment status entity`);
              }
              if (lspId) {
                return mongoose.models.AssignmentStatus.findOne({ _id, lspId })
                  .then((found) => found !== null);
              }
            }
            return true;
          },
          message: (props) => `${props.value} is not a valid assignment status!`,
        },
      },
      name: String,
    },
    set: (value) => value || null,
  },
  deliveryMethod: {
    type: {
      _id: {
        type: Schema.ObjectId,
        validate: {
          validator(_id) {
            if (!_.isNil(_id) && _id !== '') {
              const lspId = _.get(this, 'lspId');

              if (!validObjectId(_id)) {
                throw new Error(`Invalid ObjectId ${_id} for delivery method entity`);
              }
              if (lspId) {
                return mongoose.models.DeliveryMethod.findOne({ _id, lspId })
                  .then((found) => found !== null);
              }
            }
            return true;
          },
          message: (props) => `${props.value} is not a valid delivery method!`,
        },
      },
      name: String,
    },
    set: (value) => value || null,
  },
  softwareRequirements: {
    type: [{
      _id: ObjectId,
      name: String,
    }],
    default: [],
  },
  competenceLevels: {
    type: [{
      _id: {
        type: ObjectId,
        ref: 'CompetenceLevel',
      },
      name: String,
    }],
    default: [],
  },
  purchaseOrder: {
    type: String,
  },
  poRequired: {
    type: Boolean,
    default: false,
  },
  localCurrency: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Currency',
    },
    name: String,
    isoCode: String,
  },
  timeToDeliver: String,
  hasTimeToDeliverOptions: {
    type: Boolean,
    default: false,
  },
  quoteCurrency: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Currency',
    },
    name: String,
    isoCode: String,
    symbol: {
      type: String,
      default: '',
    },
  },
  languageCombinationsText: String,
  languageCombinations: {
    type: [LanguageCombinationSchema],
  },
  status: {
    type: String,
    enum: [
      'On Hold',
      'To be processed',
      'In progress',
      'Completed',
      'Cancelled',
      'Waiting for approval',
      'Waiting for Client PO',
      'Waiting for Quote',
      'Delivered',
    ],
    default: 'To be processed',
  },
  receptionDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  deliveryDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  quoteTemplateId: {
    _id: { type: Schema.ObjectId, ref: 'Template' },
  },
  emailTemplateId: {
    _id: { type: Schema.ObjectId, ref: 'Template' },
  },
  quoteCustomFields: { type: Object, required: false },
  emailCustomFields: { type: Object, required: false },
  serviceTypeId: { type: Schema.ObjectId, ref: 'ServiceType', required: false },
  deliveryTypeId: { type: Schema.ObjectId, ref: 'DeliveryType', required: false },
  quoteHiddenFields: [{ type: String }],
  quoteDueDate: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
  },
  expectedQuoteCloseDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  quoteApprovalDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  expectedStartDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  actualStartDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  actualDeliveryDate: {
    type: Date,
    set: (value) => (_.isNil(value) || value === '' ? null : moment.utc(value).toDate()),
  },
  isQuoteApproved: {
    type: Boolean,
    default: false,
  },
  internalDepartment: {
    _id: { type: Schema.ObjectId, ref: 'InternalDepartment' },
    name: {
      type: String,
      set: (value) => (_.isUndefined(value) ? null : value),
    },
  },
  partners: {
    type: [{
      _id: { type: Schema.ObjectId, ref: 'Company' },
      name: String,
    }],
    default: [],
  },
  insuranceCompany: {
    _id: { type: Schema.ObjectId, ref: 'Company' },
    name: String,
    hierarchy: String,
  },
  memo: String,
  adjuster: String,
  referenceNumber: String,
  recipient: String,
  rooms: Number,
  atendees: Number,
  exchangeRate: {
    type: Number,
    default: 0,
  },
  invoiceTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  foreignInvoiceTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  billTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  foreignBillTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  billGp: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  projectedCostTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  projectedCostGp: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  foreignProjectedCostTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  expectedDurationTime: Number,
  comments: {
    type: String,
    required: true,
    validate(val) {
      const rawComments = stripHtml(val).result;
      return rawComments.length <= MAX_COMMENT_LENGTH;
    },
  },
  turnaroundTime: {
    type: String,
  },
  internalComments: {
    type: String,
    default: '',
    validate(val) {
      if (_.isEmpty(val)) {
        return true;
      }
      const rawComments = stripHtml(val).result;
      return rawComments.length <= MAX_COMMENT_LENGTH;
    },
  },
  company: {
    _id: {
      type: ObjectId,
      ref: 'Company',
    },
    name: String,
    quoteCurrency: ObjectId,
    hierarchy: String,
    cidr: [],
    status: String,
    allowCopyPasteInPortalCat: {
      type: Boolean,
      default: true,
    },
    internalDepartments: {
      type: [{
        _id: {
          type: ObjectId,
          ref: 'InternalDepartment',
        },
        name: String,
      }],
      default: [],
    },
    mtSettings: {
      useMt: {
        type: Boolean,
        default: false,
      },
      languageCombinations: [MtSettingsLanguageCombination],
    },
    pcSettings: {
      mtThreshold: {
        type: Number,
        min: 0,
        max: 100,
      },
      lockedSegments: {
        includeInClientStatistics: {
          type: Boolean,
          default: false,
        },
        includeInProviderStatistics: {
          type: Boolean,
          default: true,
        },
        segmentsToLock: [{ type: ObjectId, ref: 'Breakdown' }],
        newConfirmedBy: String,
      },
    },
  },
  contact: {
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    company: {
      type: ObjectId,
      ref: 'Company',
    },
    email: String,
    firstName: String,
    middleName: String,
    deleted: Boolean,
    terminated: Boolean,
    lastName: String,
    projectManagers: {
      type: [{
        type: ObjectId,
        ref: 'User',
      }],
      default: [],
    },
    inactiveNotifications: { type: [String], default: [] },
  },
  otherContact: {
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    email: String,
    firstName: String,
    middleName: String,
    lastName: String,
    deleted: Boolean,
    terminated: Boolean,
  },
  otherCC: [String],
  schedulingCompany: {
    _id: {
      type: ObjectId,
      ref: 'Company',
    },
    name: String,
    hierarchy: String,
  },
  schedulingContact: {
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    email: String,
    firstName: String,
    middleName: String,
    lastName: String,
    deleted: Boolean,
    terminated: Boolean,
  },
  salesRep: {
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    firstName: String,
    lastName: String,
    deleted: Boolean,
    terminated: Boolean,
  },
  requestType: {
    _id: {
      type: ObjectId,
      ref: 'RequestType',
    },
    name: String,
  },
  dataClassification: {
    type: String,
    enum: ['Public', 'Confidential', 'Restricted'],
    default: 'Public',
  },
  workflowType: {
    type: String,
    enum: ['Standard', 'Auto Scan PDF to MT Text'],
    default: 'Standard',
  },
  isAutoTranslateSchedulerRunning: {
    type: Boolean,
    default: false,
  },
  schedulingStatus: {
    _id: {
      type: ObjectId,
      ref: 'SchedulingStatus',
    },
    name: String,
  },
  location: {
    _id: {
      type: ObjectId,
      ref: 'Location',
    },
    name: String,
    address: String,
    suite: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String,
  },
  finalDocuments: [RequestFinalDocumentSchema],
  bucketPrefixes: [String],
  requireQuotation: {
    type: Boolean,
    default: false,
  },
  projectManagers: [{
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    email: String,
    firstName: String,
    middleName: String,
    lastName: String,
    deleted: Boolean,
    terminated: Boolean,
  }],
  catTool: {
    type: String,
  },
  requestInvoiceStatus: {
    type: String,
    enum: ['Not Invoiced', 'Partially Invoiced', 'Invoiced', 'Cancelled'],
    default: 'Not Invoiced',
  },
  invoiceCompany: {
    _id: { type: Schema.ObjectId, ref: 'Company' },
    name: String,
    hierarchy: String,
  },
  invoiceContact: {
    _id: { type: ObjectId, ref: 'User' },
    email: String,
    firstName: String,
    lastName: String,
  },
  ipPatent: IpPatentSchema,
  completedAt: Date,
  cancelledAt: Date,
  deliveredAt: {
    type: Date,
    default: null,
  },
  workflowTemplate: String,
  workflows: [WorkflowSchema],
  bills: [BillSchema],
  mockPm: {
    type: Boolean,
    default: false,
  },
  externalAccountingCode: {
    _id: {
      type: Schema.ObjectId,
      ref: 'CompanyExternalAccountingCode',
    },
    name: String,
  },
  customStringFields: {
    type: [{
      value: String,
    }],
    validate: {
      validator(customFields) {
        return customFields.length <= 5;
      },
      message: 'Number of custom fields can not be more than 5',
    },
    default: [],
  },
  pcSettings: {
    statisticsGenerated: {
      type: Boolean,
      default: false,
    },
    lockedSegments: {
      includeInClientStatistics: {
        type: Boolean,
        default: false,
      },
      includeInProviderStatistics: {
        type: Boolean,
        default: true,
      },
    },
  },

}, {
  collection: 'requests',
  timestamps: true,
});

const PROVIDER_TASK_HUMAN_READABLE_STATUSES = {
  notStarted: 'Not Started',
  onHold: 'On Hold',
  inProgress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  approved: 'Approved',
};

RequestSchema.statics.areValidLanguageCombinations = (languageCombinations) => {
  if (_.isEmpty(languageCombinations) || _.isNil(languageCombinations)) {
    return false;
  }
  return languageCombinations
    .every((languageCombination) => !_.isEmpty(languageCombination.srcLangs)
      && !_.isEmpty(languageCombination.tgtLangs));
};

RequestSchema.statics
  .getProviderTaskHumanReadableStatuses = () => ({ ...PROVIDER_TASK_HUMAN_READABLE_STATUSES });

RequestSchema.statics.getHumanReadableStatuses = () => ({ ...HUMAN_READABLE_STATUSES });

RequestSchema.statics.getContactExportOptions = () => ({
  headers: CONTACT_EXPORT_FIELDS,
});

RequestSchema.statics.getContactExportOptions = () => ({
  headers: CONTACT_EXPORT_FIELDS,
});

RequestSchema.statics.getExportOptions = () => ({
  headers: REQUEST_EXPORT_FIELDS,
});

RequestSchema.statics.getWorkflowsMinInfo = (request) => _.get(request, 'workflows', []).map((w) => _.pick(w, [
  '_id',
  'srcLang',
  'documents',
  'tgtLang',
  'workflowDueDate',
  'subtotal',
  'description',
  'discount',
  'useMt',
  'subtotal']));

RequestSchema.statics.updateLanguageCombination = async function (params) {
  const {
    newDocument, lspId, requestId: _id, languageCombinationId,
  } = params;
  const query = { _id, lspId };
  const update = {
    $pull: {
      'languageCombinations.$[languageCombination].documents': { name: newDocument.name },
    },
    $addToSet: {
      'languageCombinations.$[languageCombination].documents': newDocument,
    },
  };
  const options = {
    arrayFilters: [{
      'languageCombination._id': new mongoose.Types.ObjectId(languageCombinationId),
    }],
  };
  const deletedDocumentQuery = _.omit(update, ['$addToSet']);
  const addDocumentQuery = _.omit(update, ['$pull']);

  await Promise.mapSeries(
    [deletedDocumentQuery, addDocumentQuery],
    (operation) => this.findOneAndUpdate(query, operation, options),
  );
};

RequestSchema.statics.updateCompetenceLevels = function (competenceLevel, session) {
  const query = this.updateMany(
    { 'competenceLevels._id': competenceLevel._id },
    { $set: { 'competenceLevels.$[competenceLevel].name': competenceLevel.name } },
    {
      upsert: false,
      timestamps: false,
      arrayFilters: [{ 'competenceLevel._id': competenceLevel._id }],
    },
  );
  if (!_.isNil(session)) {
    return query.session(session);
  }
  return query;
};

RequestSchema.statics.getLanguageKpi = async function (
  srcLanguage,
  trtLanguage,
  lspId,
  datePeriod,
  utcOffsetInMinutes,
  query = {},
  paginationParams = {},
) {
  const limit = _.get(paginationParams, 'limit', null);
  const page = _.get(paginationParams, 'page', null);
  const isoDatePeriod = buildISODateQuery(datePeriod, utcOffsetInMinutes);
  const requestQuery = {
    ...query,
    lspId: convertToObjectId(lspId),
    workflows: {
      $elemMatch: {
        'srcLang.isoCode': srcLanguage,
        'tgtLang.isoCode': trtLanguage,
        createdAt: isoDatePeriod,
      },
    },
  };
  const aggregateDateQuery = [];
  if (isoDatePeriod.$lte) {
    aggregateDateQuery.push({ $lte: ['$$workflow.createdAt', isoDatePeriod.$lte] });
  }
  if (isoDatePeriod.$gte) {
    aggregateDateQuery.push({ $gte: ['$$workflow.createdAt', isoDatePeriod.$gte] });
  }
  const aggregation = [
    { $match: requestQuery },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        requestNo: '$no',
        createdAt: '$createdAt',
        companyHierarchy: '$company.hierarchy',
        companyName: '$company.name',
        projectManagers: '$projectManagers',
        currency: '$quoteCurrency.isoCode',
        workflows: {
          $filter: {
            input: '$workflows',
            as: 'workflow',
            cond: {
              $and: [
                { $eq: ['$$workflow.srcLang.isoCode', srcLanguage] },
                { $eq: ['$$workflow.tgtLang.isoCode', trtLanguage] },
                ...aggregateDateQuery,
              ],
            },
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
  const requests = list.map((request) => ({
    requestNo: request.requestNo,
    createdAt: request.createdAt,
    companyHierarchy: request.companyHierarchy,
    companyName: request.companyName,
    projectManagers: request.projectManagers,
    requestInvoiceStatus: getRequestInvoiceStatus(request),
    currency: request.currency,
    totalAmountSpentPerLang: request.workflows.reduce(
      (agg, workflow) => sum(decimal128ToNumber(workflow.foreignSubtotal), agg),
      0,
    ).toFixed(2),
  }));
  return { list: requests, total };
};

// Part of the basic check
RequestSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
RequestSchema.set('toJSON', { virtuals: true });

RequestSchema.plugin(mongooseDelete, { overrideMethods: 'all' });
RequestSchema.plugin(metadata);
RequestSchema.plugin(modified);
RequestSchema.plugin(lspData);
RequestSchema.plugin(transactionHelper);
RequestSchema.plugin(importModulePlugin);
RequestDocumentSchema.plugin(mongooseDelete, { overrideMethods: 'all' });

RequestSchema.index({ lspId: 1, no: 1 }, { unique: true });

RequestSchema.path('catTool').validate({
  async: true,
  validator(catTool) {
    if (_.isEmpty(catTool)) {
      return true;
    }
    return mongoose.models.CatTool.findOne({ name: catTool, lspId: this.lspId })
      .then((dbCatTool) => !_.isNil(dbCatTool));
  },
  message: 'Cat tool {VALUE} was not found in the database',
});

RequestSchema.path('softwareRequirements').validate({
  async: true,
  validator(softwareRequirements) {
    if (_.isEmpty(softwareRequirements)) {
      const lspId = _.get(this, 'lspId');
      const ids = softwareRequirements.map((s) => new mongoose.Types.ObjectId(s._id));
      return mongoose.models.SoftwareRequirement.find({ _id: { $in: ids }, lspId })
        .then((recordsFound) => recordsFound.length === softwareRequirements.length);
    }
    return true;
  },
  message: 'Software requirement {VALUE} was not found in the database',
});

RequestSchema.path('documentTypes').validate({
  async: true,
  validator(documentTypes) {
    if (_.isEmpty(documentTypes)) {
      const lspId = _.get(this, 'lspId');
      const ids = documentTypes.map((s) => new mongoose.Types.ObjectId(s._id));
      return mongoose.models.DocumentType.find({ _id: { $in: ids }, lspId })
        .then((recordsFound) => recordsFound.length === documentTypes.length);
    }
    return true;
  },
  message: 'Document type {VALUE} was not found in the database',
});

RequestSchema.pre('save', function (next) {
  if (this.isModified('status') || this.isNew) {
    switch (this.status) {
      case 'Completed':
        this.cancelledAt = undefined;
        this.completedAt = moment.utc().toDate();
        break;
      case 'Cancelled':
        this.completedAt = undefined;
        this.cancelledAt = moment.utc().toDate();
        break;
      default:
        this.cancelledAt = undefined;
        this.completedAt = undefined;
        break;
    }
    if (this.status === 'Delivered' && _.isNil(this.deliveredAt)) {
      this.deliveredAt = moment.utc().toDate();
    }
  }
  if (this.poRequired && _.isEmpty(this.purchaseOrder)) {
    throw new RestError(400, { message: 'PO field is mandatory' });
  }
  if (_.get(this.languageCombinations, 'length', 0) > 0) {
    let languageCombinationsText = '';

    _.each(this.languageCombinations, (l) => {
      languageCombinationsText += `${joinObjectsByProperty(l.srcLangs, 'name')} - ${joinObjectsByProperty(l.tgtLangs, 'name')};`;
      l.languagesKey = `${joinObjectsByProperty(l.srcLangs, 'isoCode')}-${joinObjectsByProperty(l.tgtLangs, 'isoCode')}`;
    });
    this.languageCombinationsText = languageCombinationsText;
    const sourceDocumentList = getRequestDocuments(this.languageCombinations);

    if (!_.isEmpty(sourceDocumentList)) {
      this.sourceDocumentsList = sourceDocumentList.map((d) => d.name).join(', ');
    }
  }
  next();
});

RequestSchema.methods.updateWorkflowTasksApprovedCancelledStatus = function (serverTime, approvedBy) {
  if (_.isNil(this.workflows) || !this.isModified('workflows') || this.workflows.length === 0) {
    return;
  }
  this.workflows.forEach((w, i) => {
    if (w.tasks && w.tasks.length > 0) {
      w.tasks.forEach((t, j) => {
        if (t.providerTasks && t.providerTasks.length > 0) {
          t.providerTasks.forEach((pt, k) => {
            if (this.isModified(`workflows.${i}.tasks.${j}.providerTasks.${k}.status`)) {
              if (pt.status === 'cancelled' && _.isNil(pt.cancelledAt)) {
                // if task was recently cancelled, set the cancelledAt date.
                this.workflows[i].tasks[j].providerTasks[k].cancelledAt = serverTime;
              } else if (pt.status === 'approved' && _.isNil(pt.approvedAt)) {
                this.workflows[i].tasks[j].providerTasks[k].approvedAt = serverTime;
                this.workflows[i].tasks[j].providerTasks[k].approvedBy = approvedBy;
              } else if (pt.status !== 'cancelled') {
                // if task is not canceled
                // ensure that cancelledAt property is setted as undefined.
                this.workflows[i].tasks[j].providerTasks[k].cancelledAt = undefined;
              }
            }
          });
        }
      });
    }
  });
};

RequestSchema.pre('save', function (next) {
  const { Counter } = mongoose.models;
  const self = this;

  // Set number only if it's a new request
  if (this.no) {
    next();
  } else {
    Counter.nextRequestNumber(self.lspId, (err, model) => {
      if (!err) {
        self.no = `R${model.date}-${model.seq}`;
        next();
      } else {
        next(err);
      }
    });
  }
});

RequestSchema.pre('save', async function () {
  if (this.competenceLevels && this.competenceLevels.length && this.isModified('competenceLevels')) {
    const _ids = this.competenceLevels.map((cl) => _.get(cl, '_id', cl));
    const allCompetenceLevels = await this.model('CompetenceLevel').findWithDeleted({
      _id: { $in: _ids },
      lspId: this.lspId,
    });
    if (allCompetenceLevels.length !== this.competenceLevels.length && _.isNil(this.mockPm)) {
      throw new RestError(422, { message: 'Some competence levels do not exist' });
    }
  }
});

RequestSchema.pre('save', function (next) {
  if (this.comments && this.isModified('comments')) {
    this.comments = sanitizeHTML(this.comments);
  }
  next();
});

// Create bucket prefix
RequestSchema.pre('save', function (next) {
  const doc = this;

  if (doc.isModified('company')) {
    const newPrefix = `${doc.lspId}/request_files/${doc.company}/${doc._id}/`;

    if (doc.bucketPrefixes.indexOf(newPrefix) === -1) {
      doc.bucketPrefixes.push(newPrefix);
      doc.markModified('bucketPrefixes');
    }
  }
  next();
});

RequestSchema.statics.getExchangeRate = async (request) => {
  if (_.isNil(_.get(request, 'quoteCurrency._id'))) {
    return 1;
  }
  const lsp = await mongoose.models.Lsp.findOne({
    _id: request.lspId,
  }, { currencyExchangeDetails: 1 });
  const usdCurrency = lsp.currencyExchangeDetails.find((e, index) => e.base.toString() === e.quote.toString()
    && e.quotation === 1 && index === 0);
  const exchangeRate = lsp.currencyExchangeDetails.find((e) => e.base.toString() === usdCurrency.base.toString()
    && e.quote.toString() === request.quoteCurrency.toString());
  return _.get(exchangeRate, 'quotation', 1);
};

RequestSchema.statics.updateWorkflowTotals = async (request) => {
  try {
    const workflows = _.get(request, 'workflows', []);
    const lspExchangeRate = await RequestSchema.statics.getExchangeRate(request);

    if (_.isEmpty(workflows) || workflows.length === 0) {
      request.exchangeRate = lspExchangeRate;
      return request;
    }
    const isForeignCurrencyRequest = _.get(request, 'localCurrency.isoCode') !== _.get(request, 'quoteCurrency.isoCode');
    let { exchangeRate } = request;

    if (exchangeRate === 0 || _.isNil(exchangeRate)) {
      exchangeRate = lspExchangeRate;
      request.exchangeRate = exchangeRate;
    }
    if (!request.isModified('workflows') && !request.isModified('internalDepartment')) {
      return request;
    }
    let projectedCostTotal = 0;
    let invoiceTotal = 0;
    let billTotal = 0;
    let projectedCostGp = 0;
    // Request foreign total
    let foreignInvoiceTotal = 0;
    Object.assign(request, {
      invoiceTotal: 0,
      foreignInvoiceTotal: 0,
      projectedCostTotal: 0,
      foreignProjectedCostTotal: 0,
      billTotal: 0,
    });
    await Promise.map(workflows, async (workflow) => {
      let workflowSubtotal = 0;
      let workflowForeignSubtotal = 0;

      await Promise.map(workflow.tasks, async (task) => {
        const invoiceDetails = _.get(task, 'invoiceDetails', []);
        let invoiceRowTotal = 0;
        let invoiceRowForeignTotal = 0;
        const isTaskCancelled = _.lowerCase(task.status) === PROVIDER_TASK_STATUS_CANCELLED;

        if (isTaskCancelled) {
          task.minCharge = 0;
        }
        if (task.minCharge > 0) {
          task.minCharge = toBigJs(task.minCharge);
          if (ensureNumber(task.foreignMinCharge) === 0 || isForeignCurrencyRequest) {
            task.foreignMinCharge = multiply(task.minCharge, exchangeRate, { precision: 2 });
          }
          if (!isForeignCurrencyRequest) {
            task.foreignMinCharge = task.minCharge;
          }
        } else {
          task.minCharge = 0;
          task.foreignMinCharge = 0;
        }
        await Promise.map(invoiceDetails, async (invoiceDetailObj) => {
          const invoiceDetail = _.isFunction(invoiceDetailObj.toJSON)
            ? invoiceDetailObj.toJSON()
            : invoiceDetailObj;
          const quantity = toBigJs(_.get(invoiceDetail, 'invoice.quantity', 0));
          const unitPrice = toBigJs(_.get(invoiceDetail, 'invoice.unitPrice', 0));
          let foreignUnitPrice = toBigJs(_.get(invoiceDetail, 'invoice.foreignUnitPrice', 0));

          if (isForeignCurrencyRequest) {
            _.set(invoiceDetailObj, 'invoice.unitPrice', div(foreignUnitPrice, exchangeRate, { precision: 10 }));
          } else {
            foreignUnitPrice = unitPrice;
          }
          invoiceDetailObj.invoice.foreignUnitPrice = ensureNumber(foreignUnitPrice);
          const reverseExchangeRate = div(1, exchangeRate, { precision: 10 });
          const foreignTotal = isTaskCancelled
            ? toBigJs(0)
            : toBigJs(multiply(foreignUnitPrice, quantity, { precision: 10 }));
          const total = toBigJs(multiply(foreignTotal, reverseExchangeRate, { precision: 10 }));

          invoiceRowTotal = sum(total, invoiceRowTotal, { precision: 2 });
          invoiceRowForeignTotal = sum(foreignTotal, invoiceRowForeignTotal, { precision: 2 });
          if (!isForeignCurrencyRequest) {
            invoiceRowForeignTotal = invoiceRowTotal;
          }
          invoiceDetailObj.invoice.total = total.round(2);
          invoiceDetailObj.invoice.foreignTotal = foreignTotal.round(2);
          if (!isForeignCurrencyRequest) {
            invoiceDetailObj.invoice.foreignTotal = invoiceDetailObj.invoice.total;
          }
          const projectedCostQuantity = toBigJs(_.get(invoiceDetail, 'projectedCost.quantity', 0));
          const sourceLanguage = _.get(workflow, 'srcLang.name');
          const targetLanguage = _.get(workflow, 'tgtLang.name');

          if (projectedCostQuantity > 0) {
            const projectedCostFilters = {
              lspId: request.lspId,
              ability: task.ability,
              breakdown: _.get(invoiceDetail, 'projectedCost.breakdown._id', ''),
              translationUnit: _.get(invoiceDetail, 'projectedCost.translationUnit._id', ''),
              internalDepartment: _.get(request, 'internalDepartment._id'),
              sourceLanguage,
              targetLanguage,
            };
            const projectedCostAvgPrice = await mongoose.models.User.getVendorRateAverage(
              projectedCostFilters,
            );
            const projectedCostUnitPrice = projectedCostAvgPrice[0]?.avgPrice ?? 0;

            invoiceDetail.projectedCost.unitPrice = toBigJs(projectedCostUnitPrice);
            if (projectedCostUnitPrice !== 0) {
              invoiceDetailObj.projectedCost.total = multiply(projectedCostUnitPrice, projectedCostQuantity);
              projectedCostTotal = sum(invoiceDetailObj.projectedCost.total, projectedCostTotal);
            }
          }
        });
        const invoiceRowTotalB = bigJsToNumber(invoiceRowTotal);
        const taskMinChargeB = bigJsToNumber(task.minCharge);

        if (invoiceRowTotalB < taskMinChargeB && taskMinChargeB > 0) {
          invoiceRowTotal = toBigJs(task.minCharge, { precision: 2 });
          invoiceRowForeignTotal = toBigJs(task.foreignMinCharge, { precision: 2 });
        }
        task.total = invoiceRowTotal;
        task.foreignTotal = isForeignCurrencyRequest ? invoiceRowForeignTotal : invoiceRowTotal;
        if (isTaskCancelled) {
          task.total = 0;
          task.foreignTotal = 0;
        }
        workflowSubtotal = sum(invoiceRowTotal, workflowSubtotal, { precision: 2 });
        workflowForeignSubtotal = sum(invoiceRowForeignTotal, workflowForeignSubtotal);
        if (!_.isEmpty(task.providerTasks)) {
          task.providerTasks.forEach((providerTask) => {
            if (!_.isEmpty(providerTask.billDetails)) {
              let providerTaskBillAmount = 0;

              providerTask.billDetails.forEach((bill) => {
                const quantity = toBigJs(_.get(bill, 'quantity', 0));
                const unitPrice = toBigJs(_.get(bill, 'unitPrice', 0));

                if (unitPrice instanceof bigjs) {
                  const currentBillAmount = unitPrice.times(quantity);
                  providerTaskBillAmount = sum(
                    currentBillAmount,
                    providerTaskBillAmount,

                    { precision: 2 },
                  );
                  bill.total = currentBillAmount;
                }
              });

              if (providerTask.status !== PROVIDER_TASK_STATUS_CANCELLED) {
                providerTask.total = Math.max(providerTask.minCharge, providerTaskBillAmount);
                billTotal = sum(providerTask.total, billTotal, { precision: 2 });
              } else {
                providerTask.minCharge = 0;
                providerTask.total = 0;
              }
            }
          });
        }
      });
      workflow.subtotal = workflowSubtotal;
      workflow.projectedCostTotal = projectedCostTotal;
      workflow.foreignSubtotal = isForeignCurrencyRequest
        ? workflowForeignSubtotal : workflowSubtotal;
      invoiceTotal = sum(workflowSubtotal, invoiceTotal, { precision: 2 });
      foreignInvoiceTotal = sum(workflowForeignSubtotal, foreignInvoiceTotal, { precision: 2 });
    });
    const projectedCostDifference = minus(invoiceTotal, projectedCostTotal);
    let quotient = 0;

    if (bigJsToNumber(invoiceTotal) > 0) {
      quotient = div(projectedCostDifference, invoiceTotal);
    }
    projectedCostGp = multiply(quotient, 100);
    let billGp;
    const billInvoiceTotalDifference = minus(invoiceTotal, billTotal);

    if (bigJsToNumber(invoiceTotal) > 0) {
      const billQuotient = div(billInvoiceTotalDifference, invoiceTotal);

      if (!_.isNaN(billQuotient)) {
        billGp = multiply(billQuotient, 100);
      }
    }
    const foreignBillTotal = multiply(billTotal, exchangeRate, { precision: 2 });

    if (bigJsToNumber(projectedCostTotal) > 0) {
      request.foreignProjectedCostTotal = multiply(
        projectedCostTotal,
        exchangeRate,

        { precision: 2 },
      );
    }
    Object.assign(request, {
      invoiceTotal,
      foreignInvoiceTotal,
      foreignBillTotal,
      projectedCostTotal,
      projectedCostGp,
      billTotal,
      billGp,
    });
    return request;
  } catch (err) {
    throw new Error(`An error ocurred storing request totals ${err}`);
  }
};

RequestSchema.statics.updateWorkflowProviders = function (entity) {
  const query = {
    lspId: entity.lsp,
    $and: [
      { status: { $ne: 'cancelled' } },
      { status: { $ne: 'completed' } },
    ],
    workflows: {
      $elemMatch: {
        'tasks.providerTasks.provider._id': entity._id,
      },
    },
  };
  const update = {
    $set: {
      'workflows.$[].tasks.$[].providerTasks.$[providerTask].provider.deleted': _.get(entity, 'deleted'),
      'workflows.$[].tasks.$[].providerTasks.$[providerTask].provider.terminated': _.get(entity, 'terminated'),
      'workflows.$[].tasks.$[].providerTasks.$[providerTask].provider.escalated': _.get(entity, 'vendorDetails.escalated'),
    },
  };
  const options = {
    upsert: false,
    arrayFilters: [
      {
        'providerTask.provider._id': entity._id,
      },
    ],
  };
  return this.updateMany(query, update, options);
};

RequestSchema.statics.updateEmbeddedEntity = function (entity, entitiyName) {
  if (entity) {
    const query = {
      $and: [
        { status: { $ne: 'cancelled' } },
        { status: { $ne: 'completed' } },
      ],
      lspId: entity.lspId,
      [`${entitiyName}._id`]: entity._id,
    };
    return this.updateMany(query, { $set: { [`${entitiyName}.name`]: entity.name } });
  }
  return Promise.resolve();
};

RequestSchema.statics.updateArrayEmbeddedEntity = function (entity, entitiyName) {
  if (entity) {
    const query = {
      lspId: entity.lspId,
      [`${entitiyName}._id`]: entity._id,
      $and: [
        { status: { $ne: 'cancelled' } },
        { status: { $ne: 'completed' } },
      ],
    };
    return this.updateMany(query, { $set: { [`${entitiyName}.$.name`]: entity.name } });
  }
  return Promise.resolve();
};

RequestSchema.pre('save', async function () {
  if (this.requestType && this.requestType._id) {
    const requestType = await this.model('RequestType').findOneWithDeleted({
      _id: this.requestType._id,
      lspId: this.lspId,
    });

    if (!requestType) {
      throw new Error(`Request type ${this.requestType._id} does not exist`);
    } else {
      this.requestType.name = requestType.name;
    }
  }
});

RequestSchema.pre('save', async function () {
  if (this.shedulingStatus && this.shedulingStatus._id) {
    const shedulingStatus = await this.model('SchedulingStatus').findOneWithDeleted({
      _id: this.shedulingStatus._id,
      lspId: this.lspId,
    });

    if (!shedulingStatus) {
      throw new Error(`Scheduling status ${this.shedulingStatus._id} does not exist`);
    } else {
      this.shedulingStatus.name = shedulingStatus.name;
    }
  }
});

RequestSchema.pre('save', async function () {
  if (this.internalDepartment && this.internalDepartment._id && _.isNil(this.mockPm)) {
    const internalDepartment = await this.model('InternalDepartment').findOneWithDeleted({
      _id: this.internalDepartment._id,
      lspId: this.lspId,
    });

    if (!internalDepartment) {
      throw new Error(`Internal department ${this.internalDepartment._id} does not exist`);
    } else {
      this.internalDepartment.name = internalDepartment.name;
    }
  }
});

RequestSchema.pre('save', async function () {
  if (_.get(this, 'schedulingCompany._id')) {
    const schedulingCompany = await this.model('Company').findOneWithDeleted({
      _id: this.schedulingCompany._id,
      lspId: this.lspId,
    }, '_id name hierarchy').lean();

    if (!schedulingCompany) {
      throw new Error(`Scheduling company ${this.schedulingCompany} does not exist`);
    } else {
      if (_.isEmpty(schedulingCompany.hierarchy)) {
        schedulingCompany.hierarchy = schedulingCompany.name;
      }
      this.schedulingCompany = schedulingCompany;
    }
  }
  if (_.get(this, 'schedulingContact._id')) {
    if (!this.schedulingCompany) {
      throw new Error(`Scheduling contact needs a scheduling company, but got ${this.schedulingCompany}`);
    }
    const schedulingContact = await this.model('User').findOneWithDeleted({
      _id: this.schedulingContact._id,
      lsp: this.lspId,
    }, 'email firstName middleName deleted terminated lastName').lean();

    if (!schedulingContact) {
      throw new Error(`Scheduling contact ${this.schedulingContact} does not exist`);
    } else {
      this.schedulingContact = schedulingContact;
    }
  }
});

RequestSchema.pre('save', async function () {
  if (this.insuranceCompany && this.insuranceCompany._id) {
    const insuranceCompany = await this.model('Company').findOneWithDeleted({
      _id: this.insuranceCompany._id,
      lspId: this.lspId,
    });

    if (!insuranceCompany) {
      throw new Error(`Insurance company with _id ${this.insuranceCompany._id} does not exist`);
    } else {
      this.insuranceCompany.name = insuranceCompany.name;
      this.insuranceCompany.hierarchy = insuranceCompany.hierarchy;
    }
  }
});

RequestSchema.pre('save', async function () {
  if (this.partners && this.partners.length) {
    const partners = await this.model('Company').findWithDeleted({
      _id: this.partners.map((p) => p._id),
      lspId: this.lspId,
    });

    if (partners.length !== this.partners.length) {
      throw new Error('Some partners do not exist');
    } else {
      this.partners = partners.map((p) => ({
        _id: p._id,
        name: p.name,
      }));
    }
  }
});

RequestSchema.pre('save', async function () {
  const company = await this.model('Company').findOne({
    _id: this.company._id,
    lspId: this.lspId,
  }, 'availableTimeToDeliver _id isMandatoryExternalAccountingCode').lean();
  const availableTimeToDeliver = _.get(company, 'availableTimeToDeliver', []);
  const companyId = _.get(company, '_id', '');
  const isMandatoryExternalCode = _.get(company, 'isMandatoryExternalAccountingCode', false);
  if (isMandatoryExternalCode) {
    const externalAccountingCodeId = _.get(this.externalAccountingCode, '_id', null);
    if (!externalAccountingCodeId) {
      throw new RestError(422, {
        message: `Company ${companyId} has mandatory external accounting code and cannot create request without selected external accounting id`,
      });
    }
    const companyExternalAccountingCode = await this.model('CompanyExternalAccountingCode').findOne({
      _id: externalAccountingCodeId,
      lspId: this.lspId,
    }, 'companyExternalAccountingCode _id').lean();
    if (!companyExternalAccountingCode) {
      throw new Error(`Insurance company with _id ${this.companyExternalAccountingCode._id} does not exist`);
    } else {
      this.companyExternalAccountingCode = companyExternalAccountingCode;
    }
  }
  if (!this.hasTimeToDeliverOptions) {
    return;
  }
  if (_.isEmpty(availableTimeToDeliver)) {
    return;
  }
  if (_.isEmpty(this.timeToDeliver) || _.isNil(this.timeToDeliver)) {
    throw new RestError(422, {
      message: `Company ${companyId} has preset time options and cannot accept selected Target date and time values`,
    });
  }
  if (this.isModified('timeToDeliver') && !availableTimeToDeliver.includes(this.timeToDeliver)) {
    throw new RestError(422, {
      message: "Time to deliver interval doesn't exist",
    });
  }
  this.deliveryDate = moment.utc(this.createdAt)
    .add(humanInterval(this.timeToDeliver.toLowerCase()))
    .seconds(0).milliseconds(0);
});

RequestSchema.methods.mockServerTime = function (serverTime) {
  this.createdAt = serverTime;
  this.updatedAt = serverTime;
};
RequestSchema.set('toJSON', { transform: transformDecimal128Fields });

module.exports = RequestSchema;
