const _ = require('lodash');
const moment = require('moment');
const mongoose = require('mongoose');
const { asyncLocalStorage } = require('../../../../async_storage');

const markAsDeleted = (doc, userEmail) => Object.assign(doc, {
  deletedAt: moment().utc(),
  deletedBy: userEmail,
});

const markAsRestored = (doc, userEmail) => {
  if (doc.isNew) {
    return;
  }
  Object.assign(doc, {
    restoredAt: moment().utc(),
    restoredBy: userEmail,
  });
};

module.exports = function docMetadata(schema, options) {
  // Fields for all models
  let customFields = {
    updatedBy: String,
    createdBy: String,
    deletedBy: String,
    restoredBy: String,
    deletedAt: Date,
    restoredAt: Date,
  };

  // Custom options setup
  if (typeof options === 'object') {
    if (typeof options.defaultAuthor === 'string') {
      // Override defaults
      customFields = _.extend(customFields, {
        updatedBy: {
          type: String,
          default: options.defaultAuthor,
        },
        createdBy: {
          type: String,
          default: options.defaultAuthor,
        },
      });
    }
  }

  schema.pre('save', function setMetadata(next) {
    const store = asyncLocalStorage.getStore();
    const userEmail = store?.user?.email;
    if (!_.isNil(userEmail)) {
      const userProp = this.isNew ? 'createdBy' : 'updatedBy';
      this[userProp] = userEmail;
    }
    if (this.isModified('deleted')) {
      const method = this.deleted ? markAsDeleted : markAsRestored;
      method(this, userEmail);
    }
    next();
  });

  schema.pre(/update/i, function setMetadata() {
    const store = asyncLocalStorage.getStore();
    const userEmail = store?.user?.email;
    if (!_.isNil(userEmail)) {
      this.set({ updatedBy: userEmail });
    }
  });

  // Set Props and Sanitize
  schema.methods.safeAssign = function (newValue) {
    // NOTE: do not change this to an arrow function
    if (_.isObject(newValue)) {
      if (newValue instanceof mongoose.Model) {
        newValue = newValue.toObject();
      }
      const regExps = [/^\$/, /^_id/, /^__/];
      const objKeys = Object.keys(newValue);
      objKeys.forEach((key) => regExps.forEach((reg) => {
        if (reg.test(key)) {
          delete newValue[key];
        }
      }));
      Object.assign(this, newValue);
    }
  };

  schema.methods.safeAssignAndOverwrite = function (newValue) {
    // NOTE: do not change this to an arrow function
    if (_.isObject(newValue)) {
      const regExps = [/^\$/, /^_id/, /^__/];
      const objKeys = Object.keys(newValue);
      objKeys.forEach((key) => regExps.forEach((reg) => {
        if (reg.test(key)) {
          delete newValue[key];
        }
      }));
      _.mergeWith(this, newValue, (_a, b) => (_.isArray(b) ? b : undefined));
    }
  };

  // Add custom filed here
  schema.add(customFields);
};
