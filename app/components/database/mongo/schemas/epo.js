const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');

const EPOSchema = new mongoose.Schema({
  sourceLanguage: String,
  patentPublicationNumber: { type: String, index: true },
  patentPublicationDate: Date,
  patentApplicationNumber: { type: String, index: true },
  kind: String,
  descriptionWordCount: Number,
  numberOfClaims: Number,
  claimWordCount: Number,
  title: String,
  validationDeadline: Date,
  communicationOfIntentionDate: Date,
  descriptionPageCount: Number,
  claimsPageCount: Number,
  drawingsPageCount: Number,
  applicantName: String,
}, {
  collection: 'epo',
  timestamps: true,
});

EPOSchema.plugin(mongooseDelete, { overrideMethods: true });
EPOSchema.plugin(metadata);
EPOSchema.plugin(modified);
EPOSchema.plugin(lspData);
EPOSchema.plugin(lmsGrid.aggregation());

module.exports = EPOSchema;
