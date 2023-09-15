// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const LanguageSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  isoCode: {
    type: String,
    required: true,
  },
}, { _id: false });

const MTModelSchema = new Schema({
  code: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Code',
      gridSearchable: true,
    },
  },
  lastTrainedAt: {
    type: Date,
    required: true,
    __lms: {
      csvHeader: 'Date',
      gridSearchable: true,
    },
  },
  sourceLanguage: {
    type: LanguageSchema,
    required: true,
    __lms: {
      csvHeader: 'Source Language',
      gridSearchable: true,
    },
  },
  targetLanguage: {
    type: LanguageSchema,
    required: true,
    __lms: {
      csvHeader: 'Target Language',
      gridSearchable: true,
    },
  },
  isGeneral: {
    type: Boolean,
    required: true,
    __lms: {
      csvHeader: 'Is General',
      gridSearchable: true,
    },
  },
  industry: {
    type: String,
    required: false,
    __lms: {
      csvHeader: 'Industry',
      gridSearchable: true,
    },
  },
  client: {
    _id: {
      type: ObjectId,
      ref: 'Company',
    },
    name: String,
    hierarchy: {
      type: String,
      __lms: {
        csvHeader: 'Client',
        gridSearchable: true,
      },
    },
  },
  isProductionReady: {
    type: Boolean,
    default: false,
    __lms: {
      csvHeader: 'Production Ready',
      gridSearchable: true,
    },
  },
}, {
  collection: 'mtModels',
  timestamps: true,
});

MTModelSchema.set('toJSON', { virtuals: true });

MTModelSchema.plugin(mongooseDelete, { indexFields: true, overrideMethods: true });
MTModelSchema.plugin(metadata);
MTModelSchema.plugin(lspData);
MTModelSchema.plugin(lmsGrid.aggregation());
MTModelSchema.index({ code: 1 }, { unique: true });

module.exports = MTModelSchema;
