const mongoose = require('mongoose');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const ExternalResourceSchema = new Schema({
  html: {
    type: String,
  },
}, {
  collection: 'externalResources',
  timestamps: true,
});

ExternalResourceSchema.plugin(metadata);
ExternalResourceSchema.plugin(modified);
ExternalResourceSchema.plugin(lspData);
ExternalResourceSchema.index({ lspId: 1 }, { unique: true });

module.exports = ExternalResourceSchema;
