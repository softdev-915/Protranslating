const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const CatToolSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
}, {
  collection: 'catTool',
  timestamps: true,
});

// Part of the concurrency check
CatToolSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
CatToolSchema.set('toJSON', { virtuals: true });

CatToolSchema.index({ lspId: 1, name: 1 }, {
  unique: true,
  name: 'uniqueName',
  collation: {
    locale: 'en',
    // Added this because we needed the uniqueness to be case insensitive
    // strength: 1 => Primary level of comparison see: https://docs.mongodb.com/manual/reference/collation/
    strength: 1,
  },
});
CatToolSchema.plugin(mongooseDelete, { overrideMethods: true });
CatToolSchema.plugin(metadata);
CatToolSchema.plugin(modified);
CatToolSchema.plugin(lspData);
CatToolSchema.plugin(importModulePlugin);
CatToolSchema.plugin(lmsGrid.aggregation());

module.exports = CatToolSchema;
