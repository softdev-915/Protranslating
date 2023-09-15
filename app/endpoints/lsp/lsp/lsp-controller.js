const _ = require('lodash');
const LspAPI = require('./lsp-api');
const RecaptchaValidator = require('../../../components/recaptcha');
const { RestError, sendResponse } = require('../../../components/api-response');
const configuration = require('../../../components/configuration');
const requestUtils = require('../../../utils/request');

async function validateRecaptcha(req) {
  const recaptcha = _.get(req, 'swagger.params.data.value.recaptcha');
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
  async list(req, res) {
    await validateRecaptcha(req);
    const email = _.get(req, 'swagger.params.data.value.email');
    const lspIds = _.get(req, 'swagger.params.data.value.lspIds');
    const lspAPI = new LspAPI({
      configuration,
      logger: req.$logger,
    });
    let lspList = [];

    if (!_.isNil(lspIds)) {
      lspList = await lspAPI.findLspsById(lspIds);
    } else {
      lspList = await lspAPI.list(email, lspIds);
    }

    return sendResponse(res, 200, lspList);
  },
  async getLspListByEmail(req, res) {
    const email = _.get(req, 'swagger.params.email.value');
    const lspAPI = new LspAPI({
      configuration,
      logger: req.$logger,
    });
    let lspList = [];
    lspList = await lspAPI.list(email);
    return sendResponse(res, 200, lspList);
  },

  async lspDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspAPI = new LspAPI({
      configuration,
      user,
      logger: req.$logger,
    });
    const lspResponse = await lspAPI.lspDetail();
    return sendResponse(res, 200, { lsp: lspResponse });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lsp = _.get(req, 'swagger.params.data.value');
    const mock = _.get(req, 'flags.mock', false);
    const lspAPI = new LspAPI({
      user,
      configuration,
      logger: req.$logger,
      mock,
    });
    const lspUpdated = await lspAPI.update(lsp);

    if (mock && _.has(user, 'lsp.logoImage')) {
      lspUpdated.logoImage = user.lsp.logoImage;
    }
    // Update lsp in session
    user.lsp = lspUpdated;
    return sendResponse(res, 200, { lsp: lspUpdated });
  },
};
