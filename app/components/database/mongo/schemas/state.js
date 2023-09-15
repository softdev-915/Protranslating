const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const StateSchema = new Schema({
  country: {
    type: ObjectId,
    ref: 'Country',
  },
  name: {
    type: String,
  },
  code: {
    type: String,
  },
}, {
  collection: 'states',
});

StateSchema.plugin(mongooseDelete, { overrideMethods: true });
StateSchema.plugin(metadata);
StateSchema.plugin(modified);
StateSchema.plugin(lmsGrid.aggregation());
StateSchema.plugin(importModulePlugin);

module.exports = StateSchema;
