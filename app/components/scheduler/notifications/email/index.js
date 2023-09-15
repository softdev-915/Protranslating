const validateEmailNotification = require('./validation');

class EmailNotificationHandler {
  constructor(notification, emailSender) {
    const validationResults = validateEmailNotification(notification);
    if (validationResults) {
      throw new Error(validationResults);
    }
    this.notification = notification;
    this.emailSender = emailSender;
  }

  handle() {
    return this.emailSender.send(this.notification.email);
  }
}

module.exports = EmailNotificationHandler;
