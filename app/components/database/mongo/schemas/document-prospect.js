const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const DocumentProspectSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  ip: {
    type: String,
  },
  name: String,
  mime: String,
  encoding: String,
  cloudKey: String,
  size: Number,
  internal: {
    type: Boolean,
    default: false,
  },
  fileMetadata: Schema.Types.Mixed,
}, {
  collection: 'documentProspects',
  timestamps: true,
});

DocumentProspectSchema.plugin(mongooseDelete, { overrideMethods: true });
DocumentProspectSchema.plugin(metadata);
DocumentProspectSchema.plugin(modified);
DocumentProspectSchema.plugin(lspData);

module.exports = DocumentProspectSchema;
