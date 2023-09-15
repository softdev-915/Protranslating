const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const ActivityTagSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'activityTags',
  timestamps: true,
});

// Part of the concurrency check
ActivityTagSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
ActivityTagSchema.set('toJSON', { virtuals: true });

ActivityTagSchema.plugin(mongooseDelete, { overrideMethods: true });
ActivityTagSchema.plugin(metadata);
ActivityTagSchema.plugin(modified);
ActivityTagSchema.plugin(lspData);
ActivityTagSchema.plugin(lmsGrid.aggregation());
ActivityTagSchema.plugin(importModulePlugin);
ActivityTagSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = ActivityTagSchema;
