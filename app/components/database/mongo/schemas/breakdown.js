const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const BreakdownSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'breakdowns',
  timestamps: true,
});

// Part of the concurrency check
BreakdownSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
BreakdownSchema.set('toJSON', { virtuals: true });

BreakdownSchema.plugin(mongooseDelete, { overrideMethods: true });
BreakdownSchema.plugin(metadata);
BreakdownSchema.plugin(modified);
BreakdownSchema.plugin(lspData);
BreakdownSchema.plugin(lmsGrid.aggregation());
BreakdownSchema.plugin(importModulePlugin);
BreakdownSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = BreakdownSchema;
