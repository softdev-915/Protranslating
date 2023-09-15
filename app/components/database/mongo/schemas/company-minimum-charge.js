const { Schema } = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');
const { ObjectId } = Schema;

const LanguageCombinationSchema = new Schema({
  text: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Languages',
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
const CompanyMinimumCharge = new Schema({
  company: {
    _id: {
      type: ObjectId,
      ref: 'Company',
      required: true,
    },
    name: String,
    hierarchy: {
      type: String,
      __lms: {
        csvHeader: 'Company',
        gridSearchable: true,
      },
    },
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
      csvHeader: 'Languages',
      gridSearchable: true,
    },
  },
  minCharge: {
    type: Number,
    required: true,
    __lms: {
      csvHeader: 'Minimum Charge Rate',
      gridSearchable: false,
    },
    validate: {
      validator(value) {
        return value > 0;
      },
      message: 'Minimum charge should be greater than 0',
    },
  },
  currency: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Currency',
    },
    isoCode: {
      type: String,
      __lms: {
        csvHeader: 'Currency',
        gridSearchable: false,
      },
    },
  },
}, {
  collection: 'companyMinimumCharges',
  timestamps: true,
});

// Part of the concurrency check
CompanyMinimumCharge.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
CompanyMinimumCharge.set('toJSON', { virtuals: true });

CompanyMinimumCharge.plugin(mongooseDelete, { overrideMethods: true });
CompanyMinimumCharge.plugin(metadata);
CompanyMinimumCharge.plugin(modified);
CompanyMinimumCharge.plugin(lspData);
CompanyMinimumCharge.plugin(lmsGrid.aggregation());
CompanyMinimumCharge.plugin(importModulePlugin);

module.exports = CompanyMinimumCharge;
