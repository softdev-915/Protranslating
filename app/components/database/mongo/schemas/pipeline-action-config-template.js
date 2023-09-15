// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const metadata = require('../plugins/metadata');
const lsp = require('../plugins/lsp-data');

const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;
const PipelineActionConfigTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  actionName: {
    type: String,
    required: true,
  },
  companyId: {
    type: ObjectId,
    required: true,
  },
  configYaml: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'pipelineActionConfigTemplates',
  timestamps: true,
});

PipelineActionConfigTemplateSchema.plugin(metadata);
PipelineActionConfigTemplateSchema.plugin(lsp);

module.exports = PipelineActionConfigTemplateSchema;
