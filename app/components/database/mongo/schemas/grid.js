const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const GridConfigColumnSchema = new Schema({
  name: String,
  prop: String,
  visible: Boolean,
  width: Number,
}, { _id: false });

const GridConfigSchema = new Schema({
  name: String,
  selected: Boolean,
  maxChars: {
    type: Number,
  },
  columns: [GridConfigColumnSchema],
  limit: {
    type: Number,
    default: 10,
  },
  customFilters: { type: String, default: '' },
}, { _id: false });

const GridListSchema = new Schema({
  grid: String,
  configs: [GridConfigSchema],
}, { _id: false });

const GridSchema = new Schema({
  userId: ObjectId,
  userEmail: String,
  grids: [GridListSchema],
}, {
  collection: 'grids',
  timestamps: true,
});

GridSchema.plugin(mongooseDelete, { overrideMethods: true });
GridSchema.plugin(metadata);
GridSchema.plugin(modified);
GridSchema.plugin(lspData);

GridSchema.statics.findByUser = function (user, cb) {
  const query = {
    lspId: user.lsp._id,
  };

  if (user._id) {
    query.userId = new mongoose.Types.ObjectId(user._id);
  }
  if (user.email) {
    query.userEmail = user.email;
  }

  return this.findOne(query, cb);
};

module.exports = GridSchema;
