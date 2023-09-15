const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const NoDBCountrySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  iq: {
    type: Boolean,
    default: false,
  },
  entities: {
    type: Array,
    default: [],
  },
}, {
  collection: 'ip_nodb_countries',
  timestamps: true,
});

NoDBCountrySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

NoDBCountrySchema.set('toJSON', { virtuals: true });

NoDBCountrySchema.plugin(mongooseDelete, { overrideMethods: true });
NoDBCountrySchema.plugin(metadata);
NoDBCountrySchema.plugin(modified);
NoDBCountrySchema.plugin(lspData);
NoDBCountrySchema.plugin(lmsGrid.aggregation());
NoDBCountrySchema.index({ name: 1, code: 1, lspId: 1 }, { unique: true });

module.exports = NoDBCountrySchema;
