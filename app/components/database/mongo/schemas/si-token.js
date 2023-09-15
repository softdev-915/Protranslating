const mongoose = require('mongoose');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const SiTokenSchema = new Schema({
  location: { type: String, required: true },
  sessionId: String,
  endpoint: String,
}, { collection: 'siToken' });

SiTokenSchema.plugin(metadata);
SiTokenSchema.plugin(lspData);

module.exports = SiTokenSchema;
