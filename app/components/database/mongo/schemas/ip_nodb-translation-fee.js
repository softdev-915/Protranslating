const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const NoDBTranslationFee = new Schema({
  country: {
    type: String,
    required: true,
  },
  filingLanguage: {
    type: String,
  },
  translationRate: {
    type: String,
  },
  translationFormula: {
    type: String,
  },
  currencyIsoCode: {
    type: String,
  },
  agencyFee: {
    type: String,
  },
  officialFeeFormulaMath: {
    type: String,
  },
  filingIsoCode: {
    type: String,
  },
  currencyCode: {
    type: String,
  },
}, {
  collection: 'ip_nodb_translation_fees',
  timestamps: true,
});

NoDBTranslationFee.virtual('readDate').get(function () {
  return this.updatedAt;
});

NoDBTranslationFee.set('toJSON', { virtuals: true });

NoDBTranslationFee.plugin(mongooseDelete, { overrideMethods: true });
NoDBTranslationFee.plugin(metadata);
NoDBTranslationFee.plugin(modified);
NoDBTranslationFee.plugin(lspData);
NoDBTranslationFee.plugin(lmsGrid.aggregation());
NoDBTranslationFee.index({ country: 1, lspId: 1 }, { unique: true });

module.exports = NoDBTranslationFee;
