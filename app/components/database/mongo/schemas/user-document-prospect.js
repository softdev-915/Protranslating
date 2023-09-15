const mongoose = require('mongoose');

const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const UserDocumentProspectSchema = new Schema({
  name: String,
  mime: String,
  encoding: String,
  size: Number,
  userId: String,
  fileType: {
    type: String,
    enum: [
      'Agreement/Disclosure',
      'CV/Resume/Certification',
      'Technical Evaluation',
      'Tax Form',
      'Audit/Escalation Form',
      'Change of Information',
      'Other',
    ],
  },
  uploadDate: Date,
  version: Number,
}, {
  collection: 'userDocumentProspects',
  timestamps: true,
});

UserDocumentProspectSchema.plugin(mongooseDelete, { overrideMethods: true });
UserDocumentProspectSchema.plugin(metadata);
UserDocumentProspectSchema.plugin(modified);
UserDocumentProspectSchema.plugin(lspData);
UserDocumentProspectSchema.plugin(importModulePlugin);

module.exports = UserDocumentProspectSchema;
