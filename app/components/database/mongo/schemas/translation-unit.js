const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const TranslationUnitSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'translationUnits',
  timestamps: true,
});

// Part of the concurrency check
TranslationUnitSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
TranslationUnitSchema.set('toJSON', { virtuals: true });

TranslationUnitSchema.plugin(mongooseDelete, { overrideMethods: true });
TranslationUnitSchema.plugin(metadata);
TranslationUnitSchema.plugin(modified);
TranslationUnitSchema.plugin(lspData);
TranslationUnitSchema.plugin(lmsGrid.aggregation());
TranslationUnitSchema.plugin(importModulePlugin);
TranslationUnitSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = TranslationUnitSchema;
