const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const AssignmentStatusSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'assignmentStatus',
  timestamps: true,
});

// Part of the concurrency check
AssignmentStatusSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
AssignmentStatusSchema.set('toJSON', { virtuals: true });

AssignmentStatusSchema.plugin(mongooseDelete, { overrideMethods: true });
AssignmentStatusSchema.plugin(metadata);
AssignmentStatusSchema.plugin(lspData);
AssignmentStatusSchema.plugin(modified);
AssignmentStatusSchema.plugin(lmsGrid.aggregation());
AssignmentStatusSchema.plugin(importModulePlugin);
AssignmentStatusSchema.index({ lspId: 1, name: 1 }, { unique: true });

AssignmentStatusSchema.statics.postSave = async function (assignmentStatus, modifiedFields) {
  if (modifiedFields.indexOf('name') !== -1) {
    return mongoose.models.Request.updateEmbeddedEntity(assignmentStatus, 'assignmentStatus');
  }
};

module.exports = AssignmentStatusSchema;
