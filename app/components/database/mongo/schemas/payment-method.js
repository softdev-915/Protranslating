const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const PaymentMethodSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'paymentMethods',
  timestamps: true,
});

// Part of the concurrency check
PaymentMethodSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
PaymentMethodSchema.set('toJSON', { virtuals: true });

PaymentMethodSchema.plugin(mongooseDelete, { overrideMethods: true });
PaymentMethodSchema.plugin(metadata);
PaymentMethodSchema.plugin(modified);
PaymentMethodSchema.plugin(lspData);
PaymentMethodSchema.plugin(lmsGrid.aggregation());
PaymentMethodSchema.plugin(importModulePlugin);
PaymentMethodSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = PaymentMethodSchema;
