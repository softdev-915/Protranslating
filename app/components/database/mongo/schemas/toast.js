const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');

const { Schema } = mongoose;
const ToastUser = new Schema({
  firstName: String,
  lastName: String,
  email: String,
});

const ToastSchema = new Schema({
  users: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  state: {
    type: String,
    enum: ['success', 'danger', 'warning', 'info'],
    default: 'info',
  },
  usersCache: {
    type: [ToastUser],
    default: [],
  },
  title: String,
  message: String,
  context: Object,
  requireDismiss: Boolean,
  ttl: Number,
  from: Date,
  to: Date,
}, {
  collection: 'toasts',
  timestamps: true,
});

ToastSchema.statics.findActiveAllUsersToast = function (lspId, cb) {
  return this.find({
    lspId,
    users: [],
  }, cb);
};

ToastSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance
    .virtual('Title', (item) => (item.title || ''))
    .virtual('Message', (item) => (item.message || ''))
    .virtual('From', (item) => (item.from || ''))
    .virtual('Require Dismiss', (item) => (item.requireDismiss || ''))
    .virtual('Users', (item) => (item.usersName || ''))
    .virtual('To', (item) => (item.to || ''))
    .virtual('Inactive', (item) => (item.deleted || ''));
};

ToastSchema.statics.getExportOptions = () => ({
  headers: ['Title', 'Message', 'Users', 'From', 'To', 'Require Dismiss', 'Inactive', 'Creator', 'Created', 'Updater', 'Updated', 'Inactive', 'Restorer', 'Restored'],
});

// Part of the basic check
ToastSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
ToastSchema.set('toJSON', { virtuals: true });

ToastSchema.plugin(mongooseDelete, { overrideMethods: true });
ToastSchema.plugin(metadata);
ToastSchema.plugin(modified);
ToastSchema.plugin(lspData);

module.exports = ToastSchema;
