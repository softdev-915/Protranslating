const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const EpoTranslationFee = new Schema({
  country: {
    type: String,
    required: true,
  },
  officialFilingLanguage: {
    type: String,
  },
  officialFilingLanguageIsoCode: {
    type: String,
    default: '',
  },
  agencyFeeFixed: {
    type: String,
  },
  agencyFeeFormula: {
    type: String,
  },
  translationRate: {
    type: String,
  },
  translationRateFr: {
    type: String,
  },
  translationRateDe: {
    type: String,
  },
  enTranslationFormula: {
    type: String,
  },
  deTranslationFormula: {
    type: String,
  },
  frTranslationFormula: {
    type: String,
  },
  deEngTranslationOfDescriptionRequired: {
    type: String,
  },
  frEngTranslationOfDescriptionRequired: {
    type: String,
  },
  officialFeeFormula: {
    type: {
      fixedFee: Number,
      formulaProperties: {
        type: Array,
        default: [],
      },
      fixedFeeLimit: Number,
      overLimitFee: Number,
    },
  },
  currencyCode: {
    type: String,
  },
}, {
  collection: 'ip_epo_translation_fees',
  timestamps: true,
});

EpoTranslationFee.virtual('readDate').get(function () {
  return this.updatedAt;
});

EpoTranslationFee.set('toJSON', { virtuals: true });

EpoTranslationFee.plugin(mongooseDelete, { overrideMethods: true });
EpoTranslationFee.plugin(metadata);
EpoTranslationFee.plugin(modified);
EpoTranslationFee.plugin(lspData);
EpoTranslationFee.plugin(lmsGrid.aggregation());
EpoTranslationFee.index({ country: 1, lspId: 1 }, { unique: true });

module.exports = EpoTranslationFee;
