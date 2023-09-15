const _ = require('lodash');
const moment = require('moment');
const mongoose = require('mongoose');
const { validObjectId, transformDecimal128Fields } = require('../../../../../utils/schema');
const { bigJsToNumber, decimal128ToNumber } = require('../../../../../utils/bigjs');
const metadata = require('../../plugins/metadata');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const invoiceEntityValidator = function (_id, model) {
  let lspId;
  const invoiceDetails = this.parent();
  const task = invoiceDetails.parent();
  const workflows = task.parent();
  if (_.get(workflows, 'lspId')) {
    lspId = _.get(workflows, 'lspId');
  }
  if (lspId) {
    return model.findOne({ _id, lspId }, '_id').then((found) => found !== null);
  }
};

const RequestLanguageSchema = new Schema({
  name: String,
  isoCode: String,
}, { _id: false });

const QuantitySchema = new Schema({
  amount: Number,
  units: String,
}, { _id: false });

const ProviderTaskBillDetailSchema = new Schema({
  breakdown: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Breakdown',
      validate: {
        validator(_id) {
          if (validObjectId(_id)) {
            return invoiceEntityValidator.call(this, _id, mongoose.models.Breakdown);
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid breakdown!`,
      },
    },
    name: String,
  },
  translationUnit: {
    _id: {
      type: Schema.ObjectId,
      ref: 'TranslationUnit',
      validate: {
        validator(_id) {
          if (validObjectId(_id)) {
            return invoiceEntityValidator.call(this, _id, mongoose.models.TranslationUnit);
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid translation unit!`,
      },
    },
    name: String,
  },
  currency: {
    _id: {
      type: Schema.ObjectId,
      validate: {
        validator(_id) {
          if (validObjectId(_id)) {
            return invoiceEntityValidator.bind(this)(_id, mongoose.models.Currency);
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid currency!`,
      },
    },
    name: String,
    isoCode: String,
  },
  quantity: {
    type: Number,
    validate: {
      validator(quantity) {
        return quantity >= 0;
      },
      message: 'Quantity should be an integer number',
    },
  },
  unitPrice: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  total: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
});

const InvoiceDetailSchema = new Schema({
  isInvoiced: {
    type: Boolean,
    default: false,
  },
  pdfPrintable: {
    type: Boolean,
    default: false,
  },
  breakdown: {
    _id: {
      type: Schema.ObjectId,
      validate: {
        validator(_id) {
          if (validObjectId(_id)) {
            return invoiceEntityValidator.bind(this)(_id, mongoose.models.Breakdown);
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid breakdown!`,
      },
    },
    name: String,
  },
  translationUnit: {
    _id: {
      type: Schema.ObjectId,
      validate: {
        validator(_id) {
          if (validObjectId(_id)) {
            return invoiceEntityValidator.bind(this)(_id, mongoose.models.TranslationUnit);
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid translation unit!`,
      },
    },
    name: String,
  },
  quantity: {
    type: Number,
    validate: {
      validator(quantity) {
        return quantity >= 0;
      },
      message: 'Quantity should be an integer number',
    },
  },
  foreignUnitPrice: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  unitPrice: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  foreignTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  total: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
}, { timestamps: false });

const TaskInvoiceDetailSchema = new Schema({
  projectedCost: {
    breakdown: {
      _id: {
        type: Schema.ObjectId,
        validate: {
          validator(_id) {
            if (validObjectId(_id)) {
              return invoiceEntityValidator.bind(this)(_id, mongoose.models.Breakdown);
            }
            return true;
          },
          message: (props) => `${props.value} is not a valid breakdown!`,
        },
      },
      name: String,
    },
    translationUnit: {
      _id: {
        type: Schema.ObjectId,
        validate: {
          validator(_id) {
            if (validObjectId(_id)) {
              return invoiceEntityValidator.bind(this)(_id, mongoose.models.TranslationUnit);
            }
            return true;
          },
          message: (props) => `${props.value} is not a valid translation unit!`,
        },
      },
      name: String,
    },
    quantity: {
      type: Number,
      validate: {
        validator(quantity) {
          return quantity >= 0;
        },
        message: 'Quantity should be an integer number',
      },
    },
    unitPrice: {
      type: mongoose.Types.Decimal128,
      get: decimal128ToNumber,
      set: bigJsToNumber,
      validate: {
        validator(unitPrice) {
          return decimal128ToNumber(unitPrice) >= 0;
        },
        message: 'Unit price should be an integer number',
      },
    },
    foreignTotal: {
      type: mongoose.Types.Decimal128,
      get: decimal128ToNumber,
      set: bigJsToNumber,
      default: 0,
    },
    total: {
      type: mongoose.Types.Decimal128,
      get: decimal128ToNumber,
      set: bigJsToNumber,
      default: 0,
    },
  },
  invoice: InvoiceDetailSchema,
}, { _id: false, timestamps: false });

const ProviderTaskDocumentSchema = new Schema({
  name: String,
  isReference: Boolean,
  mime: String,
  cloudKey: String,
  encoding: String,
  size: Number,
  temporary: Boolean,
  // only used in final files
  completed: {
    type: Boolean,
    default: false,
  },
  url: String,
  final: {
    type: Boolean,
    default: false,
  },
  language: RequestLanguageSchema,
  deletedByRetentionPolicyAt: {
    type: Date,
    default: null,
  },
  md5Hash: {
    type: String,
    default: 'pending',
  },
}, { timestamps: true });

ProviderTaskDocumentSchema.plugin(metadata);

const ProviderTaskSchema = new Schema({
  provider: {
    _id: { type: ObjectId, ref: 'User' },
    name: String,
    deleted: Boolean,
    terminated: Boolean,
    providerConfirmed: Boolean,
    flatRate: Boolean,
    escalated: Boolean,
  },
  approvedAt: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
  },
  approvedBy: String,
  instructions: String,
  taskDueDate: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
  },
  cancelledAt: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
  },
  priorityStatus: String,
  status: {
    type: String,
    enum: ['notStarted', 'inProgress', 'onHold', 'completed', 'cancelled', 'approved'],
    default: 'notStarted',
  },
  billed: {
    type: Boolean,
    default: false,
  },
  files: [ProviderTaskDocumentSchema],
  notes: String,
  quantity: [QuantitySchema],
  billDetails: {
    type: [ProviderTaskBillDetailSchema],
    default: [],
  },
  billCreationError: String,
  minCharge: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  offer: {
    type: mongoose.Types.ObjectId,
    ref: 'ProviderPoolingOffer',
  },
  total: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  segmentEditTime: { type: Number, default: 0 },
  segmentWordsEdited: { type: Number, default: 0 },
  segmentTTE: { type: Number, default: 0 },
}, {
  toJSON: {
    getters: true,
    setters: true,
  },
});

const TaskSchema = new Schema({
  ability: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Cancelled', 'Invoiced', 'Partially Invoiced'],
    default: 'Pending',
  },
  invoiceDetails: {
    type: [TaskInvoiceDetailSchema],
    default: [],
  },
  providerTasks: {
    type: [ProviderTaskSchema],
    default: [],
  },
  minCharge: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  foreignMinCharge: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  total: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  foreignTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  dateOfApproval: {
    type: Date,
  },
  includedInGroup: {
    type: Boolean,
    default: false,
  },
  allSegmentsAssignedToOneProvider: {
    type: Boolean,
    default: false,
  },
});

const WorkflowSchema = new Schema({
  srcLang: RequestLanguageSchema,
  tgtLang: RequestLanguageSchema,
  description: {
    type: String,
  },
  workflowDueDate: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
  },
  tasks: {
    type: [TaskSchema],
    default: [],
  },
  subtotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  foreignSubtotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  projectedCostTotal: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  useMt: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: moment.utc().toDate(),
  },
  updatedAt: {
    type: Date,
    default: moment.utc().toDate(),
  },
});

ProviderTaskDocumentSchema.plugin(metadata);

WorkflowSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});
WorkflowSchema.set('toJSON', {
  transform: (doc, obj) => {
    obj.readDate = obj.updatedAt;
    return transformDecimal128Fields(doc, obj);
  },
});
TaskSchema.set('toJSON', { transform: transformDecimal128Fields });
ProviderTaskBillDetailSchema.set('toJSON', { transform: transformDecimal128Fields });
TaskInvoiceDetailSchema.set('toJSON', {
  transform: (doc, obj) => {
    _.keys(obj.invoice).forEach((key) => {
      obj.invoice[key] = decimal128ToNumber(obj.invoice[key]);
    });
    _.keys(obj.projectedCost).forEach((key) => {
      obj.projectedCost[key] = decimal128ToNumber(obj.projectedCost[key]);
    });
    return obj;
  },
});

module.exports = {
  WorkflowSchema,
  RequestLanguageSchema,
};
