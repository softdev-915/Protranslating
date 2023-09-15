const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const SchedulingStatusSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'schedulingStatuses',
  timestamps: true,
});

SchedulingStatusSchema.pre('save', async function () {
  const SchedulingStatus = this.model('SchedulingStatus');
  const query = {
    lspId: this.lspId,
  };

  if (!this.isNew) {
    query._id = { $ne: this._id };
  }
  query.name = this.name;
  const results = await SchedulingStatus.find(query);

  if (results.length > 0) {
    throw new Error(`Duplicated scheduling status with name: "${this.name}"`);
  }
});

SchedulingStatusSchema.statics.postSave = async function (schedulingStatus, modifiedFields) {
  if (modifiedFields.indexOf('name') !== -1) {
    schedulingStatus.model('Request').updateMany({
      'schedulingStatus._id': schedulingStatus._id,
      lspId: schedulingStatus.lspId,
    }, {
      $set: {
        'schedulingStatus.name': schedulingStatus.name,
      },
    });
  }
};

// Part of the basic check
SchedulingStatusSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
SchedulingStatusSchema.set('toJSON', { virtuals: true });

SchedulingStatusSchema.plugin(mongooseDelete, { overrideMethods: true });
SchedulingStatusSchema.plugin(metadata);
SchedulingStatusSchema.plugin(modified);
SchedulingStatusSchema.plugin(lspData);
SchedulingStatusSchema.plugin(lmsGrid.aggregation());
SchedulingStatusSchema.plugin(importModulePlugin);

module.exports = SchedulingStatusSchema;
