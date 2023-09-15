// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const Schema = mongoose.Schema;
const FooterTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  description: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Description',
      gridSearchable: true,
    },
  },
}, {
  collection: 'footerTemplates',
  timestamps: true,
});

// Part of the concurrency check
FooterTemplateSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
FooterTemplateSchema.set('toJSON', { virtuals: true });

FooterTemplateSchema.plugin(mongooseDelete, { overrideMethods: true });
FooterTemplateSchema.plugin(metadata);
FooterTemplateSchema.plugin(modified);
FooterTemplateSchema.plugin(lspData);
FooterTemplateSchema.plugin(lmsGrid.aggregation());
FooterTemplateSchema.plugin(importModulePlugin);
FooterTemplateSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = FooterTemplateSchema;
