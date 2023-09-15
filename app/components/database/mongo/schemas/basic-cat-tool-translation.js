const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const BasicCatToolLanguageSchema = new Schema({
  name: String,
  isoCode: String,
  cultureCode: String,
}, { _id: false });

const BasicCatToolTranslationSchema = new Schema({
  request: {
    type: ObjectId,
    ref: 'Request',
  },
  document: ObjectId,
  language: BasicCatToolLanguageSchema,
  translation: String,
}, {
  collection: 'basicCatToolTranslations',
  timestamps: true,
});

// Part of the basic check
BasicCatToolTranslationSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
BasicCatToolTranslationSchema.set('toJSON', { virtuals: true });

BasicCatToolTranslationSchema.pre('save', function (next) {
  if (this.otherCC) {
    this.otherCC = this.otherCC.toLowerCase();
  }
  next();
});

BasicCatToolTranslationSchema.plugin(mongooseDelete, { overrideMethods: true });
BasicCatToolTranslationSchema.plugin(metadata);
BasicCatToolTranslationSchema.plugin(modified);
BasicCatToolTranslationSchema.plugin(lspData);

module.exports = BasicCatToolTranslationSchema;
