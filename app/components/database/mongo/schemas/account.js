const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const AccountSchema = new Schema({
  no: {
    type: Number,
    required: true,
    __lms: {
      csvHeader: 'Number',
      gridSearchable: true,
    },
  },
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  system: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'accounts',
  timestamps: true,
  toJSON: { virtuals: true },
});

AccountSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

AccountSchema.plugin(mongooseDelete, { overrideMethods: true });
AccountSchema.plugin(metadata);
AccountSchema.plugin(modified);
AccountSchema.plugin(lspData);
AccountSchema.plugin(lmsGrid.aggregation());
AccountSchema.plugin(importModulePlugin);

AccountSchema.index({ lspId: 1, no: 1 }, { unique: true });
AccountSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = AccountSchema;
