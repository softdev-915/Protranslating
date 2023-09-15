const axios = require('axios');
const _ = require('lodash');
const { models: mongooseSchema } = require('../database/mongo');

const RECAPTCHA = 'recaptcha';
const RECAPTCHA_V3 = 'recaptcha-v3';

class RecaptchaValidator {
  constructor(logger) {
    this.logger = logger;
    this.schema = mongooseSchema;
  }

  async _validate(secret, recaptchaCode, ipAddress) {
    if (!secret) {
      this.logger.error('No recapcha keys found');
      throw new Error('No recaptcha keys found');
    }
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaCode}&remoteip=${ipAddress}`;
    const response = await axios.get(url);
    if (response.data.success) {
      return true;
    }
    const errorCodes = _.get(response.data, 'error-codes', []);
    const message = errorCodes.length > 0 ? errorCodes.join('\n') : 'Captcha token is not valid';
    throw new Error(message);
  }

  async validate(recaptchaCode, ipAddress) {
    const recaptchaV2 = await this.schema.ExternalApi.findOne({ name: RECAPTCHA });
    const secreteKey = _.get(recaptchaV2, 'options.secret', '');
    const result = await this._validate(secreteKey, recaptchaCode, ipAddress);
    return result;
  }

  async validateV3(recaptchaCode, ipAddress) {
    const recaptchaV3 = await this.schema.ExternalApi.findOne({ name: RECAPTCHA_V3 });
    const secreteKey = _.get(recaptchaV3, 'options.secret', '');
    const result = await this._validate(secreteKey, recaptchaCode, ipAddress);
    return result;
  }
}

module.exports = RecaptchaValidator;
