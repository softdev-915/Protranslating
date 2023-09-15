const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');

const notificationRecord = {
  lspId: new ObjectId('58f60d08963daf9a13ce1889'),
  type: 'forgotPassword',
  email: {
    subject: 'Reset your password',
    'message-id': 'f4dead00-75d7-4536-99bc-73c0fdfe9536',
    to: [{
      email: 'lms45u1@sample.com',
      firstName: 'LMS45',
      lastName: '1',
    }],
    content: [{
      mime: 'text/html',
      data: '<p>Hello Portal User,</p><p>To reset your password please click <a href="https://0.0.0.0:3443/reset-password?code=e4a4af5d-6ca8-4937-bbf7-bf9e99c6062f" target="_blank">here</a>.</p><p>If you have any questions or encounter any problems signing on, please contact <a href="mailto:support@biglanguage.com" target="_blank">support@biglanguage.com</a>.</p><p>Thanks,</p><p>Big Language Solutions</p>',
    }],
  },
  mock: true,
  deleted: false,
  updatedBy: 'SYSTEM',
  createdBy: 'SYSTEM',
  error: null,
  scheduledAt: '2021-01-15T00:00:00.000Z',
  createdAt: '2021-01-15T00:00:00.000Z',
  updatedAt: '2021-01-15T00:00:00.000Z',
  processed: '2021-01-15T00:00:00.000',
};

const createMockRecord = (templateRecord, date, fields) => {
  if (!_.isObject(templateRecord)) {
    throw new Error('Record template was expected');
  }

  if (!_.isDate(date)) {
    throw new Error('Date was expected');
  }

  if (!_.isArray(fields)) {
    throw new Error('Fields were expected');
  }

  const record = _.clone(templateRecord);
  fields.forEach(field => _.set(record, field, date));
  return record;
};

const createNotificationRecord = (date) => {
  if (!_.isDate(date)) {
    throw new Error('Date was expected');
  }
  const fields = ['scheduledAt', 'createdAt', 'updatedAt', 'processed'];
  return createMockRecord(notificationRecord, date, fields);
};

module.exports = {
  createNotificationRecord,
};
