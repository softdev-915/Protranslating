// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const CompromisedPasswordSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true,
    __lms: { gridSearchable: true },
  },
}, { collection: 'compromisedPasswords', timestamps: true });

CompromisedPasswordSchema.statics.setCsvTransformations = csvBuilderInstance => csvBuilderInstance
  .virtual('Compromised password', ({ password }) => password)
  .virtual('Inactive', ({ deleted = false }) => deleted.toString())
  .virtual('Created by', ({ createdBy = '' }) => createdBy)
  .virtual('Created at', ({ createdAt = '' }) => createdAt)
  .virtual('Updated by', ({ updatedBy = '' }) => updatedBy)
  .virtual('Updated at', ({ updatedAt = '' }) => updatedAt)
  .virtual('Deleted by', ({ deletedBy = '' }) => deletedBy)
  .virtual('Deleted at', ({ deletedAt = '' }) => deletedAt)
  .virtual('Restored by', ({ restoredBy = '' }) => restoredBy)
  .virtual('Restored at', ({ restoredAt = '' }) => restoredAt);

CompromisedPasswordSchema.statics.getExportOptions = () => ({
  headers: [
    'Compromised password',
    'Inactive',
    'Created by',
    'Created at',
    'Updated by',
    'Updated at',
    'Deleted by',
    'Deleted at',
    'Restored by',
    'Restored at',
  ],
});

CompromisedPasswordSchema.plugin(mongooseDelete, { overrideMethods: true });
CompromisedPasswordSchema.plugin(metadata);
CompromisedPasswordSchema.plugin(modified);
CompromisedPasswordSchema.plugin(lspData);
CompromisedPasswordSchema.plugin(lmsGrid.aggregation());
CompromisedPasswordSchema.plugin(importModulePlugin);
CompromisedPasswordSchema.index({ lspId: 1, password: 1 }, { unique: true });

module.exports = CompromisedPasswordSchema;
