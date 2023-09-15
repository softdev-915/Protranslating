const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const CustomQueryPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
  customQueryId: { type: mongoose.Schema.ObjectId, ref: 'CustomQuery' },
  scheduledAt: { type: String },
  isRunForced: { type: Boolean },
  lastRunAt: { type: Date },
}, { collection: 'customQueryPreferences', timestamps: true });

CustomQueryPreferenceSchema.plugin(mongooseDelete, { overrideMethods: true });
CustomQueryPreferenceSchema.plugin(metadata);
CustomQueryPreferenceSchema.plugin(modified);
CustomQueryPreferenceSchema.plugin(lspData);
CustomQueryPreferenceSchema.index({ lspId: 1, userId: 1, customQueryId: 1 }, { unique: true });

module.exports = CustomQueryPreferenceSchema;
