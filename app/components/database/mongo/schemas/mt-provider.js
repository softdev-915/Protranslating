const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');

const { Schema } = mongoose;
const MTProviderSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'mtProviders',
  timestamps: true,
});

MTProviderSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

MTProviderSchema.set('toJSON', { virtuals: true });

MTProviderSchema.plugin(mongooseDelete, { overrideMethods: true });
MTProviderSchema.plugin(metadata);
MTProviderSchema.plugin(lspData);
MTProviderSchema.plugin(lmsGrid.aggregation());
MTProviderSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = MTProviderSchema;
