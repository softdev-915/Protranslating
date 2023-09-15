// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const Schema = mongoose.Schema;
const IpInstructionsDeadlineSchema = new Schema({
  totalOrClaimsWordCount: {
    type: String,
    required: true,
    __lms: {
      gridSearchable: true,
    },
  },
  noticePeriod: {
    type: String,
    required: true,
    __lms: {
      gridSearchable: true,
    },
  },
}, {
  collection: 'ipInstructionsDeadlines',
  timestamps: true,
});

// Part of the concurrency check
IpInstructionsDeadlineSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
IpInstructionsDeadlineSchema.set('toJSON', { virtuals: true });

IpInstructionsDeadlineSchema.plugin(mongooseDelete, { overrideMethods: true });
IpInstructionsDeadlineSchema.plugin(metadata);
IpInstructionsDeadlineSchema.plugin(modified);
IpInstructionsDeadlineSchema.plugin(lspData);
IpInstructionsDeadlineSchema.plugin(lmsGrid.aggregation());
IpInstructionsDeadlineSchema.plugin(importModulePlugin);

IpInstructionsDeadlineSchema.index({ lspId: 1, totalOrClaimsWordCount: 1 }, { unique: true });

module.exports = IpInstructionsDeadlineSchema;
