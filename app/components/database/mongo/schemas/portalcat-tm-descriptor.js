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
const PcTmDescriptorSchema = new Schema({
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
}, {
  collection: 'portalCatTmDescriptors',
  timestamps: true,
});

PcTmDescriptorSchema.plugin(metadata);
PcTmDescriptorSchema.plugin(modified);
PcTmDescriptorSchema.plugin(lspData);
PcTmDescriptorSchema.plugin(mongooseDelete, { overrideMethods: 'all' });

PcTmDescriptorSchema.path('lspId').required(true);

PcTmDescriptorSchema.index({ lspId: 1, companyId: 1, 'srcLang.isoCode': 1, 'tgtLang.isoCode': 1 }, { unique: true });

module.exports = PcTmDescriptorSchema;
