const validate = require('validate.js');
const _ = require('lodash');

const email = validate.validators.email.bind(validate.validators.email);
const validateNotificationContent = (content) => {
  if (_.isEmpty(content)) {
    return null;
  }
  const attachmentType = _.get(content, 'mime', _.get(content, 'type', ''), '');

  if (_.isEmpty(attachmentType) || !_.isString(attachmentType)) {
    return 'Invalid mime content';
  }
  if (!content.data && !content.path) {
    return 'Invalid content';
  }

  return null;
};

validate.validators.isNotificationEmailTo = (value) => {
  if (Array.isArray(value)) {
    const len = value.length;

    for (let i = 0; i < len; i++) {
      const to = value[i];

      if (!to.email || !validate.isString(to.email)
        || to.email.trim().length === 0
        || email(to.email.trim(), {}) !== undefined) {
        return 'Invalid to email';
      }
    }
  } else {
    return 'Invalid to';
  }
};

validate.validators.isNotificationContent = (value) => {
  if (_.isNil(value)) {
    return null;
  }
  if (Array.isArray(value)) {
    const len = value.length;

    for (let i = 0; i < len; i++) {
      const contentValidation = validateNotificationContent(value[i]);

      if (contentValidation) {
        return contentValidation;
      }
    }
  } else if (typeof value === 'object') {
    return validateNotificationContent(value);
  } else {
    return 'Invalid content';
  }
};

const notificationConstraints = {
  email: {
    presence: { allowEmpty: false },
  },
  'email.subject': {
    presence: { allowEmpty: false },
  },
  'email.to': {
    presence: { allowEmpty: false },
    isNotificationEmailTo: true,
  },
  'email.content': {
    presence: { allowEmpty: true },
    isNotificationContent: true,
  },
};
const validateEmailNotification = (notification) => validate(notification, notificationConstraints);

module.exports = validateEmailNotification;
