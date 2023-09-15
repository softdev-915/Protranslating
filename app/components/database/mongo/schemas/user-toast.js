const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const UserToastSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  toast: {
    type: Schema.ObjectId,
    ref: 'Toast',
  },
  state: {
    type: String,
    enum: ['success', 'danger', 'warning', 'info'],
    default: 'info',
  },
  title: String,
  message: String,
  context: Object,
  lastReadTime: Date,
  dismissedTime: Date,
  requireDismiss: Boolean,
  ttl: Number,
  from: Date,
  to: Date,
}, {
  collection: 'userToasts',
  timestamps: true,
});

UserToastSchema.statics.findVisibleUserToasts = function (lspId, userId, now, cb) {
  return this.find({
    lspId,
    user: userId,
    $and: [
      {
        $or: [
          { from: null },
          { from: { $lte: now } },
        ],
      },
      {
        $or: [
          { to: null },
          { to: { $gt: now } },
        ],
      },
      {
        $or: [
          { requireDismiss: false, lastReadTime: null },
          { requireDismiss: true, dismissedTime: null },
        ],
      },
    ],
  }, cb);
};

UserToastSchema.plugin(mongooseDelete, { overrideMethods: true });
UserToastSchema.plugin(metadata);
UserToastSchema.plugin(modified);
UserToastSchema.plugin(lspData);

module.exports = UserToastSchema;
