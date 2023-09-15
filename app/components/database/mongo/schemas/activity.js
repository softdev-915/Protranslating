const { Types: { ObjectId } } = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const { sanitizeHTML } = require('../../../../utils/security/html-sanitize');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const HUMAN_READABLE_STATUSES = {
  toBeProcessed: 'To Be Processed',
  onHold: 'On Hold',
  inProgress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  reviewerRequired: 'Reviewer Required',
  reviewerAssigned: 'Reviewer Assigned',
  formSent: 'Form Sent',
  LMPendingReview: 'LM Pending Review',
  LMSignOff: 'LM Sign Off',
  reviewCompleted: 'Review Completed',
  reviewVoid: 'Review Void',
};

const ActivityAttachmentSchema = new Schema({
  size: Number,
  url: String,
  name: String,
  cloudKey: String,
  md5Hash: String,
}, {
  timestamps: true,
});

const ActivityDocumentSchema = new Schema({
  name: String,
  uploadDate: Date,
  mime: String,
  encoding: String,
  size: Number,
  deleted: Boolean,
  user: Schema.ObjectId,
  createdBy: String,
  ip: String,
  md5Hash: {
    type: String,
    default: 'pending',
  },
  cloudKey: String,
}, { timestamps: true });

const ActivityEmailDetailsSchema = new Schema({
  isQuote: {
    type: Boolean,
    default: false,
  },
  isQuoteSent: {
    type: Boolean,
    default: false,
  },
  isInvoice: {
    type: Boolean,
    default: false,
  },
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  htmlBody: String,
  textBody: String,
  internalDepartments: [{
    type: Schema.ObjectId,
    ref: 'InternalDepartment',
  }],
  requests: [{
    type: Schema.ObjectId,
    ref: 'Request',
  }],
  opportunities: [{
    type: Schema.ObjectId,
    ref: 'Opportunity',
  }],
  requestId: {
    type: Schema.ObjectId,
    ref: 'Request',
  },
  company: {
    type: Schema.ObjectId,
    ref: 'Company',
  },
  embeddedAttachments: [ActivityAttachmentSchema],
  scheduledAt: Date,
  failedEmails: [],
  invoiceNo: String,
  emailTemplate: String,
  isImported: { type: Boolean, default: false },
});

const FeedbackDetailsSchema = new Schema({
  internalDepartments: [{
    type: Schema.ObjectId,
    ref: 'InternalDepartment',
  }],
  requests: [{
    type: Schema.ObjectId,
    ref: 'Request',
  }],
  company: {
    type: Schema.ObjectId,
    ref: 'Company',
  },
  incidentDate: Date,
  status: {
    type: String,
    enum: _.keys(HUMAN_READABLE_STATUSES),
  },
  nonComplianceClientComplaintCategory: {
    type: String,
    enum: ['Billing Related (CC)', 'Client Error (CC)', 'Conduct Related (NC)', 'Delivery (CC)', 'Process Related (NC)', 'Quality (CC)', 'Resource Needed (NC)', 'Timeliness (CC)', 'Training Required (NC)', 'Vendor Error (CC)', ''],
    default: '',
  },
  car: String,
  escalated: {
    type: Boolean,
    default: false,
  },
  documents: [[ActivityDocumentSchema]],
}, { _id: false });

const ActivitySchema = new Schema({
  dateSent: {
    type: Date,
    default: moment.utc(),
  },
  activityType: {
    type: String,
    enum: ['Feedback', 'User Note', 'Email'],
    required: [true, 'Activity Type is required'],
  },
  users: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  userNoteDetails: {
    type: Object,
  },
  emailDetails: ActivityEmailDetailsSchema,
  feedbackDetails: FeedbackDetailsSchema,
  subject: {
    type: String,
    required: [true, 'Activity Subject is required'],
  },
  comments: {
    type: String,
  },
  tags: [String],
  activityCreatedBy: String,
  isImported: {
    type: Boolean,
    default: false,
  },
  isMocked: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'activities',
  timestamps: true,
});

ActivitySchema.pre('save', function (next) {
  if (_.get(this, 'comments')) {
    this.comments = sanitizeHTML(this.comments);
  }
  next();
});

// Part of the concurrency check
ActivitySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

ActivitySchema.statics.saveAndPopulate = async function (activity, population) {
  const saved = await activity.save();

  return saved.populate(population);
};

ActivitySchema.statics.handleNotificationResults = async function (notifications) {
  return Promise.map((notifications), ({ notification }) => {
    const query = { _id: new ObjectId(notification.recordId) };
    const email = _.get(notification, 'email.to[0].email');
    if (_.isNil(notification.recordId) || _.isEmpty(email)) {
      return Promise.resolve();
    }
    if (!_.isEmpty(notification.error)) {
      return this.findOneAndUpdate(query, {
        $addToSet: {
          'emailDetails.failedEmails': email,
        },
      });
    }
    if (!_.isNil(notification.processed)) {
      return this.findOneAndUpdate(query, {
        $pull: {
          'emailDetails.failedEmails': email,
        },
      });
    }
    return Promise.resolve();
  });
};

ActivitySchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);

  return csvBuilderInstance
    .virtual('Date Sent', (item) => (item.dateSent || ''))
    .virtual('Users', (item) => (item.users || ''))
    .virtual('Type', (item) => (item.activityType || ''))
    .virtual('Subject', (item) => (item.subject || ''))
    .virtual('Created By', (item) => (item.activityCreatedBy || ''))
    .virtual('Comments', (item) => (item.comments || ''))
    .virtual('Tags', (item) => (item.tags || ''))
    .virtual('Inactive', (item) => (item.inactiveText || ''))
    .virtual('Requests', (item) => _.defaultTo(_.get(item, 'requests', ''), ''))
    .virtual('Status', (item) => {
      const status = _.get(item, 'status', '');

      return _.get(HUMAN_READABLE_STATUSES, status, '');
    })
    .virtual('Company', item => _.get(item, 'company', ''))
    .virtual('Company Status', item => _.get(item, 'companyStatus', ''))
    .virtual('Internal Departments', item => _.get(item, 'internalDepartments', ''))
    .virtual('Incident Date', item => _.defaultTo(_.get(item, 'incidentDate', ''), ''))
    .virtual('NC/CC Category', item => _.defaultTo(_.get(item, 'nonComplianceClientComplaintCategory', ''), ''))
    .virtual('CAR #', item => _.defaultTo(_.get(item, 'car', ''), ''))
    .virtual('Escalated', item => _.defaultTo(_.get(item, 'escalated', ''), ''))
    .virtual('From', item => _.get(item, 'emailDetails.from', ''))
    .virtual('To', item => _.get(item, 'emailDetails.to', []).join(', '))
    .virtual('Cc', item => _.get(item, 'emailDetails.cc', []).join(', '))
    .virtual('Bcc', item => _.get(item, 'emailDetails.bcc', []).join(', '))
    .virtual('Scheduled At', item => _.defaultTo(_.get(item, 'scheduledAt', ''), ''))
    .virtual('Files', item => _.defaultTo(_.get(item, 'files', ''), ''))
    .virtual('Attachments', item => _.defaultTo(_.get(item, 'attachmentsText', ''), ''))
    .virtual('Opportunities', item => _.defaultTo(_.get(item, 'opportunityNumbersText', ''), ''))
    .virtual('Failed emails', item => _.defaultTo(_.get(item, 'failedEmailsText', ''), ''))
    .virtual('Body', item => _.defaultTo(_.get(item, 'emailTextBody', ''), ''));
};

ActivitySchema.statics.getExportOptions = () => ({
  headers: [
    'Date Sent',
    'Type',
    'Users',
    'Subject',
    'Created By',
    'Comments',
    'Tags',
    'Creator',
    'Created',
    'Updater',
    'Updated',
    'Inactive',
    'Restorer',
    'Restored',
    'Internal Departments',
    'NC/CC Category',
    'Requests',
    'Incident Date',
    'Status',
    'Company',
    'Company Status',
    'CAR #',
    'Escalated',
    'From',
    'To',
    'Cc',
    'Bcc',
    'Scheduled At',
    'Files',
    'Attachments',
    'Opportunities',
    'Body',
    'Invoice Number',
    'Failed emails',
  ],
});

// Allow virtuals to be converted to JSON
ActivitySchema.set('toJSON', { virtuals: true });

ActivitySchema.plugin(mongooseDelete, { overrideMethods: 'all' });
ActivitySchema.plugin(metadata);
ActivitySchema.plugin(modified);
ActivitySchema.plugin(lspData);
ActivitySchema.plugin(importModulePlugin);

module.exports = ActivitySchema;
