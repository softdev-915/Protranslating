const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const SoftwareRequirementSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'softwareRequirements',
  timestamps: true,
});

// Part of the concurrency check
SoftwareRequirementSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
SoftwareRequirementSchema.set('toJSON', { virtuals: true });

SoftwareRequirementSchema.plugin(mongooseDelete, { overrideMethods: true });
SoftwareRequirementSchema.plugin(metadata);
SoftwareRequirementSchema.plugin(lspData);
SoftwareRequirementSchema.plugin(modified);
SoftwareRequirementSchema.plugin(lmsGrid.aggregation());
SoftwareRequirementSchema.plugin(importModulePlugin);
SoftwareRequirementSchema.index({ lspId: 1, name: 1 }, { unique: true });

SoftwareRequirementSchema.statics.postSave = async function (softwareRequirements, modifiedFields) {
  if (modifiedFields.indexOf('name') !== -1) {
    return mongoose.models.Request.updateArrayEmbeddedEntity(softwareRequirements, 'softwareRequirements');
  }
};

module.exports = SoftwareRequirementSchema;
