const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const DocumentationSchema = new Schema({
  name: {
    type: String,
  },
  title: String,
  lang: String,
  help: String,
  roles: [String],
  unformattedHelp: String,
}, {
  collection: 'documentation',
  timestamps: true,
});

// Part of the basic check
DocumentationSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
DocumentationSchema.set('toJSON', { virtuals: true });

DocumentationSchema.plugin(mongooseDelete, { overrideMethods: true });
DocumentationSchema.plugin(metadata);
DocumentationSchema.plugin(modified);
DocumentationSchema.plugin(lspData);

DocumentationSchema.index({ lspId: 1, name: 1, lang: 1 }, { unique: true });

module.exports = DocumentationSchema;
