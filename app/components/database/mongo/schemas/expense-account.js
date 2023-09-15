const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const ExpenseAccountSchema = new Schema({
  name: {
    type: String,
    required: true,
    default: false,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  number: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Number',
      gridSearchable: true,
    },
  },
  costType: {
    type: String,
    required: true,
    enum: ['Variable', 'Fixed'],
    __lms: {
      csvHeader: 'Cost Type',
      gridSearchable: true,
    },
  },
}, {
  collection: 'expenseAccounts',
  timestamps: true,
});

ExpenseAccountSchema.plugin(mongooseDelete, { overrideMethods: true });
ExpenseAccountSchema.plugin(metadata);
ExpenseAccountSchema.plugin(modified);
ExpenseAccountSchema.plugin(lspData);
ExpenseAccountSchema.plugin(lmsGrid.aggregation());
ExpenseAccountSchema.plugin(importModulePlugin);
ExpenseAccountSchema.index({ lspId: 1, number: 1 }, { unique: true });

module.exports = ExpenseAccountSchema;
