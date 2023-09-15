// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const modified = require('../plugins/modified');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');

const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;
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
const PcTbDescriptorSchema = new Schema({
  companyId: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  srcLang: {
    type: LanguageSchema,
    required: true,
  },
  tgtLang: {
    type: LanguageSchema,
    required: true,
  },
  isReviewedByClient: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'portalCatTbDescriptors',
  timestamps: true,
});

PcTbDescriptorSchema.plugin(metadata);
PcTbDescriptorSchema.plugin(modified);
PcTbDescriptorSchema.plugin(lspData);
PcTbDescriptorSchema.plugin(mongooseDelete, { overrideMethods: 'all' });

PcTbDescriptorSchema.path('lspId').required(true);

PcTbDescriptorSchema.index({ lspId: 1, companyId: 1, 'srcLang.isoCode': 1, 'tgtLang.isoCode': 1 }, { unique: true });

module.exports = PcTbDescriptorSchema;
