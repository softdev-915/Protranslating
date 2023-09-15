const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const EpoDisclaimer = new Schema({
  country: {
    type: [String],
    required: true,
  },
  countries: {
    type: [String],
    default: () => [],
  },
  codes: {
    type: [String],
    default: [],
  },
  filingLanguage: {
    type: String,
    default: '',
  },
  sameTranslation: {
    type: Boolean,
  },
  disclaimer: {
    type: String,
  },
  rule: {
    type: String,
  },
  translationOnly: {
    type: Boolean,
  },
  translationAndFilling: {
    type: Boolean,
  },
}, {
  collection: 'ip_epo_disclaimers',
  timestamps: true,
});

EpoDisclaimer.virtual('readDate').get(function () {
  return this.updatedAt;
});

EpoDisclaimer.set('toJSON', { virtuals: true });

EpoDisclaimer.plugin(mongooseDelete, { overrideMethods: true });
EpoDisclaimer.plugin(metadata);
EpoDisclaimer.plugin(modified);
EpoDisclaimer.plugin(lspData);
EpoDisclaimer.plugin(lmsGrid.aggregation());

module.exports = EpoDisclaimer;
