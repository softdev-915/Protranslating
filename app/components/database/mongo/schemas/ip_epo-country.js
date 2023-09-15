const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const EpoCountrySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  memberState: {
    type: Boolean,
    default: false,
  },
  validationState: {
    type: Boolean,
    default: false,
  },
  extensionState: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'ip_epo_countries',
  timestamps: true,
});

EpoCountrySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

EpoCountrySchema.set('toJSON', { virtuals: true });

EpoCountrySchema.plugin(mongooseDelete, { overrideMethods: true });
EpoCountrySchema.plugin(metadata);
EpoCountrySchema.plugin(modified);
EpoCountrySchema.plugin(lspData);
EpoCountrySchema.plugin(lmsGrid.aggregation());
EpoCountrySchema.index({ name: 1, code: 1, lspId: 1 }, { unique: true });

module.exports = EpoCountrySchema;
