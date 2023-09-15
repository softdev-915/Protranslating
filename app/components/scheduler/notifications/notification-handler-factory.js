const _ = require('lodash');
const EmailSender = require('../../email');
const EmailNotificationHandler = require('./email');
const MockHandler = require('./mock-handler');
const logger = require('../../log/logger');
const configuration = require('../../configuration');

const chooseEmailFrom = (n, emailConfig) => {
  if (emailConfig && emailConfig.from) {
    return emailConfig.from;
  }
  return _.get(n, 'email.from');
};

const getMockParams = (email, flags) => {
  const { NODE_ENV } = configuration.environment;
  if (NODE_ENV === 'PROD') {
    return false;
  }
  const emailAddress = _.get(email, 'email.to[0].email');
  const mockEmailSendingFail = _.get(flags, 'mockEmailSendingFail', '');
  const shouldEmailFail = emailAddress.trim() === mockEmailSendingFail.trim();
  const shouldMock = emailAddress.includes('@sample.com') || shouldEmailFail || email.mock;
  return {
    shouldMock,
    shouldEmailFail,
    mockEmailSendingFail,
  };
};

const notificationHandlerFactory = (notification, emailConfig, flags) => {
  const email = _.get(notification, 'email.to[0].email', null);

  if (_.isNil(email)) {
    return null;
  }
  const fromEmail = chooseEmailFrom(notification, emailConfig);
  const mockParams = getMockParams(notification, flags);
  if (mockParams.shouldMock) {
    return new MockHandler(notification, mockParams);
  }
  const emailSender = new EmailSender(logger, fromEmail, emailConfig);
  return new EmailNotificationHandler(notification, emailSender);
};

module.exports = notificationHandlerFactory;
