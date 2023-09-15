const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const BillingTermSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  days: {
    type: Number,
    __lms: {
      csvHeader: 'Days',
      gridSearchable: true,
    },
  },
}, {
  collection: 'billingTerms',
  timestamps: true,
});

// Part of the concurrency check
BillingTermSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
BillingTermSchema.set('toJSON', { virtuals: true });

BillingTermSchema.plugin(mongooseDelete, { overrideMethods: true });
BillingTermSchema.plugin(metadata);
BillingTermSchema.plugin(modified);
BillingTermSchema.plugin(lspData);
BillingTermSchema.plugin(lmsGrid.aggregation());
BillingTermSchema.plugin(importModulePlugin);
BillingTermSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = BillingTermSchema;
