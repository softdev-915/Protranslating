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
const PcSrDescriptorSchema = new Schema({
  companyId: {
    type: ObjectId,
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  language: {
    type: LanguageSchema,
    required: true,
  },
}, {
  collection: 'portalCatSrDescriptors',
  timestamps: true,
});

PcSrDescriptorSchema.plugin(metadata);
PcSrDescriptorSchema.plugin(modified);
PcSrDescriptorSchema.plugin(lspData);
PcSrDescriptorSchema.plugin(mongooseDelete, { overrideMethods: 'all' });

PcSrDescriptorSchema.path('lspId').required(true);

PcSrDescriptorSchema.index({ lspId: 1, companyId: 1, 'language.isoCode': 1 }, { unique: true });

module.exports = PcSrDescriptorSchema;
