const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const TaxFormSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  taxIdRequired: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Tax ID Required',
      gridSearchable: true,
    },
  },
}, {
  collection: 'taxForms',
  timestamps: true,
});

// Part of the concurrency check
TaxFormSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
TaxFormSchema.set('toJSON', { virtuals: true });

TaxFormSchema.plugin(mongooseDelete, { overrideMethods: true });
TaxFormSchema.plugin(metadata);
TaxFormSchema.plugin(modified);
TaxFormSchema.plugin(lspData);
TaxFormSchema.plugin(lmsGrid.aggregation());
TaxFormSchema.plugin(importModulePlugin);
TaxFormSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = TaxFormSchema;
