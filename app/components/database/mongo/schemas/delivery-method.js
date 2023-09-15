const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const DeliveryMethodSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'deliveryMethods',
  timestamps: true,
});

// Part of the concurrency check
DeliveryMethodSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
DeliveryMethodSchema.set('toJSON', { virtuals: true });

DeliveryMethodSchema.plugin(mongooseDelete, { overrideMethods: true });
DeliveryMethodSchema.plugin(metadata);
DeliveryMethodSchema.plugin(lspData);
DeliveryMethodSchema.plugin(modified);
DeliveryMethodSchema.plugin(lmsGrid.aggregation());
DeliveryMethodSchema.plugin(importModulePlugin);
DeliveryMethodSchema.index({ lspId: 1, name: 1 }, { unique: true });

DeliveryMethodSchema.statics.postSave = async function (deliveryMethod, modifiedFields) {
  if (modifiedFields.indexOf('name') !== -1) {
    return mongoose.models.Request.updateEmbeddedEntity(deliveryMethod, 'deliveryMethod');
  }
};

module.exports = DeliveryMethodSchema;
