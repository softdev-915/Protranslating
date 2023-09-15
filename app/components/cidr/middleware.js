const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../log/logger');
const { RestError } = require('../api-response');
const { models: mongooseSchema } = require('../database/mongo');
const { ipComplies } = require('../../utils/security');
const { extractUserIp } = require('../../utils/request');

const getRequestParams = (url, pattern) => {
  const patternSegments = pattern.split('/').filter(Boolean);
  const urlSegments = url.split(/\/|\?/).filter(Boolean);
  return patternSegments.reduce((params, segment, index) => {
    const value = urlSegments[index];
    if (segment !== value) {
      const key = segment.slice(1, segment.length - 1);
      params[key] = value;
    }
    return params;
  }, {});
};
const urlRules = [
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/request\/[a-zA-Z0-9]+\/document.*/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/request/{requestId}/document',
    method: /GET|DELETE/,
    cidr: 'company',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/request\/[a-zA-Z0-9]+\/languageCombination\/[a-zA-Z0-9]+\/documents.*/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/request/{requestId}/languageCombination/{languageCombinationId}/documents',
    method: /GET|DELETE/,
    cidr: 'request',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/request\/[a-zA-Z0-9]+\/task\/[a-zA-Z0-9]+\/document.*/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/request/{requestId}/task/{taskId}/document/{documentId}',
    method: /GET|DELETE/,
    cidr: 'company',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/request\/([a-zA-Z0-9]+)\/task\/[a-zA-Z0-9]+\/providerTask\/[a-zA-Z0-9]+\/document.*/i,
    pattern: '/api/lsp/{lspId}/request/{requestId}/task/{taskId}/providerTask/{providerTaskId}/document/{documentId}',
    method: /GET|DELETE/,
    cidr: 'request',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/pc-settings\/resources\/([a-zA-Z0-9]+)\/download\?/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/pc-settings/resources/{resourceId}/download',
    method: /GET/,
    cidr: 'company',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/pc-settings\/resources/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/pc-settings/resources',
    method: /GET/,
    cidr: 'company',
    isOperationAllowed: true,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/pc-settings\/resources/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/pc-settings/resources',
    method: /POST|PUT|DELETE/,
    cidr: 'company',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]{24})$/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}',
    method: /GET/,
    cidr: 'company',
    isOperationAllowed: true,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/request\/([a-zA-Z0-9]{24})(\?.+)*$/i,
    pattern: '/api/lsp/{lspId}/request/{requestId}',
    method: /GET/,
    cidr: 'request',
    isOperationAllowed: true,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/request\/[a-zA-Z0-9]+\/workflow\/([a-zA-Z0-9]{24})$/i,
    pattern: '/api/lsp/{lspId}/request/{requestId}/workflow/{workflowId}',
    method: /GET/,
    cidr: 'request',
    isOperationAllowed: true,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/portalcat\/[a-zA-Z0-9]+\/tfsh/i,
    pattern: '/api/lsp/{lspId}/portalcat/{requestId}/tfsh',
    method: /GET|PUT/,
    cidr: 'request',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/portalcat\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/files/i,
    pattern: '/api/lsp/{lspId}/portalcat/{requestId}/{workflowId}/files',
    method: /GET/,
    cidr: 'request',
    isOperationAllowed: false,
  },
  {
    regex: /\/api\/lsp\/[a-zA-Z0-9]+\/company\/([a-zA-Z0-9]+)\/translation-memory\/([a-zA-Z0-9]+)\/segments/i,
    pattern: '/api/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments',
    method: /GET|POST/,
    cidr: 'company',
    isOperationAllowed: false,
  },
];

const fileActionsPerMethod = {
  GET: 'download',
  POST: 'upload',
  PUT: 'upload',
  DELETE: 'delete',
};

const getLogger = function (req) {
  if (req.$logger) {
    return req.$logger;
  }
  return logger;
};

const extractCompanyCIDR = function (companyId, log) {
  const cid = new ObjectId(companyId);
  return function (dbSchema) {
    log.debug(`CIDR middleware: Searching for Company ${companyId}`);
    return dbSchema.Company.findOneWithDeleted({ _id: cid }).then((company) => {
      if (!company) {
        log.info(`CIDR middleware: Company ${companyId} does not exist`);
        throw new RestError(404, { message: `Company ${companyId} does not exist` });
      } else {
        return _.get(company, 'cidr', []);
      }
    });
  };
};

const extractRequestCIDR = function (requestId, log) {
  const rid = new ObjectId(requestId);
  return function (dbSchema) {
    return dbSchema.Request.findOne({ _id: rid }, { company: 1 }).then((request) => {
      if (!request) {
        log.info(`CIDR middleware: Request ${requestId} does not exist`);
        throw new RestError(404, { message: `Request ${requestId} does not exist` });
      }
      if (_.isNil(_.get(request, 'company._id'))) {
        log.warn(`CIDR middleware: Request ${requestId} has no company`);
        return null;
      }
      return _.get(request.company, 'cidr', []);
    });
  };
};

const dataExtractor = (req, log) => {
  const { url } = req;
  const rule = urlRules.find(({ regex, method }) => method.test(req.method) && regex.test(url));
  if (_.isNil(rule)) {
    return null;
  }

  const result = {
    isOperationAllowed: rule.isOperationAllowed,
  };
  const params = getRequestParams(url, rule.pattern);
  switch (rule.cidr) {
    case 'request': {
      const { requestId } = params;
      result.extractor = extractRequestCIDR(requestId, log);
      break;
    }
    case 'company': {
      const { companyId } = params;
      result.extractor = extractCompanyCIDR(companyId, log);
      break;
    }
    default: return null;
  }
  return result;
};

const middleware = function (options) {
  return function (req, res, next) {
    const s = _.get(options, 'schema', mongooseSchema);
    const log = _.get(options, 'logger', getLogger(req));
    let cidrExtractor;
    log.debug('CIDR middleware: Trying to extract company or request id');
    try {
      cidrExtractor = dataExtractor(req, log);
    } catch (err) {
      log.debug(`Error in CIDR middleware: ${_.get(err, 'message')}`);
      return next(new RestError(400, { message: 'The given id is not valid' }));
    }
    if (_.isNil(cidrExtractor)) {
      log.debug('CIDR middleware: No extractor found');
      return next();
    }
    const clientIP = extractUserIp(req);

    log.debug(`CIDR middleware: Client IP is ${clientIP}`);
    cidrExtractor.extractor(s)
      .then((cidr) => {
        if (!_.isNil(cidr) && !_.isEmpty(cidr)) {
          const rules = cidr.map((c) => c.subnet);
          const isUserIpAllowed = ipComplies(clientIP, rules);
          log.debug(`CIDR middleware: The response is ${cidrExtractor.isOperationAllowed ? '' : 'not '}allowed for the IP ${clientIP}`);
          if (cidrExtractor.isOperationAllowed) {
            res.locals.isUserIpAllowed = isUserIpAllowed;
            return next();
          }
          const action = fileActionsPerMethod[req.method];
          if (isUserIpAllowed) {
            log.debug(`CIDR middleware: IP ${clientIP} is allowed to ${action} files for this company`);
            return next();
          }
          log.info(`CIDR middleware: IP ${clientIP} is not allowed to ${action} files for this company`);
          const message = `Your IP "${clientIP}" is not allowed to ${action} files for this company`;
          next(new RestError(403, {
            message,
            stack: message,
          }));
        } else {
        // if no cidr rules, allow the request (request with no company)
          log.debug('CIDR middleware: no CIDR rules found');
          next();
        }
      })
      .catch((err) => {
        log.debug(`CIDR middleware: error found ${_.get(err, 'message')}`);
        next(err);
      });
  };
};

module.exports = middleware;
