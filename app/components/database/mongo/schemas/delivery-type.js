// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const Schema = mongoose.Schema;
const DeliveryTypeSchema = new Schema({
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
  serviceTypeId: {
    type: Schema.ObjectId,
    ref: 'ServiceType',
  },
}, {
  collection: 'deliveryTypes',
  timestamps: true,
});

// Part of the concurrency check
DeliveryTypeSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
DeliveryTypeSchema.set('toJSON', { virtuals: true });

DeliveryTypeSchema.plugin(mongooseDelete, { overrideMethods: true });
DeliveryTypeSchema.plugin(metadata);
DeliveryTypeSchema.plugin(modified);
DeliveryTypeSchema.plugin(lspData);
DeliveryTypeSchema.plugin(lmsGrid.aggregation());
DeliveryTypeSchema.plugin(importModulePlugin);
DeliveryTypeSchema.index({ lspId: 1, name: 1, serviceTypeId: 1 }, { unique: true });

module.exports = DeliveryTypeSchema;
