const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');

const { Schema } = mongoose;
const AuditTrailSchema = new Schema({
  timestamp: Date,
  req: {
    id: String,
    url: String,
    body: Schema.Types.Mixed,
    bodyPlainText: String,
    originalUrl: String,
    headers: {
      cookie: String,
      'accept-language': String,
      'accept-encoding': String,
      referer: String,
      'save-data': String,
      'x-requested-with': String,
      'x-forwarded-for': String,
      accept: String,
      'user-agent': String,
      'lms-mock': String,
      connection: String,
      host: String,
    },
    method: String,
    params: Object,
    query: Object,
    sessionID: String,
    httpVersion: String,
    httpVersionMajor: Number,
    httpVersionMinor: Number,
  },
  user: {
    _id: String,
    email: String,
  },
  res: {
    statusCode: Number,
    headers: {
      'lms-node': String,
      'x-request-id': String,
      'x-dns-prefetch-control': String,
      'x-frame-options': String,
      'strict-transport-security': String,
      'x-download-options': String,
      'x-content-type-options': String,
      'x-xss-protection': String,
      'content-type': String,
      'content-length': Number,
      etag: String,
    },
    bodyPlainText: String,
    body: {
      status: {
        message: String,
        code: Number,
        error: Boolean,
        version: String,
      },
    },
  },
}, {
  collection: 'audit_trails',
  timestamps: true,
});

AuditTrailSchema.plugin(mongooseDelete, { overrideMethods: true });
AuditTrailSchema.plugin(metadata);
AuditTrailSchema.plugin(modified);
AuditTrailSchema.plugin(lspData);
AuditTrailSchema.plugin(lmsGrid.aggregation());

module.exports = AuditTrailSchema;
