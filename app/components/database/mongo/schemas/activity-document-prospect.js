const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const ActivityDocumentProspectSchema = new Schema({
  name: String,
  mime: String,
  encoding: String,
  size: Number,
  activityId: String,
  uploadDate: Date,
  version: Number,
}, {
  collection: 'activityDocumentProspects',
  timestamps: true,
});

ActivityDocumentProspectSchema.plugin(mongooseDelete, { overrideMethods: true });
ActivityDocumentProspectSchema.plugin(metadata);
ActivityDocumentProspectSchema.plugin(modified);
ActivityDocumentProspectSchema.plugin(lspData);

module.exports = ActivityDocumentProspectSchema;
