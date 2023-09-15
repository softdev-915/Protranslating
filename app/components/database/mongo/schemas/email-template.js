const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const HtmlEmailSchema = new Schema({
  lang: String,
  html: String,
}, { _id: false });

const EmailTemplateSchema = new Schema({
  name: String,
  templates: [HtmlEmailSchema],
}, {
  collection: 'emailTemplates',
  timestamps: true,
});

EmailTemplateSchema.plugin(mongooseDelete, { overrideMethods: true });
EmailTemplateSchema.plugin(metadata);
EmailTemplateSchema.plugin(modified);
EmailTemplateSchema.plugin(lspData);

EmailTemplateSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = EmailTemplateSchema;
