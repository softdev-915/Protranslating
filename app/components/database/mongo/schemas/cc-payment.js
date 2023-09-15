const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const { Decimal128Custom, Decimal128SchemaOptions } = require('../../../../utils/schema');
const { csvVirtualParser } = require('../../../../utils/csvExporter');

const { Schema } = mongoose;
const ALLOWED_STATUSES = ['DRAFTED', 'FAILED', 'TRANSMITTED', 'CAPTURED'];
const BillToSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  address1: {
    type: String,
    required: true,
  },
  address2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

const CcPaymentSchema = new Schema({
  billTo: BillToSchema,
  transactionId: String,
  errorInformation: String,
  internalError: String,
  wasSentToProvider: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ALLOWED_STATUSES,
    default: 'DRAFTED',
  },
  amount: {
    ...Decimal128Custom,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  entityNo: {
    type: String,
    required: true,
  },
}, { collection: 'ccPayments', timestamps: true, ...Decimal128SchemaOptions });

// Part of the concurrency check
CcPaymentSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
CcPaymentSchema.set('toJSON', { virtuals: true });

CcPaymentSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance
    .virtual('CC Payment ID', item => _.get(item, '_id', ''))
    .virtual('Email', item => _.get(item, 'email', ''))
    .virtual('Entity Number', item => _.get(item, 'entityNo', ''))
    .virtual('Status', item => _.get(item, 'status', ''))
    .virtual('Created at', item => _.get(item, 'createdAt', ''))
    .virtual('Created by', item => _.get(item, 'createdBy', ''))
    .virtual('Updated at', item => _.get(item, 'updatedAt', ''))
    .virtual('Updated by', item => _.get(item, 'updatedBy', ''))
    .virtual('Deleted at', item => _.get(item, 'deletedAt', ''))
    .virtual('Deleted by', item => _.get(item, 'deletedBy', ''))
    .virtual('Restored at', item => _.get(item, 'restoredAt', ''))
    .virtual('Restored by', item => _.get(item, 'restoredBy', ''));
};

CcPaymentSchema.statics.getExportOptions = () => ({
  headers: [
    'CC Payment ID', 'Email', 'Entity Number', 'Status',
    'Created at', 'Updated at', 'Deleted at', 'Restored at',
    'Created by', 'Updated by', 'Deleted by', 'Restored by',
  ],
});

CcPaymentSchema.plugin(mongooseDelete, { overrideMethods: true });
CcPaymentSchema.plugin(metadata);
CcPaymentSchema.plugin(modified);
CcPaymentSchema.plugin(lspData);
CcPaymentSchema.plugin(lmsGrid.aggregation());

CcPaymentSchema.statics.createNewPayment = async function (paymentData, lspId) {
  paymentData.lspId = lspId;
  const query = {
    lspId,
    entityNo: paymentData.entityNo,
    wasSentToProvider: false,
  };
  const payment = await this.findOne(query);

  return _.isNil(payment) ? new this(paymentData) : _.assign(payment, paymentData);
};

module.exports = CcPaymentSchema;
