const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const { WorkflowSchema } = require('./subschemas/workflow.js');

const workflowTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  languageCombinations: {
    type: [String],
    required: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  workflows: [WorkflowSchema],
}, {
  collection: 'workflowTemplates',
  timestamps: true,
});

workflowTemplateSchema.plugin(mongooseDelete, { overrideMethods: true });
workflowTemplateSchema.plugin(metadata);
workflowTemplateSchema.plugin(modified);
workflowTemplateSchema.plugin(lspData);
workflowTemplateSchema.plugin(lmsGrid.aggregation());

module.exports = workflowTemplateSchema;
