const _ = require('lodash');
const passport = require('passport');
const bodyParser = require('body-parser');
const AuthApi = require('../../endpoints/auth/auth-api');
const configuration = require('../../components/configuration');
const strategy = require('./saml-strategy');

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const authenticateUser = async (req, res, credentials) => {
  try {
    const authApi = new AuthApi(req.$logger, configuration, { mock: req.flags.mock }, req);
    req.$logger.debug(`SAML Auth: Authenticating user via SAML ${credentials.email}`);
    const user = await authApi.authenticateUserSaml(credentials);
    const serializedUser = authApi.serializeUser(user);
    req.session.user = _.omit(serializedUser, ['profileImage', 'lsp.logoImage']);
    if (!_.isFunction(req.csrfToken)) {
      req.$logger.debug(`SAML Auth: CSRF function does not exist. lastAccess: ${_.get(req, 'session.lastAccess')} userEmail: ${_.get(req, 'session.user.email')}`);
      return res.redirect(301, '/login?samlError=500');
    }
    const csrfToken = req.csrfToken();
    if (_.isEmpty(csrfToken)) {
      req.$logger.debug(`SAML Auth: CSRF value is empty. lastAccess: ${_.get(req, 'session.lastAccess')} userEmail: ${_.get(req, 'session.user.email')}`);
      return res.redirect(301, '/login?samlError=500');
    }
    res.cookie('csrf-token-holder', csrfToken);
    res.redirect(301, '/home');
  } catch (e) {
    req.$logger.debug(`SAML Auth: Failed to authenticate user via SAML ${credentials.email}. Error: ${e}`);
    const code = _.get(e, 'code', 500);
    res.redirect(301, `/login?samlError=${code}`);
  }
};

const interceptor = (app) => {
  app.post(
    '/api/auth/ssoCallback/:lspId/:companyId',
    bodyParser.urlencoded({ extended: false }),
    (req, res, next) => {
      const envConfig = configuration.environment;
      const isProductionEnvironment = envConfig.NODE_ENV === 'PROD';
      const shouldMockSuccess = req.query.mockSSOSuccess === 'true';
      passport.authenticate('saml', { failureRedirect: '/login?samlError=403', failureMessage: true, failWithError: true }, (err, user) => {
        if (err) {
          if (isProductionEnvironment || !shouldMockSuccess) {
            req.$logger.error(`SAML Auth: Failed to authenticate user via SAML: ${err}`);
            return res.redirect(301, '/login?samlError=403');
          }
          if (!isProductionEnvironment && shouldMockSuccess) {
            user = {
              email: req.query.mockSSOEmail,
              lsp: req.params.lspId,
            };
          }
        }
        try {
          return authenticateUser(req, res, user);
        } catch (error) {
          req.$logger.error(`SAML Auth: Failed to authenticate user via SAML: ${error}`);
          return res.redirect(301, '/login?samlError=401');
        }
      })(req, res, next);
    });
};

module.exports = (app, logger) => {
  interceptor(app, logger);
};
