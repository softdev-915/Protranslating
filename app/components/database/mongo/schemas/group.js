const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const modified = require('../plugins/modified');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const GroupSchema = new Schema({
  name: String,
  roles: {
    type: [String],
    default: [],
  },
}, {
  collection: 'groups',
  timestamps: true,
});

GroupSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance.virtual('Inactive', (item) => (item.inactiveText || ''));
};

GroupSchema.statics.getExportOptions = () => ({
  headers: ['Name', 'Roles', 'Creator', 'Created', 'Updater', 'Updated', 'Inactive', 'Restorer', 'Restored'],
  alias: {
    Name: 'name',
    Roles: 'roles',
  },
});

// Part of the concurrency check
GroupSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
GroupSchema.set('toJSON', { virtuals: true });

GroupSchema.plugin(mongooseDelete, { overrideMethods: true });
GroupSchema.plugin(metadata);
GroupSchema.plugin(modified);
GroupSchema.plugin(lspData);
GroupSchema.plugin(importModulePlugin);

GroupSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = GroupSchema;
