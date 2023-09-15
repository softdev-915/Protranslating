const _ = require('lodash');
const Promise = require('bluebird');
const configuration = require('../../components/configuration');
const apiResponse = require('../../components/api-response');
const AuthApi = require('./auth-api');
const AuthCredentialsApi = require('./auth-credentials-api');
const LspAPI = require('../lsp/lsp/lsp-api');
const { RestError } = require('../../components/api-response');

const { sendResponse } = apiResponse;

module.exports = {
  async login(req, res) {
    // search email in the database and retrieve the idp
    const credentials = _.get(req, 'swagger.params.data.value');
    const authApi = new AuthApi(req.$logger, configuration, { mock: req.flags.mock }, req);
    credentials.clientIP = req.connection.remoteAddress;
    const user = await authApi.authenticateUser(credentials);
    const serializedUser = authApi.serializeUser(user);
    const response = { code: 200, body: {} };

    if (_.get(serializedUser, 'useTwoFactorAuthentification', false)) {
      req.session.notAuthorizedUser = _.omit(serializedUser, ['profileImage', 'lsp.logoImage']);
      response.code = 202;
    } else {
      req.session.user = _.omit(serializedUser, ['profileImage', 'lsp.logoImage']);
      response.body.user = serializedUser;
    }
    // csrf can be sent here
    if (_.isFunction(req.csrfToken)) {
      const csrfToken = req.csrfToken();

      response.body.csrfToken = csrfToken;
      if (_.isEmpty(csrfToken)) {
        req.$logger.debug(`CSRF value is empty. lastAccess: ${_.get(req, 'session.lastAccess')} userEmail: ${_.get(req, 'session.user.email')}`);
      }
    } else {
      req.$logger.debug(`CSRF function does not exist. lastAccess: ${_.get(req, 'session.lastAccess')} userEmail: ${_.get(req, 'session.user.email')}`);
    }
    return sendResponse(res, response.code, response.body);
  },

  async loginWithHOTP(req, res) {
    const credentials = _.get(req, 'swagger.params.data.value');
    const user = _.get(req, 'session.notAuthorizedUser');
    const lspAPI = new LspAPI({ logger: req.$logger, user, configuration });
    const authCredentialsApi = new AuthCredentialsApi({
      logger: req.$logger,
      mock: req.flags.mock,
      req,
    });

    if (await authCredentialsApi.verifyHOTP(user, credentials.hotp)) {
      req.session.user = user;
      delete req.session.notAuthorizedUser;
      const lsp = await lspAPI.lspDetail();
      user.lsp.logoImage = lsp.logoImage;
      return sendResponse(res, 200, { user });
    }
    throw new RestError(401, { message: 'Invalid hotp' });
  },

  async logout(req, res) {
    req.$user = _.clone(req.session.user);
    const authCredentialsApi = new AuthCredentialsApi({
      logger: req.$logger,
      mock: req.flags.mock,
      user: req.$user,
      req,
    });
    try {
      await authCredentialsApi.deleteUserSessions();
      delete req.session.user;
      await Promise.promisify(req.session.destroy, { context: req.session })();
    } catch (err) {
      return apiResponse.sendErrorResponse(res, 500, err);
    }
    res.clearCookie('lms-session', { path: '/' });
    return sendResponse(res, 200, {});
  },
  async currentUser(req, res) {
    const { user } = req.session;
    const authApi = new AuthApi(req.$logger, configuration, { mock: req.flags.mock }, req);
    const lspAPI = new LspAPI({ logger: req.$logger, user: user, configuration });
    const profileImage = await authApi.getProfileImage(user._id);
    const { logoImage } = await lspAPI.lspDetail();
    _.set(user, 'profileImage', profileImage);
    _.set(user, 'lsp.logoImage', logoImage);
    const payload = {
      user: req.session.user,
      csrfToken: req.csrfToken(),
    };
    return sendResponse(res, 200, payload);
  },
};
