const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const AbilitySchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  description: {
    type: String,
    __lms: {
      csvHeader: 'Description',
      gridSearchable: true,
    },
  },
  glAccountNo: {
    type: String,
    __lms: {
      csvHeader: 'Revenue GL Account Number',
      gridSearchable: true,
    },
  },
  languageCombination: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Language Combination Required',
      gridSearchable: true,
    },
  },
  catTool: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Tool Required',
      gridSearchable: true,
    },
  },
  competenceLevelRequired: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Competence Level Required',
      gridSearchable: true,
    },
  },
  companyRequired: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Company Required',
      gridSearchable: true,
    },
  },
  internalDepartmentRequired: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Internal Department Required',
      gridSearchable: true,
    },
  },
}, {
  collection: 'abilities',
  timestamps: true,
});

// Part of the concurrency check
AbilitySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
AbilitySchema.set('toJSON', { virtuals: true });

AbilitySchema.plugin(mongooseDelete, { overrideMethods: true });
AbilitySchema.plugin(metadata);
AbilitySchema.plugin(modified);
AbilitySchema.plugin(lspData);
AbilitySchema.plugin(lmsGrid.aggregation());
AbilitySchema.plugin(importModulePlugin);
AbilitySchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = AbilitySchema;
