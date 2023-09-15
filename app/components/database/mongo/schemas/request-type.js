const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const RequestTypeSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'requestTypes',
  timestamps: true,
});

RequestTypeSchema.pre('save', async function () {
  const RequestType = this.model('RequestType');
  const query = {
    lspId: this.lspId,
  };

  if (!this.isNew) {
    query._id = { $ne: this._id };
  }
  query.name = this.name;
  const results = await RequestType.find(query);

  if (results.length > 0) {
    throw new Error(`Duplicated request type with name: "${this.name}"`);
  }
});

RequestTypeSchema.statics.postSave = async function (requestType, modifiedFields) {
  if (modifiedFields.indexOf('name') !== -1) {
    requestType.model('Request').updateMany({
      'requestType._id': requestType._id,
      lspId: requestType.lspId,
    }, {
      $set: {
        'requestType.name': requestType.name,
      },
    });
  }
};

// Part of the basic check
RequestTypeSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
RequestTypeSchema.set('toJSON', { virtuals: true });

RequestTypeSchema.plugin(mongooseDelete, { overrideMethods: true });
RequestTypeSchema.plugin(metadata);
RequestTypeSchema.plugin(modified);
RequestTypeSchema.plugin(lspData);
RequestTypeSchema.plugin(lmsGrid.aggregation());
RequestTypeSchema.plugin(importModulePlugin);

module.exports = RequestTypeSchema;
