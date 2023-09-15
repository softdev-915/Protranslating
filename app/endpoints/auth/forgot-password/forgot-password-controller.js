const _ = require('lodash');
const ForgotPasswordAPI = require('./forgot-password-api');
const RecaptchaValidator = require('../../../components/recaptcha');
const apiResponse = require('../../../components/api-response');
const configuration = require('../../../components/configuration');

const { sendResponse } = apiResponse;
const { RestError } = apiResponse;

async function validateRecaptcha(req) {
  const { recaptcha } = _.get(req, 'swagger.params.data.value');
  const clientIP = req.connection.remoteAddress;
  const envConfig = configuration.environment;

  if (envConfig.NODE_ENV === 'PROD') {
    const recaptchaValidator = new RecaptchaValidator(req.$logger);

    try {
      recaptchaValidator.validate(recaptcha, clientIP);
    } catch (e) {
      req.$logger.warn(`Recaptcha validation failed: ${e}`);
      throw new RestError(400, { message: 'Recaptcha validation failed' });
    }
  }
}

module.exports = {
  async create(req, res) {
    const { email, lspId } = _.get(req, 'swagger.params.data.value');
    const forgotPasswordAPI = new ForgotPasswordAPI(req.$logger, configuration);

    await validateRecaptcha(req);
    await forgotPasswordAPI.createCode(email.toLowerCase(), lspId);

    return sendResponse(res, 200, { message: `An email has been sent to ${email}` });
  },
  async update(req, res) {
    const code = _.get(req, 'swagger.params.code.value');
    const credentials = _.get(req, 'swagger.params.data.value');

    credentials.code = code;
    await validateRecaptcha(req);
    const forgotPasswordAPI = new ForgotPasswordAPI(req.$logger, configuration, req.flags.mock);

    try {
      await forgotPasswordAPI.setNewPassword(credentials);
    } catch (err) {
      return apiResponse.sendErrorResponse(res, 500, err);
    }

    return sendResponse(res, 200, { message: 'The password has been succesfully updated' });
  },
};
