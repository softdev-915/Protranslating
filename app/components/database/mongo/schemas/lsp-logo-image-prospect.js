const mongoose = require('mongoose');

const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const LspLogoImageProspect = new Schema({
  name: String,
  extension: String,
  mime: String,
  encoding: String,
  size: Number,
  format: String,
  height: Number,
  width: Number,
}, {
  collection: 'lspLogoImageProspects',
  timestamps: true,
});

LspLogoImageProspect.plugin(mongooseDelete, { overrideMethods: true });
LspLogoImageProspect.plugin(metadata);
LspLogoImageProspect.plugin(modified);
LspLogoImageProspect.plugin(lspData);

module.exports = LspLogoImageProspect;
