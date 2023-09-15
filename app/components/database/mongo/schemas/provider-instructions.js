const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const Schema = mongoose.Schema;
const ProviderInstructionsSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  body: {
    type: String,
    __lms: {
      csvHeader: 'Body',
      gridSearchable: true,
    },
  },
}, {
  collection: 'providersInstructions',
  timestamps: true,
});

// Part of the concurrency check
ProviderInstructionsSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
ProviderInstructionsSchema.set('toJSON', { virtuals: true });

ProviderInstructionsSchema.plugin(mongooseDelete, { overrideMethods: true });
ProviderInstructionsSchema.plugin(metadata);
ProviderInstructionsSchema.plugin(modified);
ProviderInstructionsSchema.plugin(lspData);
ProviderInstructionsSchema.plugin(lmsGrid.aggregation());
ProviderInstructionsSchema.plugin(importModulePlugin);
ProviderInstructionsSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = ProviderInstructionsSchema;
