const { Schema } = require('mongoose');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const { decimal128ToNumber, transformDecimal128Fields } = require('../../../../utils/bigjs');

const { Types: { Decimal128, ObjectId } } = Schema;
const AddressSchema = new Schema({
  line1: String,
  line2: String,
  city: String,
  country: {
    _id: Schema.ObjectId,
    name: String,
    code: String,
  },
  state: {
    _id: Schema.ObjectId,
    name: String,
    code: String,
    country: Schema.ObjectId,
  },
  zip: String,
}, { _id: false });
const CheckSchema = new Schema({
  apPaymentId: {
    type: ObjectId,
    ref: 'ApPayment',
    required: true,
  },
  accountPayableId: {
    type: ObjectId,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Printed', 'Not Printed'],
    default: 'Not Printed',
  },
  vendor: {
    _id: {
      type: ObjectId,
      ref: 'User',
    },
    fullName: String,
    address: AddressSchema,
  },
  amount: {
    type: Decimal128,
    get: decimal128ToNumber,
    default: 0,
  },
  bankAccount: {
    type: ObjectId,
    ref: 'BankAccount',
    required: true,
  },
  memo: String,
  checkNo: String,
}, {
  collection: 'apChecks',
  timestamps: true,
  toJSON: {
    getters: true,
  },
});

CheckSchema.plugin(metadata);
CheckSchema.plugin(modified);
CheckSchema.plugin(lspData);
CheckSchema.set('toJSON', { transform: transformDecimal128Fields });
module.exports = CheckSchema;
