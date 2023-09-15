const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const attachmentsPlugin = require('../plugins/attachments-plugin');
const siConnector = require('../plugins/si-connector');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const { Decimal128Custom, Decimal128SchemaOptions, currencyCommonFields } = require('../../../../utils/schema');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const importModulePlugin = require('../plugins/import-module');
const voidableEntityPlugin = require('../plugins/voidable-entity-plugin');

const VALID_SOURCE_TYPES = ['Payment', 'Advance', 'Credit Memo'];
const VALID_TARGET_TYPES = ['Invoice', 'Debit Memo'];
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const arPaymentTargetSchema = new Schema({
  no: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  dueDate: {
    type: String,
  },
  ccPayment: {
    type: ObjectId,
    ref: 'CcPayment',
  },
  amount: Decimal128Custom,
}, {
  _id: false, id: false, ...Decimal128SchemaOptions, toJSON: { getters: true }, toObject: { getters: true },
});

const arPaymentAccountingSchema = new Schema({
  amount: {
    ...Decimal128Custom,
    required: true,
  },
  amountInLocal: Decimal128Custom,
  currency: currencyCommonFields,
  localCurrency: currencyCommonFields,
  exchangeRate: {
    ...Decimal128Custom,
    required: true,
  },
}, {
  _id: false, id: false, ...Decimal128SchemaOptions, toJSON: { getters: true }, toObject: { getters: true },
});

const ArPaymentSchema = new Schema({
  sourceType: {
    type: String,
    enum: VALID_SOURCE_TYPES,
    required: true,
  },
  targetType: {
    type: String,
    enum: VALID_TARGET_TYPES,
    required: true,
  },
  docNo: String,
  accounting: arPaymentAccountingSchema,
  source: String,
  target: [arPaymentTargetSchema],
  company: {
    type: ObjectId,
    ref: 'Company',
  },
  bankAccount: {
    type: ObjectId,
    ref: 'BankAccount',
  },
  method: {
    type: ObjectId,
    ref: 'PaymentMethod',
  },
  description: String,
  undepositedAccountIdentifier: String,
  date: Date,
  receiptDate: {
    type: Date,
    required: true,
  },
  voidDetails: {
    date: Date,
    memo: String,
    isVoided: { type: Boolean, default: false },
  },
}, {
  timestamps: true, collection: 'arPayments', toJSON: { getters: true }, toObject: { getters: true },
});

ArPaymentSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);
  return csvBuilderInstance
    .virtual('ID', (item) => _.get(item, '_id', ''))
    .virtual('Payment Method', (item) => _.get(item, 'paymentMethod', ''))
    .virtual('Payment Date', (item) => _.get(item, 'date', ''))
    .virtual('Synced', (item) => _.get(item, 'isSynced', ''))
    .virtual('Company', (item) => _.get(item, 'company', ''))
    .virtual('Payment Amount', (item) => _.get(item, 'amount', ''))
    .virtual('Currency', (item) => _.get(item, 'currency', ''))
    .virtual('CC Payment ID', (item) => _.get(item, 'ccPaymentList', []).join(', '))
    .virtual('Credits Applied', (item) => _.get(item, 'applied', ''))
    .virtual('Total Amount Applied', (item) => _.get(item, 'total', ''))
    .virtual('Document Number', (item) => _.get(item, 'docNo', ''))
    .virtual('Received Date', (item) => _.get(item, 'receiptDate', ''))
    .virtual('Last Sync Date', (item) => _.get(item, 'lastSyncDate', ''))
    .virtual('Sync Error', (item) => _.get(item, 'syncError', ''))
    .virtual('Local Currency', (item) => _.get(item, 'localCurrency', ''))
    .virtual('Bank account', (item) => _.get(item, 'account', ''))
    .virtual('Exchange rate', (item) => _.get(item, 'exchangeRate', ''))
    .virtual('Local Amount', (item) => _.get(item, 'localAmount', ''))
    .virtual('Created At', (item) => _.get(item, 'createdAt', ''))
    .virtual('Created By', (item) => _.get(item, 'createdBy', ''))
    .virtual('Updated At', (item) => _.get(item, 'updatedAt', ''))
    .virtual('Updated By', (item) => _.get(item, 'updatedBy', ''))
    .virtual('Deleted At', (item) => _.get(item, 'deletedAt', ''))
    .virtual('Deleted By', (item) => _.get(item, 'deletedBy', ''))
    .virtual('Restored At', (item) => _.get(item, 'restoredAt', ''))
    .virtual('Restored By', (item) => _.get(item, 'restoredBy', ''));
};

ArPaymentSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Payment Method',
    'Payment Date',
    'Synced',
    'Company',
    'Payment Amount',
    'Currency',
    'CC Payment ID',
    'Credits Applied',
    'Total Amount Applied',
    'Document Number',
    'Received Date',
    'Last Sync Date',
    'Sync Error',
    'Local Currency',
    'Bank account',
    'Exchange rate',
    'Local Amount',
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

ArPaymentSchema.plugin(mongooseDelete, { overrideMethods: true });
ArPaymentSchema.plugin(attachmentsPlugin);
ArPaymentSchema.plugin(voidableEntityPlugin);
ArPaymentSchema.plugin(siConnector);
ArPaymentSchema.plugin(metadata);
ArPaymentSchema.plugin(modified);
ArPaymentSchema.plugin(lspData);
ArPaymentSchema.plugin(lmsGrid.aggregation());
ArPaymentSchema.plugin(importModulePlugin);

module.exports = ArPaymentSchema;
