// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const modified = require('../plugins/modified');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');

const Schema = mongoose.Schema;
const { ObjectId, Mixed } = Schema.Types;
const PcConfigSchema = new Schema({
  userId: ObjectId,
  requestId: ObjectId,
  workflowId: ObjectId,
  taskId: ObjectId,
  config: Mixed,
}, {
  collection: 'portalCatUiConfig',
  timestamps: true,
});

PcConfigSchema.plugin(lspData);
PcConfigSchema.plugin(metadata);
PcConfigSchema.plugin(modified);

PcConfigSchema.index(
  { lspId: 1, userId: 1, requestId: 1, workflowId: 1, taskId: 1 },
  { unique: true },
);

module.exports = PcConfigSchema;
