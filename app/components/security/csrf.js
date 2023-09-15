const Tokens = require('csrf');
const _ = require('lodash');
const applicationLoger = require('../log/logger');

// Do not protect these special cases
const excludedUrls = [
  '/api/auth',
  '/api/auth/forgot-password',
  '/api/upload-test-speed',
  '/api/log/create',
  '/api/auth/ssoCallback',
];
// Also exclude cases using regexp
const excludedUrlsPatterns = [
  '^/api/auth/forgot-password/.*',
  '^/api/lsp/selector',
  '^/api/log/create$',
  '^/api/auth/ssoCallback',
].map((pattern) => new RegExp(pattern));

const matchOnePatten = (url) => {
  let match = false;

  excludedUrlsPatterns.forEach((regExp) => {
    // test all regexp
    if (url.match(regExp)) {
      match = true;
    }
  });
  return match;
};

const logInvalidCSRFToken = (req) => {
  const tokens = new Tokens();
  const csrfSecretToken = req.session.csrfSecret;
  const headerCsrfToken = req.headers['csrf-token'];
  const isVerified = tokens.verify(csrfSecretToken, headerCsrfToken);
  const logger = req.$logger || applicationLoger;

  logger.debug(
    `CSRF Invalid token. csrfSecretToken: '${csrfSecretToken}' headerCsrfToken: '${headerCsrfToken}' `
    + `isVerified: ${isVerified} lastAccess: ${req.session.lastAccess} userEmail: ${_.get(req, 'session.user.email')}`,
  );
};

module.exports = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  if (excludedUrls.indexOf(req.url) !== -1 || matchOnePatten(req.url)) {
    // Allow this url to fail silently
    return next();
  }
  logInvalidCSRFToken(req);
  return next(err);
};
