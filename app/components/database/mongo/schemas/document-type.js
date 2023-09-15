const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const DocumentTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  extensions: {
    type: String,
    __lms: {
      csvHeader: 'Extensions',
      gridSearchable: true,
    },
  },
}, {
  collection: 'documentTypes',
  timestamps: true,
});

// Part of the concurrency check
DocumentTypeSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
DocumentTypeSchema.set('toJSON', { virtuals: true });

DocumentTypeSchema.plugin(mongooseDelete, { overrideMethods: true });
DocumentTypeSchema.plugin(metadata);
DocumentTypeSchema.plugin(lspData);
DocumentTypeSchema.plugin(modified);
DocumentTypeSchema.plugin(lmsGrid.aggregation());
DocumentTypeSchema.plugin(importModulePlugin);
DocumentTypeSchema.index({ lspId: 1, name: 1 }, { unique: true });

DocumentTypeSchema.methods.updateEmbeddedEntities = function () {
  return this.updateRequestEmbeddedEntities();
};

DocumentTypeSchema.methods.updateRequestEmbeddedEntities = function () {
  return Promise.resolve()
    .then(() => mongoose.models.Request.updateArrayEmbeddedEntity(this, 'documentTypes'))
    .catch((err) => {
      const message = err.message || err;

      throw new Error(`An error ocurred upon updating document type embedded entities in requests: ${message}`);
    });
};

module.exports = DocumentTypeSchema;
