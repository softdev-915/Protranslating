const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');

const { Schema } = mongoose;
const RoleSchema = new Schema({
  name: {
    type: String,
    index: true,
    unique: true,
  },
}, {
  collection: 'roles',
  timestamps: true,
});

RoleSchema.plugin(mongooseDelete, { overrideMethods: true });
RoleSchema.plugin(metadata);
RoleSchema.plugin(modified);

module.exports = RoleSchema;
