const moment = require('moment');
const _ = require('lodash');
const validateEmailNotification = require('../scheduler/notifications/email/validation');

class EmailNotificationQueue {
  constructor(logger, schema) {
    this.logger = logger;
    this.schema = schema;
  }

  queueNotification(email) {
    this.logger.debug(`Queue email: ${JSON.stringify(email)}`);
    this.validate(email);
    this.logger.debug('Creating notification');
    email.scheduledAt = moment.utc().toDate();
    const notification = new this.schema.Notification(email);
    return notification.save();
  }

  async upsertNotification(email) {
    try {
      this.validate(email);
    } catch (err) {
      this.logger.error(`Email validation failed for ${email} ${err}`);
      return;
    }
    const notificationPromises = [];
    const existingNotifications = await this.getExistingNotifications(email);
    if (_.isEmpty(existingNotifications)) {
      return this.queueNotification(email);
    }
    existingNotifications.forEach((notification) => {
      email.email.to = _.get(notification, 'email.to');
      const notificationPromise = this.schema.Notification.findByIdAndUpdate(notification._id, {
        modifications: email.modifications,
        email: _.get(email, 'email'),
      },
      {
        new: true,
        runValidators: true,
      });
      notificationPromises.push(notificationPromise);
    });
    return Promise.all(notificationPromises);
  }

  validate(email) {
    if (validateEmailNotification(email)) {
      const emailAddress = _.get(email, 'email.to[0].email');
      if (!_.isEmpty(emailAddress) && _.isString(emailAddress)) {
        this.logger.debug(`Valid email: ${emailAddress}`);
      } else {
        throw new Error(`Invalid email: ${emailAddress}`);
      }
      if (email && !_.get(email, 'lspId')) {
        this.logger.debug(`Invalid lspId for email: ${emailAddress}`);
        throw new Error(`Invalid lspId for email: ${emailAddress}`);
      }
    }
  }

  async getExistingNotifications(email) {
    const existingNotifications = await this.schema.Notification.find({
      recordId: email.recordId,
      type: email.type,
      error: null,
      processed: null,
    }).sort({ createdAt: -1 }).lean();
    return existingNotifications;
  }
}

module.exports = EmailNotificationQueue;
