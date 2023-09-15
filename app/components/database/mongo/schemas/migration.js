const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');

const { Schema } = mongoose;
const MigrationSchema = new Schema({
  name: String,
  executed: Date,
}, {
  collection: 'lms_migrations',
  timestamps: true,
});

MigrationSchema.index({ name: 1 }, { unique: true });
MigrationSchema.plugin(mongooseDelete, { overrideMethods: true });
MigrationSchema.plugin(metadata);
MigrationSchema.plugin(modified);

module.exports = MigrationSchema;
