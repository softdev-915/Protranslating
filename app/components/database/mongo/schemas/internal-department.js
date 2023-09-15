const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const InternalDepartmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  accountingDepartmentId: {
    type: String,
    __lms: {
      csvHeader: 'Accounting Department ID',
      gridSearchable: true,
    },
  },
}, {
  collection: 'internalDepartments',
  timestamps: true,
});

InternalDepartmentSchema.statics.postSave = async function (internalDepartment, modifiedFields) {
  if (modifiedFields.indexOf('name') !== -1) {
    return Promise.all([
      mongoose.models.User.updateRateEmbeddedEntities(internalDepartment, 'staffDetails', 'internalDepartment'),
      mongoose.models.User.updateRateEmbeddedEntities(internalDepartment, 'vendorDetails', 'internalDepartment'),
      mongoose.models.Request.updateEmbeddedEntity(internalDepartment, 'internalDepartment'),
      mongoose.models.Company.updateInternalDepartments(internalDepartment),
    ]);
  }
};

// Part of the concurrency check
InternalDepartmentSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
InternalDepartmentSchema.set('toJSON', { virtuals: true });

InternalDepartmentSchema.plugin(mongooseDelete, { overrideMethods: true });
InternalDepartmentSchema.plugin(metadata);
InternalDepartmentSchema.plugin(modified);
InternalDepartmentSchema.plugin(lspData);
InternalDepartmentSchema.plugin(lmsGrid.aggregation());
InternalDepartmentSchema.plugin(importModulePlugin);
InternalDepartmentSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = InternalDepartmentSchema;
