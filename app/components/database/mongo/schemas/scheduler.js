const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const SchedulerExecution = new Schema({
  executed: Date,
  status: {
    type: String,
    enum: ['success', 'running', 'error'],
    default: 'success',
  },
  error: String,
}, { _id: false });

const SchedulerOptionsSchema = new Schema({
  concurrency: Number,
  lockLimit: Number,
  lockLifetime: Number,
  priority: String,
  notificationDelay: {
    type: Number,
    default: 0,
  },
  additionalValues: {
    type: Object,
    default: {},
  },
  additionalSchema: {
    type: Object,
    default: {},
  },
}, { _id: false });

const SchedulerSchema = new Schema({
  name: {
    type: String,
  },
  every: String,
  schedule: Date,
  options: {
    type: SchedulerOptionsSchema,
    default: {},
  },
  email: {
    from: String,
    template: String,
    subject: String,
    variables: Object,
  },
  executionHistory: {
    type: [SchedulerExecution],
    default: [],
  },
}, {
  collection: 'schedulers',
  timestamps: true,
});

SchedulerSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance
    .virtual('Inactive', (item) => (item.inactiveText || ''));
};

SchedulerSchema.statics.getExportOptions = () => ({
  headers: ['Name', 'Every', 'Inactive', 'Creator', 'Created', 'Updater', 'Updated', 'Inactive', 'Restorer', 'Restored'],
  alias: {
    Name: 'name',
    Every: 'every',
  },
});

// Part of the basic check
SchedulerSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
SchedulerSchema.set('toJSON', { virtuals: true });

SchedulerSchema.pre('save', function (next) {
  if (this.email && this.email.from) {
    this.email.from = this.email.from.toLowerCase();
  }
  next();
});

SchedulerSchema.index({ lspId: 1, name: 1 }, { unique: true });
SchedulerSchema.plugin(mongooseDelete, { overrideMethods: true });
SchedulerSchema.plugin(lspData);
SchedulerSchema.plugin(metadata);
SchedulerSchema.plugin(modified);
SchedulerSchema.plugin(importModulePlugin);

module.exports = SchedulerSchema;
