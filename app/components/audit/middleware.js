const _ = require('lodash');
const bodyParserFunc = require('body-parser');
const auditUtils = require('./audit-utils');
const AuditTrail = require('./audit-trail');
const requestUtils = require('../../utils/request');

const EXCLUDED_URL_PATTERNS = [
  /^\/api\/auth\/heartbeat$/i,
  /\/api\/lsp\/[a-zA-Z0-9]+\/audit/i,
  /\/api\/lsp\/[a-zA-Z0-9]+\/user\/[a-zA-Z0-9]+\/toast/i,
  /^\/api\/log\/create$/i,
  /\/api\/lsp\/[a-zA-Z0-9]+\/portalcat/i,
  /\/api\/lsp\/[a-zA-Z0-9]+\/company\/[a-zA-Z0-9]+\/translation-memory/i,
];
const AUTH_URL = '/api/auth';
const preventAuditLogWhenUserIsNotLogged = (req) => _.isNil(requestUtils.getUserFromSession(req)) && req.url !== AUTH_URL;
const shouldAvoidAudit = (req) => (
  EXCLUDED_URL_PATTERNS.some((excludedUrlPattern) => req.url.match(excludedUrlPattern))
  || preventAuditLogWhenUserIsNotLogged(req)
);
/**
 * Grabs all the auditable services and commits the audit trail by providing
 * the response object
 * @param {object} options The middleware options
 * @param {function} options.onFinish optional function that is executed after the request end
 * @param {function} options.auditTrailFactory optional function that creates an AuditTrail.
 */
module.exports = (options) => {
  const bodyParser = bodyParserFunc.json(({ limit: options.bodyLimit }));
  return (req, res, next) => {
    let requestError;
    const clonedRes = _.cloneDeep(res);
    const avoidAuditRequest = shouldAvoidAudit(req);
    if (avoidAuditRequest || !req.path.includes('/api/')) {
      return next();
    }
    // don't store heartbeats
    if (req.path.indexOf('/api/') === 0 && !avoidAuditRequest) {
      const auditTrail = new AuditTrail(options);
      const _commitAudits = () => {
        res.removeListener('finish', _commitAudits);
        res.removeListener('close', _commitAudits);
        try {
          auditTrail.storeResponse(res);
          if (options && options.onFinish) {
            options.onFinish(null, res);
          }
          req.$logger.info('response sent');
        } catch (storeErr) {
          const message = storeErr.message || storeErr;
          req.$logger.error(`Error Storing audit: ${message}`);
          if (options && options.onFinish) {
            options.onFinish(storeErr, res);
          }
        }
      };
      res.on('finish', _commitAudits);
      res.on('close', _commitAudits);
      auditUtils.wrapResponse(clonedRes);
      bodyParser(req, res, (err) => {
        requestError = err;
        req.$logger.info('request received');
        try {
          auditTrail.storeRequest(req);
        } catch (auditStoreError) {
          const message = auditStoreError.message || auditStoreError;
          req.$logger.error(`Error storing audit: ${message}`);
          if (!requestError) {
            requestError = auditStoreError;
          }
        }
        next(requestError);
      });
    } else {
      next();
    }
  };
};
