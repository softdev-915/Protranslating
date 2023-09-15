const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');

const { Schema } = mongoose;
const MigrationClusterSchema = new Schema({
  flag: String,
  executing: Boolean,
  hasFailed: {
    type: Boolean,
    default: false,
  },
  failedReason: String,
}, {
  collection: 'lms_migration_cluster',
  timestamps: true,
});

MigrationClusterSchema.index({ flag: 1 }, { unique: true });
MigrationClusterSchema.plugin(mongooseDelete, { overrideMethods: true });
MigrationClusterSchema.plugin(metadata);
MigrationClusterSchema.plugin(modified);

module.exports = MigrationClusterSchema;
