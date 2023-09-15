const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const CertificationSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'certifications',
  timestamps: true,
});

CertificationSchema.index({ lspId: 1, name: 1 }, { unique: true });
CertificationSchema.plugin(mongooseDelete, { overrideMethods: true });
CertificationSchema.plugin(metadata);
CertificationSchema.plugin(modified);
CertificationSchema.plugin(lspData);
CertificationSchema.plugin(lmsGrid.aggregation());
CertificationSchema.plugin(importModulePlugin);

module.exports = CertificationSchema;
