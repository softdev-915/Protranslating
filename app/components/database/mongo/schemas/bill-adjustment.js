const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const siConnector = require('../plugins/si-connector');
const transactionHelper = require('../plugins/transaction-helper');
const { roundNumber, decimal128ToNumber } = require('../../../../utils/bigjs');
const importModulePlugin = require('../plugins/import-module');

const Schema = mongoose.Schema;
const DocumentSchema = new Schema({
  name: String,
  isReference: Boolean,
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
}, { timestamps: true });

DocumentSchema.plugin(mongooseDelete);

const BillAdjustmentSchema = new Schema({
  adjustmentNo: {
    type: String,
  },
  referenceBillNo: {
    type: String,
  },
  bill: {
    type: Schema.Types.ObjectId,
    ref: 'Bill',
  },
  date: Date,
  type: {
    type: String,
    enum: ['Debit Memo', 'Credit Memo'],
    default: 'Debit Memo',
  },
  status: {
    type: String,
    enum: ['posted', 'partiallyPaid', 'paid'],
    default: 'partiallyPaid',
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  glPostingDate: Date,
  description: {
    type: String,
  },
  adjustmentBalance: {
    type: Schema.Types.Decimal128,
    set: roundNumber(2),
    get: decimal128ToNumber,
    validate: (value) => value >= 0,
    default: 0,
  },
  amountPaid: {
    type: Schema.Types.Decimal128,
    set: roundNumber(2),
    get: decimal128ToNumber,
    validate: (value) => value >= 0,
    default: 0,
  },
  adjustmentTotal: {
    type: Schema.Types.Decimal128,
    set: roundNumber(2),
    get: decimal128ToNumber,
    validate: (value) => value >= 0,
    default: 0,
  },
  lineItems: [{
    glAccountNo: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseAccount',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'InternalDepartment',
    },
    ability: String,
    amount: {
      type: Number,
      default: 0,
      validate: (value) => value > 0,
    },
    memo: String,
  }],
  documents: [DocumentSchema],
  appliedTo: String,
}, {
  collection: 'billAdjustments',
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

BillAdjustmentSchema.pre('save', function (next) {
  const { Counter } = mongoose.models;
  const LspModel = mongoose.models.Lsp;

  if (!_.isEmpty(_.get(this, 'adjustmentNo', ''))) {
    next();
  } else {
    Counter.nextBillAdjustmentNumber(this.lspId, (err, model) => {
      if (!err) {
        LspModel.findOne({ _id: new mongoose.Types.ObjectId(this.lspId) }).then((lsp) => {
          this.adjustmentNo = `${lsp.financialEntityPrefix}BA${model.date}-${model.seq}`;
          next();
        }).catch((error) => next(error));
      } else {
        next(err);
      }
    });
  }
});

BillAdjustmentSchema.pre('save', function (next) {
  this.status = BillAdjustmentSchema.statics.getStatus(this);
  next();
});

BillAdjustmentSchema.statics.getStatus = (billAdjustment) => {
  const { adjustmentTotal, adjustmentBalance, amountPaid } = billAdjustment;

  if (adjustmentTotal === adjustmentBalance) {
    return 'posted';
  }
  if (adjustmentTotal === amountPaid) {
    return 'paid';
  }
  if (adjustmentTotal > amountPaid && amountPaid > 0) {
    return 'partiallyPaid';
  }
};
BillAdjustmentSchema.statics.getExportOptions = () => ({
  headers: [
    'ID', 'Adjustment No', 'Reference Bill No', 'Adjustment Date', 'Type',
    'Status', 'Synced', 'Last Sync Date', 'Sync Error', 'Vendor Name',
    'Vendor ID', 'GL Posting Date', 'Adjustment Balance', 'Amount Paid', 'Adjustment Total',
    'Description', 'Created at', 'Created by', 'Updated at', 'Updated by', 'Deleted at',
    'Deleted by', 'Restored at', 'Restored by',
  ],
});

BillAdjustmentSchema.plugin(mongooseDelete, { overrideMethods: true });
BillAdjustmentSchema.plugin(metadata);
BillAdjustmentSchema.plugin(modified);
BillAdjustmentSchema.plugin(lspData);
BillAdjustmentSchema.plugin(lmsGrid.aggregation());
BillAdjustmentSchema.plugin(siConnector);
BillAdjustmentSchema.plugin(transactionHelper);
BillAdjustmentSchema.plugin(importModulePlugin);
module.exports = BillAdjustmentSchema;
