const { Schema } = require('mongoose');

const PortalCatAnalysisBucket = new Schema({
  numSegments: Number,
  numWords: Number,
  numCharsNoSpaces: Number,
  numCharsWithSpaces: Number,
}, {
  _id: false,
});

const PortalCatTFA = new Schema({
  lspId: Schema.Types.ObjectId,
  companyId: Schema.Types.ObjectId,
  requestId: Schema.Types.ObjectId,
  workflowId: Schema.Types.ObjectId,
  srcLang: String,
  tgtLang: String,
  fileId: Schema.Types.ObjectId,
  fileName: String,
  createdWith: String,
  createdBy: String,
  createdAt: Number,
  totals: PortalCatAnalysisBucket,
  repetitions: PortalCatAnalysisBucket,
  match101: PortalCatAnalysisBucket,
  match100: PortalCatAnalysisBucket,
  match95to99: PortalCatAnalysisBucket,
  match85to94: PortalCatAnalysisBucket,
  match75to84: PortalCatAnalysisBucket,
  noMatch: PortalCatAnalysisBucket,
}, {
  collection: 'pc_tfa',
});

module.exports = PortalCatTFA;
