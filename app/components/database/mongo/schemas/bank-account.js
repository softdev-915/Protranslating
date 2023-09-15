const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const BankAccount = new Schema({
  no: {
    type: String,
    __lms: {
      csvHeader: 'Bank Account ID',
      gridSearchable: true,
    },
    required: true,
  },
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
    required: true,
  },
}, {
  collection: 'bankAccounts',
  timestamps: true,
});

// Part of the concurrency check
BankAccount.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
BankAccount.set('toJSON', { virtuals: true });

BankAccount.plugin(mongooseDelete, { overrideMethods: true });
BankAccount.plugin(metadata);
BankAccount.plugin(modified);
BankAccount.plugin(lspData);
BankAccount.plugin(lmsGrid.aggregation());
BankAccount.plugin(importModulePlugin);
BankAccount.index({ lspId: 1, no: 1 }, { unique: true });
BankAccount.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = BankAccount;
