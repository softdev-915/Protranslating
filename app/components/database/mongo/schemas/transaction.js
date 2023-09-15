const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');

const { Schema } = mongoose;
const BillSchema = new Schema({
  breakdown: {
    _id: Schema.Types.ObjectId,
    name: String,
  },
  translationUnit: {
    _id: Schema.Types.ObjectId,
    name: String,
  },
  currency: {
    _id: Schema.Types.ObjectId,
    name: String,
  },
  quantity: String,
  unitPrice: String,
  minCharge: String,
});

const TaskSchema = new Schema({
  ability: {
    type: String,
    required: true,
  },
  bills: [BillSchema],
});

const ServiceSchema = new Schema({
  language: {
    name: {
      type: String,
      required: true,
    },
    isoCode: String,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  tasks: [TaskSchema],
});

const TransactionDocumentSchema = new Schema(
  {
    name: String,
    isReference: Boolean,
    mime: String,
    encoding: String,
    size: Number,
    url: String,
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const TransactionSchema = new Schema({
  number: String,
  status: {
    type: String,
    enum: ['created', 'approved', 'cancelled', 'paid'],
  },
  name: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionName',
  },
  type: {
    type: Schema.Types.ObjectId,
    ref: 'TransactionType',
    required: true,
  },
  services: {
    type: [ServiceSchema],
    default: [],
  },
  no: {
    type: String,
  },
  requestNo: String,
  documents: [TransactionDocumentSchema],
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkNumber: {
    type: String,
  },
  internalDepartment: String,
  paymentMethod: String,
  billingTerm: String,
});

TransactionSchema.methods.nextRecordNumber = async () => {
  const { Counter } = mongoose.models;

  return new Promise((resolve, reject) => {
    Counter.nextTransactionNumber(this.lspId, (err, model) => {
      if (!err) {
        const no = `T${model.date}-${model.seq}`;

        resolve(no);
      }

      return reject(err);
    });
  });
};

TransactionSchema.pre('save', function (next) {
  const { Counter } = mongoose.models;

  // Set number only if it's a new record
  if (this.no) {
    next();
  }
  Counter.nextTransactionNumber(this.lspId, (err, model) => {
    if (!err) {
      this.no = `T${model.date}-${model.seq}`;
      next();
    } else {
      next(err);
    }
  });
});

TransactionSchema.virtual('username', {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
}).get(function () {
  return this.provider.username;
});

TransactionSchema.plugin(mongooseDelete, {
  overrideMethods: 'all',
});
TransactionSchema.plugin(metadata);
TransactionSchema.plugin(lspData);
TransactionSchema.plugin(lmsGrid.aggregation());
TransactionSchema.plugin(mongooseDelete, {
  overrideMethods: true,
});

module.exports = TransactionSchema;
