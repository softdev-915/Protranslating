const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const MtEngineSchema = new Schema({
  mtProvider: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'MT name',
      gridSearchable: true,
    },
  },
  apiKey: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'API Key',
      gridSearchable: true,
    },
  },
  isEditable: {
    type: Boolean,
    default: true,
  },
}, {
  collection: 'mtEngines',
  timestamps: true,
});

MtEngineSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

MtEngineSchema.set('toJSON', { virtuals: true });

MtEngineSchema.plugin(mongooseDelete, { overrideMethods: true });
MtEngineSchema.plugin(metadata);
MtEngineSchema.plugin(lspData);
MtEngineSchema.plugin(lmsGrid.aggregation());
MtEngineSchema.plugin(importModulePlugin);
MtEngineSchema.index({ lspId: 1, mtProvider: 1 }, { unique: true });
MtEngineSchema.index({ lspId: 1, apiKey: 1 }, { unique: true });

module.exports = MtEngineSchema;
