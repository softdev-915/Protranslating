const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const LeadSourceSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'leadSources',
  timestamps: true,
});

// Part of the concurrency check
LeadSourceSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
LeadSourceSchema.set('toJSON', { virtuals: true });

LeadSourceSchema.plugin(mongooseDelete, { overrideMethods: true });
LeadSourceSchema.plugin(metadata);
LeadSourceSchema.plugin(modified);
LeadSourceSchema.plugin(lspData);
LeadSourceSchema.plugin(lmsGrid.aggregation());
LeadSourceSchema.plugin(importModulePlugin);
LeadSourceSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = LeadSourceSchema;
