const _ = require('lodash');
const { ObjectId } = require('mongoose/lib/types');

const getUserFromSession = (req) => {
  let user = null;
  if (_.get(req, 'session.user')) {
    user = req.session.user;
  }
  return user;
};

const getTimezoneValueFromSession = req =>
  _.get(req, 'session.lmsTz', '0');

const extractPaginationParams = (req, readFromKey = 'query.params') => ({
  q: _.get(req, `${readFromKey}.q`),
  page: parseInt(_.get(req, `${readFromKey}.page`), 10),
  limit: parseInt(_.get(req, `${readFromKey}.limit`), 10),
  filter: _.get(req, `${readFromKey}.filter`),
  sort: _.get(req, `${readFromKey}.sort`),
});

const extractLocale = () => ({
  locale: 'en',
  strength: 2,
});

const extractUserIp = (req) => {
  let clientIP = _.get(req, 'headers["x-forwarded-for"]');
  if (!clientIP) {
    clientIP = req.connection.remoteAddress;
  }
  if (clientIP.indexOf(',') !== -1) {
    // if comma is present on IP, grab the first part
    clientIP = clientIP.split(',')[0];
  }
  return clientIP;
};

const extractLspFromURL = (req) => {
  if (req.url.indexOf('/api/lsp/') === 0) {
    let lspId = req.url.substring(9);
    lspId = lspId.substring(0, lspId.indexOf('/'));
    return lspId;
  }
  return null;
};

const parsePaginationFilter = (filter) => {
  try {
    return JSON.parse(filter);
  } catch (e) {
    return filter;
  }
};

const setReadDate = (req, key, entity) => {
  const user = getUserFromSession(req);

  if (_.isFunction(entity.toObject)) {
    entity = entity.toObject();
  }

  if (!_.has(entity, '_id')) {
    return;
  }
  let id = entity._id;
  if (id instanceof ObjectId) {
    id = id.toString();
  }
  _.set(user, `readDates.${key}.${id}`, _.get(entity, 'updatedAt'));
  if (key === 'request') {
    const workflows = _.get(entity, 'workflows', []);
    workflows.forEach((workflow) => {
      const workflowId = _.get(workflow, '_id');
      const workflowUpdatedAt = _.get(workflow, 'updatedAt');
      _.set(user, `readDates.workflow.${workflowId}`, workflowUpdatedAt);
    });
  }
};

module.exports = {
  extractLspFromURL,
  extractPaginationParams,
  extractLocale,
  extractUserIp,
  getUserFromSession,
  parsePaginationFilter,
  getTimezoneValueFromSession,
  setReadDate,
};
