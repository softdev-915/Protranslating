const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const siConnectorPlugin = require('../plugins/si-connector');
const attachmentsPlugin = require('../plugins/attachments-plugin');
const { decimal128ToNumber } = require('../../../../utils/bigjs');
const { convertToObjectId, transformDecimal128Fields } = require('../../../../utils/schema');
const { ensureNumber } = require('../../../../utils/bigjs');
const importModulePlugin = require('../plugins/import-module');

const HUMAN_READABLE_STATUS_LIST = {
  posted: 'Posted',
  partiallyPaid: 'Partially Paid',
  paid: 'Paid',
  inProgress: 'In Progress',
  drafted: 'Drafted',
  voided: 'Voided',
};
const STATUS_LIST = {
  'In Progress': 'inProgress',
  Posted: 'posted',
  'Partially Paid': 'partiallyPaid',
  Paid: 'paid',
  Drafted: 'drafted',
  Voided: 'voided',
};
const Schema = mongoose.Schema;
const ApPaymentDetailSchema = new Schema({
  appliedFrom: {
    type: Schema.Types.ObjectId,
    ref: 'BillAdjustment',
    set: convertToObjectId,
  },
  appliedFromNo: { type: String },
  appliedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Bill',
    set: convertToObjectId,
  },
  appliedToNo: { type: String },
  appliedToType: { type: String, enum: ['bill', 'billAdjustment'] },
  appliedCredits: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: ensureNumber,
    default: 0,
  },
  paymentAmount: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: ensureNumber,
    default: 0,
  },
}, { _id: false });

const ApPaymentSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentDate: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
  },
  paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
  bankAccount: {
    type: Schema.Types.ObjectId,
    ref: 'BankAccount',
  },
  details: [ApPaymentDetailSchema],
  entries: [Schema.Types.Mixed],
  voidDetails: {
    date: { type: Date },
    memo: { type: String },
    isVoided: { type: Boolean, default: false },
  },
  status: {
    type: String,
    enum: Object.keys(HUMAN_READABLE_STATUS_LIST),
    default: STATUS_LIST.Drafted,
  },
}, {
  collection: 'apPayments',
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
  },
});

ApPaymentSchema.statics.setCsvTransformations = csvBuilderInstance =>
  csvBuilderInstance
    .virtual('ID', item => _.get(item, '_id', ''))
    .virtual('Vendor Name', item => _.get(item, 'vendorName', ''))
    .virtual('Vendor PT Pay/Paypal/Veem', item => _.get(item, 'ptPayOrPayPal', ''))
    .virtual('Synced', item => _.get(item, 'isSynced', ''))
    .virtual('Sync Error', item => _.get(item, 'syncError', ''))
    .virtual('Last Sync Date', item => _.get(item, 'lastSyncDate', ''))
    .virtual('Payment Date', item => _.get(item, 'paymentDate', ''))
    .virtual('Payment Method', item => _.get(item, 'paymentMethod', ''))
    .virtual('Bank Account', item => _.get(item, 'bankAccount', ''))
    .virtual('Total Payment Amount', item => _.get(item, 'totalPaymentAmount', ''))
    .virtual('Total Applied Credit', item => _.get(item, 'totalAppliedCredit', ''))
    .virtual('Applied to', item => _.get(item, 'appliedToNoText', ''))
    .virtual('Applied to Type', item => _.get(item, 'appliedToTypeText', ''))
    .virtual('Payment Date', item => _.get(item, 'paymentDate', ''))
    .virtual('Vendor Address', item => _.get(item, 'vendorAddress', ''))
    .virtual('Vendor City', item => _.get(item, 'vendorCity', ''))
    .virtual('Vendor Country', item => _.get(item, 'vendorCountry', ''))
    .virtual('Vendor ID', item => _.get(item, 'vendor', ''))
    .virtual('Vendor Zip', item => _.get(item, 'vendorZip', ''))
    .virtual('Vendor State', item => _.get(item, 'vendorState', ''))
    .virtual('Created At', item => _.get(item, 'createdAt', ''))
    .virtual('Created By', item => _.get(item, 'createdBy', ''))
    .virtual('Updated At', item => _.get(item, 'updatedAt', ''))
    .virtual('Updated By', item => _.get(item, 'updatedBy', ''))
    .virtual('Deleted At', item => _.get(item, 'deletedAt', ''))
    .virtual('Deleted By', item => _.get(item, 'deletedBy', ''))
    .virtual('Restored At', item => _.get(item, 'restoredAt', ''))
    .virtual('Restored By', item => _.get(item, 'restoredBy', ''));

ApPaymentSchema.statics.setAccountPayableCsvTransformations = csvBuilderInstance =>
  csvBuilderInstance
    .virtual('ID', item => _.get(item, '_id', ''))
    .virtual('Applied To', item => _.get(item, 'no', ''))
    .virtual('Applied To Type', item => _.get(item, 'appliedToType', ''))
    .virtual('Due Date', item => _.get(item, 'dueDate', ''))
    .virtual('Ref. Bill #', item => _.get(item, 'billNo', ''))
    .virtual('Vendor ID', item => _.get(item, 'vendorId', ''))
    .virtual('Vendor Name', item => _.get(item, 'vendorName', ''))
    .virtual('Status', item => HUMAN_READABLE_STATUS_LIST[item.status])
    .virtual('Credits available', item => _.get(item, 'creditsAvailable', 0))
    .virtual('Credits to Apply', item => _.get(item, 'creditsToApply', 0))
    .virtual('Bill Balance', item => _.get(item, 'billBalance', 0))
    .virtual('Payment method', item => _.get(item, 'paymentMethod', ''))
    .virtual('Payment amount', item => _.get(item, 'paymentAmount', 0));

ApPaymentSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Vendor Name',
    'Vendor PT Pay/Paypal/Veem',
    'Synced',
    'Sync Error',
    'Last Sync Date',
    'Payment Date',
    'Payment Method',
    'Bank Account',
    'Applied to',
    'Applied to Type',
    'Total Payment Amount',
    'Total Applied Credit',
    'Vendor Address',
    'Vendor City',
    'Vendor Country',
    'Vendor ID',
    'Vendor Zip',
    'Vendor State',
    'Created At',
    'Updated At',
    'Deleted At',
    'Restored At',
    'Created By',
    'Updated By',
    'Deleted By',
    'Restored By',
    'Status',
  ],
});

ApPaymentSchema.statics.getAccountPayableListExportOptions = () => ({
  headers: [
    'ID',
    'Applied To',
    'Applied To Type',
    'Due Date',
    'Ref. Bill #',
    'Vendor ID',
    'Vendor Name',
    'Status',
    'Credits available',
    'Credits to Apply',
    'Bill Balance',
    'Payment method',
    'Payment amount',
  ],
});

ApPaymentSchema.statics.isValidCsvImportedEntry = entry => (parseFloat(Number(entry['Credits to Apply'])) + parseFloat(Number(entry['Payment amount'])) >= 0.01);

ApPaymentSchema.statics.mapCsvRowToEntriesSchemaDefinition = () => ({
  ID: 'accountPayableId',
  'Credits to Apply': 'creditsToApply',
  'Payment amount': 'paymentAmount',
  'Applied To': 'no',
  'Applied To Type': 'appliedToType',
  'Due Date': 'dueDate',
  'Ref. Bill #': 'billNo',
  'Vendor ID': 'vendorId',
  'Vendor Name': 'vendorName',
  Status: 'status',
  'Credits available': 'creditsAvailable',
  'Bill Balance': 'billBalance',
  'Payment method': 'paymentMethod',
});

ApPaymentSchema.plugin(metadata);
ApPaymentSchema.plugin(modified);
ApPaymentSchema.plugin(lspData);
ApPaymentSchema.plugin(siConnectorPlugin);
ApPaymentSchema.plugin(attachmentsPlugin);
ApPaymentSchema.plugin(lmsGrid.aggregation());
ApPaymentSchema.plugin(importModulePlugin);
ApPaymentSchema.set('toJSON', { transform: transformDecimal128Fields });

module.exports = ApPaymentSchema;
