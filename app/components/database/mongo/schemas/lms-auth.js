// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const LmsAuth = new Schema({
  email: String,
  password: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  passwordHistory: [String],
  passwordChangeDate: {
    type: Date,
    default: new Date(),
  },
  secret: String,
  otpAuthURL: String,
}, {
  collection: 'lmsAuth',
  timestamps: true,
});

LmsAuth.plugin(mongooseDelete, { overrideMethods: true });
LmsAuth.plugin(metadata);
LmsAuth.plugin(modified);
LmsAuth.plugin(lspData);
LmsAuth.plugin(importModulePlugin);
LmsAuth.index({ lspId: 1, email: 1 }, { unique: true });

module.exports = LmsAuth;
