const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const siConnector = require('../plugins/si-connector');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const attachmentsPlugin = require('../plugins/attachments-plugin');
const arEntityPlugin = require('../plugins/ar-entity-plugin');
const transactionHelper = require('../plugins/transaction-helper');
const { Decimal128Custom, Decimal128SchemaOptions } = require('../../../../utils/schema');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const { NON_APPLICABLE_VALUE } = require('../../../../endpoints/lsp/ar-payment/ar-payment-api-helpers');
const importModulePlugin = require('../plugins/import-module');
const voidableEntityPlugin = require('../plugins/voidable-entity-plugin');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const ACCEPTABLE_TYPES = ['Credit Memo', 'Debit Memo'];
const AdjustmentEntrySchema = new Schema({
  amount: {
    ...Decimal128Custom,
    required: true,
    validate: (value) => value > 0,
  },
  departmentId: {
    type: String,
    required: true,
  },
  glAccountNo: {
    type: Number,
    required: true,
  },
  memo: {
    type: String,
  },
}, { _id: false, id: false, ...Decimal128SchemaOptions });

const ArAdjustmentSchema = new Schema({
  no: String,
  invoiceNo: String,
  type: {
    type: String,
    enum: ACCEPTABLE_TYPES,
  },
  company: {
    type: ObjectId,
    ref: 'Company',
  },
  contact: {
    type: ObjectId,
    ref: 'User',
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  glPostingDate: {
    type: Date,
    required: true,
  },
  appliedTo: {
    type: String,
    default: NON_APPLICABLE_VALUE,
    set: value => (!_.isEmpty(value) ? value : NON_APPLICABLE_VALUE),
  },
  ownEntries: [AdjustmentEntrySchema],
  invoiceEntries: [AdjustmentEntrySchema],
}, {
  timestamps: true,
  collection: 'arAdjustments',
  toJSON: { getters: true },
  toObject: { getters: true },
});

ArAdjustmentSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

ArAdjustmentSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance
    .virtual('ID', item => _.get(item, '_id', ''))
    .virtual('Adjustment No.', item => _.get(item, 'no', ''))
    .virtual('Adjustment Date', item => _.get(item, 'date', ''))
    .virtual('GL Posting Date', item => _.get(item, 'glPostingDate', ''))
    .virtual('Synced', item => _.get(item, 'isSynced', ''))
    .virtual('Company', item => _.get(item, 'company', ''))
    .virtual('Contact', item => _.get(item, 'contact', ''))
    .virtual('Invoice No', item => _.get(item, 'invoiceNo', ''))
    .virtual('Amount Paid', item => _.get(item, 'paid', ''))
    .virtual('Adjustment Total', item => _.get(item, 'total', ''))
    .virtual('Adjustment Balance', item => _.get(item, 'balance', ''))
    .virtual('Contact', item => _.get(item, 'contact', ''))
    .virtual('Currency', item => _.get(item, 'currency', ''))
    .virtual('Local Currency', item => _.get(item, 'localCurrency', ''))
    .virtual('Status', item => _.get(item, 'status', ''))
    .virtual('Type', item => _.get(item, 'type', ''))
    .virtual('Last Sync Date', item => _.get(item, 'lastSyncDate', ''))
    .virtual('Sync Error', item => _.get(item, 'syncError', ''))
    .virtual('Exchange Rate', item => _.get(item, 'exchangeRate', ''))
    .virtual('Local Amount', item => _.get(item, 'localAmount', ''))
    .virtual('Created At', item => _.get(item, 'createdAt', ''))
    .virtual('Created By', item => _.get(item, 'createdBy', ''))
    .virtual('Updated At', item => _.get(item, 'updatedAt', ''))
    .virtual('Updated By', item => _.get(item, 'updatedBy', ''))
    .virtual('Deleted At', item => _.get(item, 'deletedAt', ''))
    .virtual('Deleted By', item => _.get(item, 'deletedBy', ''))
    .virtual('Restored At', item => _.get(item, 'restoredAt', ''))
    .virtual('Restored By', item => _.get(item, 'restoredBy', ''))
    .virtual('Applied To', item => _.get(item, 'appliedTo', ''));
};

ArAdjustmentSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Adjustment No.',
    'Adjustment Date',
    'GL Posting Date',
    'Synced',
    'Company',
    'Contact',
    'Invoice No',
    'Amount Paid',
    'Adjustment Total',
    'Adjustment Balance',
    'Contact',
    'Currency',
    'Local Currency',
    'Status',
    'Type',
    'Last Sync Date',
    'Sync Error',
    'Exchange Rate',
    'Local Amount',
    'Created At',
    'Created By',
    'Updated At',
    'Updated By',
    'Deleted At',
    'Deleted By',
    'Restored At',
    'Restored By',
    'Applied To',
  ],
});

ArAdjustmentSchema.plugin(mongooseDelete, { overrideMethods: true });
ArAdjustmentSchema.plugin(transactionHelper);
ArAdjustmentSchema.plugin(metadata);
ArAdjustmentSchema.plugin(modified);
ArAdjustmentSchema.plugin(attachmentsPlugin);
ArAdjustmentSchema.plugin(lspData);
ArAdjustmentSchema.plugin(lmsGrid.aggregation());
ArAdjustmentSchema.plugin(siConnector);
ArAdjustmentSchema.plugin(arEntityPlugin);
ArAdjustmentSchema.plugin(voidableEntityPlugin);
ArAdjustmentSchema.plugin(importModulePlugin);
ArAdjustmentSchema.index({ lspId: 1, no: 1 }, { unique: true });

ArAdjustmentSchema.statics.setNo = function (arAdjustment, session) {
  if (!_.isNil(arAdjustment.no)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const Counter = mongoose.models.Counter;
    const LspModel = mongoose.models.Lsp;
    Counter.nextEntityNumber({ lspId: arAdjustment.lspId, key: 'adjustmentNo', session }, (err, model) => {
      if (_.isNil(err)) {
        LspModel.findOne({ _id: arAdjustment.lspId }).then((lsp) => {
          arAdjustment.no = `${lsp.financialEntityPrefix}IA${model.date}-${model.seq}`;
          resolve(arAdjustment.validate());
        });
      } else {
        reject(err);
      }
    });
  });
};

module.exports = ArAdjustmentSchema;
