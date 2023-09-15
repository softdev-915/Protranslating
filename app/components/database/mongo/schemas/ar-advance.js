const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const transactionHelper = require('../plugins/transaction-helper');
const siConnectorPlugin = require('../plugins/si-connector');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const arEntityPlugin = require('../plugins/ar-entity-plugin');
const attachmentsPlugin = require('../plugins/attachments-plugin');
const { NON_APPLICABLE_VALUE } = require('../../../../endpoints/lsp/ar-payment/ar-payment-api-helpers');
const importModulePlugin = require('../plugins/import-module');
const voidableEntityPlugin = require('../plugins/voidable-entity-plugin');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const ArAdvanceSchema = new Schema({
  company: {
    type: ObjectId,
    ref: 'Company',
    required: true,
  },
  paymentMethod: {
    type: ObjectId,
    ref: 'PaymentMethod',
    required: true,
  },
  bankAccount: {
    type: ObjectId,
    ref: 'BankAccount',
  },
  undepositedAccountIdentifier: {
    type: String,
    validate: {
      validator(v) {
        return !_.isEmpty(v) || !_.isNil(this.bankAccount);
      },
    },
  },
  date: {
    type: Date,
    required: true,
  },
  receiptDate: {
    type: Date,
    required: true,
  },
  appliedTo: {
    type: String,
    default: NON_APPLICABLE_VALUE,
    set: (value) => (!_.isEmpty(value) ? value : NON_APPLICABLE_VALUE),
  },
  no: String,
  docNo: String,
  description: String,
  voidDetails: {
    date: Date,
    memo: String,
    isVoided: { type: Boolean, default: false },
  },
}, {
  id: false,
  collection: 'arAdvances',
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

ArAdvanceSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);
  return csvBuilderInstance
    .virtual('ID', (item) => _.get(item, '_id', ''))
    .virtual('Advance No.', (item) => _.get(item, 'no', ''))
    .virtual('Payment Date', (item) => _.get(item, 'date', ''))
    .virtual('Receipt Date', (item) => _.get(item, 'receiptDate', ''))
    .virtual('Synced', (item) => _.get(item, 'isSynced', ''))
    .virtual('Company', (item) => _.get(item, 'company', ''))
    .virtual('Amount Applied', (item) => _.get(item, 'applied', ''))
    .virtual('Bank Account', (item) => _.get(item, 'account', ''))
    .virtual('Payment Method', (item) => _.get(item, 'paymentMethod', ''))
    .virtual('Amount Available', (item) => _.get(item, 'balance', ''))
    .virtual('Description', (item) => _.get(item, 'description', ''))
    .virtual('Document Number', (item) => _.get(item, 'docNo', ''))
    .virtual('LSP Local Currency', (item) => _.get(item, 'localCurrency', ''))
    .virtual('Local Amount', (item) => _.get(item, 'localAmount', ''))
    .virtual('Exchange Rate', (item) => _.get(item, 'exchangeRate', ''))
    .virtual('Status', (item) => _.get(item, 'status', ''))
    .virtual('Last Sync Date', (item) => _.get(item, 'lastSyncDate', ''))
    .virtual('Sync Error', (item) => _.get(item, 'syncError', ''))
    .virtual('Currency', (item) => _.get(item, 'currency', ''))
    .virtual('Amount', (item) => _.get(item, 'amount', ''))
    .virtual('Applied To', (item) => _.get(item, 'appliedTo', ''))
    .virtual('Created At', (item) => _.get(item, 'createdAt', ''))
    .virtual('Created By', (item) => _.get(item, 'createdBy', ''))
    .virtual('Updated At', (item) => _.get(item, 'updatedAt', ''))
    .virtual('Updated By', (item) => _.get(item, 'updatedBy', ''))
    .virtual('Deleted At', (item) => _.get(item, 'deletedAt', ''))
    .virtual('Deleted By', (item) => _.get(item, 'deletedBy', ''))
    .virtual('Restored At', (item) => _.get(item, 'restoredAt', ''))
    .virtual('Restored By', (item) => _.get(item, 'restoredBy', ''));
};

ArAdvanceSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Advance No.',
    'Payment Date',
    'Receipt Date',
    'Synced',
    'Company',
    'Amount Applied',
    'Bank Account',
    'Payment Method',
    'Amount Available',
    'Description',
    'Document Number',
    'LSP Local Currency',
    'Local Amount',
    'Exchange Rate',
    'Status',
    'Last Sync Date',
    'Sync Error',
    'Currency',
    'Amount',
    'Applied To',
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

ArAdvanceSchema.statics.setNo = function (arAdvance, session) {
  if (!_.isNil(arAdvance.no)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const { Counter } = mongoose.models;
    const LspModel = mongoose.models.Lsp;
    Counter.nextEntityNumber({ lspId: arAdvance.lspId, key: 'advanceNo', session }, (err, model) => {
      if (_.isNil(err)) {
        LspModel.findOne({ _id: arAdvance.lspId }).then((lsp) => {
          arAdvance.no = `${lsp.financialEntityPrefix}AA${model.date}-${model.seq}`;
          resolve(arAdvance.validate());
        });
      } else {
        reject(err);
      }
    });
  });
};

ArAdvanceSchema.plugin(mongooseDelete, { overrideMethods: true });
ArAdvanceSchema.plugin(transactionHelper);
ArAdvanceSchema.plugin(metadata);
ArAdvanceSchema.plugin(modified);
ArAdvanceSchema.plugin(lspData);
ArAdvanceSchema.plugin(siConnectorPlugin);
ArAdvanceSchema.plugin(arEntityPlugin);
ArAdvanceSchema.plugin(voidableEntityPlugin);
ArAdvanceSchema.plugin(attachmentsPlugin);
ArAdvanceSchema.plugin(importModulePlugin);

module.exports = ArAdvanceSchema;
