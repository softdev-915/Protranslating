const _ = require('lodash');

const validateArrayRequired = [(value) => Array.isArray(value) && value.length > 0, 'Path `{PATH}` is required'];
const EMAIL_REGEX = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const validateEmail = {
  validator(email) {
    return _.isEmpty(email) || EMAIL_REGEX.test(email);
  },
  message: 'Email is invalid',
};
module.exports = { validateArrayRequired, validateEmail };
