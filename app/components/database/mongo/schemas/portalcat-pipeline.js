const { Schema } = require('mongoose');

const PipelineActionDocument = new Schema({
  fileId: Schema.Types.ObjectId,
  fileName: String,
});

const PipelineActionAttributesSchema = new Schema({
  configurable: Boolean,
  movable: Boolean,
  duplicable: Boolean,
  positions: [Number],
}, {
  _id: false,
});

const PipelineActionSchema = new Schema({
  name: String,
  note: String,
  attributes: PipelineActionAttributesSchema,
  config: Schema.Types.Mixed,
  downloads: [PipelineActionDocument],
});

const PortalCatPipeline = new Schema({
  defaultId: Schema.Types.ObjectId,
  lspId: Schema.Types.ObjectId,
  companyId: Schema.Types.ObjectId,
  requestId: Schema.Types.ObjectId,
  workflowId: Schema.Types.ObjectId,
  taskId: Schema.Types.ObjectId,
  taskName: String,
  fileId: Schema.Types.ObjectId,
  fileName: String,
  srcLang: String,
  tgtLang: String,
  encoding: String,
  finalEncoding: String,
  status: {
    type: String,
    enum: ['running', 'stopped', 'succeeded', 'failed'],
    default: 'stopped',
  },
  message: String,
  errorAction: Schema.Types.ObjectId,
  currentActions: [PipelineActionSchema],
  allowedActions: [PipelineActionSchema],
  type: {
    type: String,
    enum: ['import', 'export', 'analysis', 'locking', 'mt'],
  },
}, {
  collection: 'pc_pipelines',
  timestamps: true,
});

module.exports = PortalCatPipeline;
