const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const LanguageSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  isoCode: {
    type: String,
    __lms: {
      csvHeader: 'ISO Code',
      gridSearchable: true,
    },
  },
  cultureCode: {
    type: String,
    __lms: {
      csvHeader: false,
      gridSearchable: false,
    },
  },
}, {
  collection: 'languages',
  timestamps: true,
});

// Part of the basic check
LanguageSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
LanguageSchema.set('toJSON', { virtuals: true });

LanguageSchema.plugin(mongooseDelete, { overrideMethods: true });
LanguageSchema.plugin(metadata);
LanguageSchema.plugin(modified);
LanguageSchema.plugin(lmsGrid.aggregation());
LanguageSchema.plugin(importModulePlugin);

module.exports = LanguageSchema;
