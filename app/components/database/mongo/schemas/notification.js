const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const EmailToSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
}, { _id: false });

const EmailContentSchema = new Schema({
  mime: String,
  data: String,
}, { _id: false });

const AttachmentSchema = new Schema({
  data: String,
  alternative: Boolean,
  path: String,
  type: String,
  name: String,
  storage: String,
  size: Number,
}, { _id: false });

const NotificationSchema = new Schema({
  type: String,
  email: {
    subject: String,
    'message-id': String,
    to: [EmailToSchema],
    from: {
      type: String,
      default: 'support@biglanguage.com',
    },
    content: [EmailContentSchema],
    attachment: [AttachmentSchema],
  },
  mock: {
    type: Boolean,
    default: false,
  },
  recordId: Schema.ObjectId,
  modifications: [],
  processed: Date,
  error: String,
  scheduledAt: Date,
}, {
  collection: 'notifications',
  timestamps: true,
});

NotificationSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance.virtual('Type', (item) => (item.type || ''))
    .virtual('Scheduled At', (item) => (item.scheduledAt || item.createdAt || ''))
    .virtual('Subject', (item) => (item.emailSubject || ''))
    .virtual('Body', (item) => (item.emailBody || ''))
    .virtual('Addresses', (item) => (item.emailList || ''))
    .virtual('Sent', (item) => (item.processed || ''))
    .virtual('Inactive', (item) => (item.inactiveText || ''))
    .virtual('Error', (item) => (item.error || ''));
};

NotificationSchema.statics.getExportOptions = () => ({
  headers: ['Type', 'Scheduled date', 'Notification id', 'Subject', 'Body', 'Addresses', 'Sent',
    'Creator', 'Created', 'Updater', 'Updated', 'Inactive', 'Restorer', 'Restored', 'Error'],
});

NotificationSchema.plugin(mongooseDelete, { overrideMethods: true });
NotificationSchema.plugin(metadata, { defaultAuthor: 'SYSTEM' });
NotificationSchema.plugin(lspData);
NotificationSchema.plugin(importModulePlugin);

NotificationSchema.statics.findUnprocessed = function (name, lspId) {
  return this.find({
    type: name,
    lspId,
    processed: { $exists: false },
    createdAt: { $gte: moment().utc().add(-1, 'days').toDate() },
  }, '-error');
};

NotificationSchema.statics.setProcessed = function (notifications) {
  if (notifications.length > 0) {
    return new Promise((resolve) => {
      const bulk = this.collection.initializeUnorderedBulkOp();
      notifications.forEach((n) => {
        const query = { _id: n._id, lspId: n.lspId };
        const update = { updatedAt: new Date(), error: null };
        if (_.isNil(n.error)) {
          update.processed = n.processed = new Date();
        } else {
          update.error = n.error;
        }
        bulk.find(query).updateOne({ $set: update });
      });
      return bulk.execute(resolve);
    });
  }
};

module.exports = NotificationSchema;
