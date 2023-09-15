// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const Schema = mongoose.Schema;
const ServiceTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  description: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Description',
      gridSearchable: true,
    },
  },
}, {
  collection: 'serviceTypes',
  timestamps: true,
});

// Part of the concurrency check
ServiceTypeSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
ServiceTypeSchema.set('toJSON', { virtuals: true });

ServiceTypeSchema.plugin(mongooseDelete, { overrideMethods: true });
ServiceTypeSchema.plugin(metadata);
ServiceTypeSchema.plugin(modified);
ServiceTypeSchema.plugin(lspData);
ServiceTypeSchema.plugin(lmsGrid.aggregation());
ServiceTypeSchema.plugin(importModulePlugin);
ServiceTypeSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = ServiceTypeSchema;
