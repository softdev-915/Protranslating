// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const Schema = mongoose.Schema;
const IpEpoClaimsTranslationFees = new Schema({
  sourceLanguageIsoCode: {
    type: String,
    required: true,
  },
  targetLanguageIsoCode: {
    type: String,
    required: true,
  },
  formula: {
    type: String,
    default: '',
  },
}, {
  collection: 'ipEpoClaimsTranslationFees',
  timestamps: true,
});

IpEpoClaimsTranslationFees.virtual('readDate').get(function () {
  return this.updatedAt;
});

IpEpoClaimsTranslationFees.set('toJSON', { virtuals: true });

IpEpoClaimsTranslationFees.plugin(mongooseDelete, { overrideMethods: true });
IpEpoClaimsTranslationFees.plugin(metadata);
IpEpoClaimsTranslationFees.plugin(modified);
IpEpoClaimsTranslationFees.plugin(lspData);
IpEpoClaimsTranslationFees.plugin(lmsGrid.aggregation());
IpEpoClaimsTranslationFees.index({
  sourceLanguageIsoCode: 1,
  targetLanguageIsoCode: 1,
  lspId: 1,
}, { unique: true });

module.exports = IpEpoClaimsTranslationFees;
