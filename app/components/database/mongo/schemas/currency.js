const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const CurrencySchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  isoCode: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'ISO Code',
      gridSearchable: true,
    },
  },
  entity: {
    type: String,
    __lms: {
      csvHeader: 'Entity',
      gridSearchable: true,
    },
  },
  numericCode: {
    type: String,
    __lms: {
      csvHeader: 'Numeric code',
      gridSearchable: true,
    },
  },
  minorUnit: {
    type: String,
    __lms: {
      csvHeader: 'Minor unit',
      gridSearchable: true,
    },
  },
  symbol: {
    type: String,
    default: '',
    __lms: {
      csvHeader: 'Currency Symbol',
    },
  },
}, {
  collection: 'currencies',
  timestamps: true,
});

// Part of the concurrency check
CurrencySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
CurrencySchema.set('toJSON', { virtuals: true });

CurrencySchema.plugin(mongooseDelete, { overrideMethods: true });
CurrencySchema.plugin(metadata);
CurrencySchema.plugin(modified);
CurrencySchema.plugin(lspData);
CurrencySchema.plugin(lmsGrid.aggregation());
CurrencySchema.plugin(importModulePlugin);
CurrencySchema.index({ name: 1, isoCode: 1, lspId: 1 }, { unique: true });

module.exports = CurrencySchema;
