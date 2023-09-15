const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const WipoDisclaimer = new Schema({
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
  translationOnly: {
    type: Boolean,
  },
  translationAndFilling: {
    type: Boolean,
  },
}, {
  collection: 'ip_wipo_disclaimers',
  timestamps: true,
});

WipoDisclaimer.virtual('readDate').get(function () {
  return this.updatedAt;
});

WipoDisclaimer.set('toJSON', { virtuals: true });

WipoDisclaimer.plugin(mongooseDelete, { overrideMethods: true });
WipoDisclaimer.plugin(metadata);
WipoDisclaimer.plugin(modified);
WipoDisclaimer.plugin(lspData);
WipoDisclaimer.plugin(lmsGrid.aggregation());

module.exports = WipoDisclaimer;
