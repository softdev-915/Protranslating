const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const ConnectorSchema = new Schema({
  name: { type: String, default: '' },
  remoteUrl: { type: String, default: '' },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  syncFromDate: { type: Date, default: null },
  senderId: { type: String, default: '' },
  senderPassword: { type: String, default: '' },
  companyId: { type: String, default: '' },
  notes: { type: String, default: '' },
  hasAuthError: { type: Boolean, default: false },
  enableInstantSync: { type: Boolean, default: true },
}, { timestamps: true });

ConnectorSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});
ConnectorSchema.set('toJSON', { virtuals: true });

ConnectorSchema.plugin(mongooseDelete, { overrideMethods: 'all' });
ConnectorSchema.plugin(metadata);
ConnectorSchema.plugin(lspData);
ConnectorSchema.plugin(lmsGrid.aggregation());
ConnectorSchema.plugin(importModulePlugin);

module.exports = ConnectorSchema;
