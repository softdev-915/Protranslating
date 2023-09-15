const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const NoDBDisclaimer = new Schema({
  country: {
    type: String,
    required: true,
  },
  codes: {
    type: [String],
    default: [],
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
  filingLanguage: {
    type: String,
  },
  translationOnly: {
    type: Boolean,
  },
  translationAndFilling: {
    type: Boolean,
  },
}, {
  collection: 'ip_nodb_disclaimers',
  timestamps: true,
});

NoDBDisclaimer.virtual('readDate').get(function () {
  return this.updatedAt;
});

NoDBDisclaimer.set('toJSON', { virtuals: true });

NoDBDisclaimer.plugin(mongooseDelete, { overrideMethods: true });
NoDBDisclaimer.plugin(metadata);
NoDBDisclaimer.plugin(modified);
NoDBDisclaimer.plugin(lspData);
NoDBDisclaimer.plugin(lmsGrid.aggregation());

module.exports = NoDBDisclaimer;
