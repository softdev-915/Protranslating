const { Schema } = require('mongoose');

const { Types: { ObjectId, Mixed } } = Schema;
const PortalCatTmMatchInfo = new Schema({
  matchType: {
    type: String,
    enum: [
      'ACCEPTED',
      'HUMAN_RECOMMENDED',
      'EXACT_UNIQUE_ID',
      'EXACT_PREVIOUS_VERSION',
      'EXACT_LOCAL_CONTEXT',
      'EXACT_DOCUMENT_CONTEXT',
      'EXACT_STRUCTURAL',
      'EXACT',
      'EXACT_TEXT_ONLY_UNIQUE_ID',
      'EXACT_TEXT_ONLY_PREVIOUS_VERSION',
      'EXACT_TEXT_ONLY',
      'EXACT_REPAIRED',
      'FUZZY_UNIQUE_ID',
      'FUZZY_PREVIOUS_VERSION',
      'FUZZY',
      'FUZZY_REPAIRED',
      'PHRASE_ASSEMBLED',
      'CONCORDANCE',
      'UNKNOWN'],
    default: 'UNKNOWN',
  },
  score: {
    type: Number,
    min: 0,
    max: 101,
  },
  tmId: Schema.Types.ObjectId,
  tmName: String,
  matchedAt: String,
  altTranslations: [Schema.Types.ObjectId],
  customProperties: [Mixed],
}, {
  _id: false,
});

const PortalCatInlineTag = new Schema({
  id: Number,
  position: Number,
  userDefined: Boolean,
  type: String,
  function: {
    type: String,
    enum: ['OPENING', 'CLOSING', 'PLACEHOLDER'],
    default: 'PLACEHOLDER',
  },
  data: String,
  outerData: String,
  flag: Number,
  displayText: String,
  originalId: String,
}, {
  _id: false,
});

const PortalCatTFSH = new Schema({
  originalId: ObjectId,
  lspId: ObjectId,
  companyId: ObjectId,
  requestId: ObjectId,
  workflowId: ObjectId,
  taskId: ObjectId,
  taskName: String,
  srcLang: String,
  tgtLang: String,
  fileId: ObjectId,
  fileName: String,
  source: {
    inlineTags: [PortalCatInlineTag],
    lang: String,
    text: String,
    textWithTags: String,
  },
  target: {
    inlineTags: [PortalCatInlineTag],
    lang: String,
    text: String,
    textWithTags: String,
  },
  note: String,
  number: Number,
  tuId: String,
  segId: String,
  createdWith: String,
  createdBy: String,
  createdAt: Date,
  origin: {
    type: String,
    enum: ['MT', 'HT', 'TM'],
    default: 'HT',
  },
  matched: Boolean,
  merged: Boolean,
  split: Boolean,
  confirmed: Boolean,
  locked: Boolean,
  tmMatchInfo: PortalCatTmMatchInfo,
  splitFromSegment: ObjectId,
  mergedFromSegments: [ObjectId],
  absoluteLevenshtein: Number,
  relativeLevenshtein: Number,
  customProperties: [Mixed],
}, {
  collection: 'pc_tfsh',
  timestamps: true,
});

module.exports = PortalCatTFSH;
