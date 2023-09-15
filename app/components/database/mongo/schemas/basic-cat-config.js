const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const AVAILABLE_COMPONENTS = ['preview', 'editor', 'files'];
const BasicCatConfigSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
  },
  northComponent: {
    type: String,
    enum: AVAILABLE_COMPONENTS,
    default: 'preview',
  },
  southComponent: {
    type: String,
    enum: AVAILABLE_COMPONENTS,
    default: 'editor',
  },
  westComponent: {
    type: String,
    enum: AVAILABLE_COMPONENTS,
    default: 'files',
  },
  northSize: {
    type: Number,
    default: 0,
  },
  westSize: {
    type: Number,
    default: 0,
  },
}, {
  collection: 'basicCatToolConfig',
  timestamps: true,
});

BasicCatConfigSchema.plugin(mongooseDelete, { overrideMethods: true });
BasicCatConfigSchema.plugin(metadata);
BasicCatConfigSchema.plugin(modified);
BasicCatConfigSchema.plugin(lspData);

module.exports = BasicCatConfigSchema;
