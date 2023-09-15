const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const WipoTranslationFee = new Schema({
  country: {
    type: String,
    required: true,
  },
  filingLanguage: {
    type: String,
  },
  filingLanguageIso: {
    type: String,
  },
  enTranslationRate: {
    type: String,
  },
  frTranslationRate: {
    type: String,
  },
  deTranslationRate: {
    type: String,
  },
  translationFormula: {
    type: String,
  },
  deTranslationFormula: {
    type: String,
  },
  frTranslationFormula: {
    type: String,
  },
  agencyFeeFlat: {
    type: String,
  },
  agencyFeeFormula: {
    type: String,
  },
  officialFeeFormula: {
    type: String,
  },
  officialFeeFormulaMath: {
    type: String,
  },
  officialFeeAlsoWrittenAs: {
    type: String,
  },
  currencyCode: {
    type: String,
  },
}, {
  collection: 'ip_wipo_translation_fees',
  timestamps: true,
});

WipoTranslationFee.virtual('readDate').get(function () {
  return this.updatedAt;
});

WipoTranslationFee.set('toJSON', { virtuals: true });

WipoTranslationFee.plugin(mongooseDelete, { overrideMethods: true });
WipoTranslationFee.plugin(metadata);
WipoTranslationFee.plugin(modified);
WipoTranslationFee.plugin(lspData);
WipoTranslationFee.plugin(lmsGrid.aggregation());
WipoTranslationFee.index({ country: 1, lspId: 1 }, { unique: true });

module.exports = WipoTranslationFee;
