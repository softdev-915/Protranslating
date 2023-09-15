const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const siConnectorPlugin = require('../plugins/si-connector');
const transactionHelper = require('../plugins/transaction-helper');
const { decimal128ToNumber, sum, minus, bigJsToRoundedNumber } = require('../../../../utils/bigjs');
const importModulePlugin = require('../plugins/import-module');
const piiPlugin = require('../plugins/pii-plugin');
const { generateEntityFieldsPathsMap } = require('../utils');

const PARTIALLY_PAID_STATUS = 'partiallyPaid';
const POSTED_STATUS = 'posted';
const PAID_STATUS = 'paid';
const BILL_PII = {
  vendor: {
    vendorDetails: {
      billingInformation: {
        fields: ['taxId'],
      },
    },
  },
};
const Schema = mongoose.Schema;

function setBillNo() {
  const { Counter } = mongoose.models;
  const LspModel = mongoose.models.Lsp;

  return new Promise((resolve, reject) => {
    Counter.nextBillNumber(this.lspId, (err, model) => {
      if (!err) {
        LspModel.findOne({ _id: new mongoose.Types.ObjectId(this.lspId) }).then((lsp) => {
          this.no = `${lsp.financialEntityPrefix}B${model.date}-${model.seq}`;
          resolve();
        }).catch((error) => reject(error));
      } else {
        reject(err);
      }
    });
  });
}

function setTotalAmountAndBalance() {
  const serviceDetails = _.get(this, 'serviceDetails', []);
  const amountPaid = _.get(this, 'amountPaid', 0);
  const totalAmount = serviceDetails.reduce(
    (accumulator, { taskAmount }) => sum(accumulator, taskAmount),
    0,
  );

  this.balance = minus(totalAmount, amountPaid);
  this.totalAmount = totalAmount;
}

const ServiceDetailSchema = new Schema({
  expenseAccountNo: String,
  taskAmount: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: (v) => bigJsToRoundedNumber(v, 2),
    default: 0,
  },
  recipient: String,
  referenceNumber: String,
  taskDescription: String,
  accountingDepartmentId: String,
}, {
  toJSON: {
    getters: true,
  },
});
const DocumentSchema = new Schema({
  name: String,
  mime: String,
  cloudKey: String,
  encoding: String,
  size: Number,
  temporary: Boolean,
  completed: {
    type: Boolean,
    default: false,
  },
  url: String,
  deletedByRetentionPolicyAt: {
    type: Date,
    default: null,
  },
  md5Hash: {
    type: String,
    default: 'pending',
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
}, { timestamps: true });

DocumentSchema.plugin(mongooseDelete, {
  overrideMethods: true,
  deletedByType: String,
  deletedBy: true,
  deletedAt: true,
});

const RequestSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, ref: 'Request' },
  no: { type: String },
});

const ProviderTaskIdSchema = new Schema({
  requestId: Schema.Types.ObjectId,
  workflowId: Schema.Types.ObjectId,
  taskId: Schema.Types.ObjectId,
  providerTaskId: Schema.Types.ObjectId,
}, { _id: false });

const BillSchema = new Schema({
  no: {
    type: String,
  },
  requests: [RequestSchema],
  providerTasksIdList: [ProviderTaskIdSchema],
  billStartDate: {
    type: Date,
  },
  billEndDate: {
    type: Date,
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentMethod: {
    _id: { type: Schema.ObjectId },
    name: String,
  },
  billPaymentNotes: { type: String },
  billingTerms: {
    _id: { type: Schema.ObjectId },
    name: String,
  },
  priorityPayment: {
    type: Boolean,
    default: false,
  },
  billOnHold: {
    type: Boolean,
    default: false,
  },
  wtFeeWaived: {
    type: Boolean,
    default: false,
  },
  date: Date,
  dueDate: Date,
  paymentScheduleDate: Date,
  status: {
    type: String,
    enum: [POSTED_STATUS, PARTIALLY_PAID_STATUS, PAID_STATUS],
    default: POSTED_STATUS,
  },
  glPostingDate: {
    type: Date,
    set: (glPostingDate) => moment(glPostingDate).utc().toDate(),
  },
  amountPaid: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: (v) => bigJsToRoundedNumber(v, 2),
    default: 0,
  },
  serviceDetails: [ServiceDetailSchema],
  documents: [DocumentSchema],
  totalAmount: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: (v) => bigJsToRoundedNumber(v, 2),
    default: 0,
  },
  balance: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: (v) => bigJsToRoundedNumber(v, 2),
    default: 0,
  },
  hasTaxIdForms: { type: Boolean },
  has1099EligibleForm: { type: Boolean },
  schedulerType: { type: String },
}, {
  collection: 'bills',
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
  },
});

BillSchema.pre('save', async function (next) {
  try {
    setTotalAmountAndBalance.call(this);
    if (_.isEmpty(_.get(this, 'no', ''))) {
      await setBillNo.call(this);
    }
    if (this.totalAmount === 0) this.status = PAID_STATUS;
    if (this.amountPaid > 0 && this.amountPaid !== this.totalAmount) {
      this.status = PARTIALLY_PAID_STATUS;
    }
    next();
  } catch (err) {
    next(err);
  }
});

BillSchema.pre('insertMany', async (next, bills) => {
  try {
    await Promise.mapSeries(bills, async (bill) => {
      setTotalAmountAndBalance.call(bill);
      if (_.isEmpty(_.get(bill, 'no', ''))) {
        await setBillNo.call(bill);
      }
    });
    next();
  } catch (err) {
    next(err);
  }
});
BillSchema.statics.PATHS_TO_MASK = generateEntityFieldsPathsMap(BILL_PII);
BillSchema.statics.getStatus = (bill) => {
  if (bill.amountPaid > 0) {
    if (bill.balance > 0) {
      return PARTIALLY_PAID_STATUS;
    }
    return PAID_STATUS;
  }
  return POSTED_STATUS;
};
BillSchema.statics.getExportOptions = (canReadAllFields) => {
  let fields = [
    'Bill No.',
    'Bill ID',
    'Request Numbers',
    'Bill Date',
    'Due Date',
    'Vendor ID',
    'Vendor Name',
    'Bill Balance',
    'Amount Paid',
    'Total Amount',
    'Status',
    'Updated at',
    'Created at',
    'Restored at',
    'Created by',
    'Updated by',
    'Restored by',
    'Bill Scheduler Type',
  ];

  if (canReadAllFields) {
    fields = fields.concat([
      'Payment Schedule Date',
      'GL Posting Date',
      'Synced',
      'Sync Error',
      'Last Sync Date',
      'Vendor ID',
      '1099 ',
      'Vendor Email',
      'Billing Address',
      'Vendor Id',
      'Vendor Company',
      'Vendor billing term',
      'Payment method',
      'Total balance',
      'WT Fee Waived',
      'Billing Terms',
      'Bill On Hold',
      'Priority Pay',
      'Bill Payment Notes',
    ]);
  }

  return { headers: fields };
};

BillSchema.index({
  'providerTasksIdList.requestId': 1,
  'providerTasksIdList.workflowId': 1,
  'providerTasksIdList.taskId': 1,
  'providerTasksIdList.providerTaskId': 1,
}, { unique: true });

BillSchema.plugin(metadata);
BillSchema.plugin(modified);
BillSchema.plugin(lspData);
BillSchema.plugin(siConnectorPlugin);
BillSchema.plugin(mongooseDelete, { overrideMethods: 'all' });
BillSchema.plugin(transactionHelper);
BillSchema.plugin(importModulePlugin);
BillSchema.plugin(piiPlugin);

module.exports = BillSchema;
