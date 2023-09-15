const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const LanguageCombinationSchema = new Schema({
  text: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Language Combinations',
      gridSearchable: false,
      csvProp: 'languageCombinations',
    },
  },
  value: [{
    text: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  }],
}, { _id: false });
const VendorMinimumChargeSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
    ref: 'User',
    required: true,
  },
  ability: {
    _id: { type: Schema.ObjectId, ref: 'Ability' },
    name: {
      type: String,
      __lms: {
        csvHeader: 'Ability',
        gridSearchable: true,
      },
    },
  },
  languageCombinations: {
    type: [LanguageCombinationSchema],
    __lms: {
      csvHeader: 'Language Combinations',
      gridSearchable: true,
    },
  },
  rate: {
    type: Number,
    __lms: {
      csvHeader: 'Rate',
      gridSearchable: false,
    },
    required: true,
    min: [0, 'Vendor Minimum Charge Rate cannot be negative'],
  },
}, {
  collection: 'vendorMinimumCharges',
  timestamps: true,
});

VendorMinimumChargeSchema.plugin(mongooseDelete, { overrideMethods: true });
VendorMinimumChargeSchema.plugin(metadata);
VendorMinimumChargeSchema.plugin(modified);
VendorMinimumChargeSchema.plugin(lspData);
VendorMinimumChargeSchema.plugin(lmsGrid.aggregation());
VendorMinimumChargeSchema.plugin(importModulePlugin);

VendorMinimumChargeSchema.virtual('vendor.name').get(function () {
  return `${this.vendor.firstName} ${this.vendor.lastName}`;
});

module.exports = VendorMinimumChargeSchema;
