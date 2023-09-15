const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const CompetenceLevelSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'competenceLevels',
  timestamps: true,
});

CompetenceLevelSchema.statics.postSave = function (competenceLevel, modifiedFields, session) {
  if (modifiedFields.indexOf('name') !== -1) {
    return Promise.all([
      mongoose.models.Request.updateCompetenceLevels(competenceLevel, session),
    ]);
  }
};

// Part of the concurrency check
CompetenceLevelSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
CompetenceLevelSchema.set('toJSON', { virtuals: true });

CompetenceLevelSchema.plugin(mongooseDelete, { overrideMethods: true });
CompetenceLevelSchema.plugin(metadata);
CompetenceLevelSchema.plugin(modified);
CompetenceLevelSchema.plugin(lspData);
CompetenceLevelSchema.plugin(lmsGrid.aggregation());
CompetenceLevelSchema.plugin(importModulePlugin);
CompetenceLevelSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = CompetenceLevelSchema;
