const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const ExternalAPISchema = new Schema({
  name: String,
  options: Object,
}, {
  collection: 'external_apis',
  timestamps: true,
});

ExternalAPISchema.plugin(mongooseDelete, { overrideMethods: true });
ExternalAPISchema.plugin(metadata);
ExternalAPISchema.plugin(modified);
ExternalAPISchema.plugin(lspData);

ExternalAPISchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = ExternalAPISchema;
