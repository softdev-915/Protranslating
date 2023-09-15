const Promise = require('bluebird');

class MockHandler {
  constructor(notification, mockParams = {}) {
    this.notification = notification;
    this.mockParams = mockParams;
  }

  handle() {
    const { shouldEmailFail, mockEmailSendingFail } = this.mockParams;
    if (shouldEmailFail) {
      return Promise.reject(`Failed to send email to ${mockEmailSendingFail}`);
    }
    return Promise.resolve(this.notification);
  }
}

module.exports = MockHandler;
