const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');

const WIPOSchema = new mongoose.Schema(
  {
    created_at: String,
    updated_at: String,
    filePath: String,
    sourceLanguage: String,
    numberOfPriorityClaims: Number,
    filingDate: String,
    filingDate30: String,
    filingDate45: String,
    filingDate60: String,
    earliestPriorityClaimDate: String,
    thirtyMonthsDeadline: String,
    patentPublicationNumber: { type: String, index: true },
    pctReference: { type: String, index: true },
    title: String,
    abstractContent: String,
    abstractWordCount: Number,
    applicantName: String,
    applicantAddress1: String,
    applicantAddress2: String,
    applicantCity: String,
    applicantState: String,
    applicantPostalCode: String,
    applicantCountryCode: String,
    agentName: String,
    agentAddress1: String,
    agentAddress2: String,
    agentCity: String,
    agentState: String,
    agentPostalCode: String,
    agentCountryCode: String,
    descriptionWordCount: Number,
    numberOfClaims: Number,
    claimsWordCount: Number,
    numberOfDrawings: Number,
    numberOfDrawingsPages: Number,
    totalWords: Number,
    noticePeriodforProspecting: String,
    numberTotalPages: Number,
    estTotalPages: Number,
    numberOfPagesKindCode: String,
    numberOfClaimsKindCode: String,
  },
  {
    collection: 'wipo',
    timestamps: true,
  },
);

WIPOSchema.plugin(mongooseDelete, { overrideMethods: true });
WIPOSchema.plugin(metadata);
WIPOSchema.plugin(modified);
WIPOSchema.plugin(lspData);
WIPOSchema.plugin(lmsGrid.aggregation());

module.exports = WIPOSchema;
