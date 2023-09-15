const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('bson');
const logUtils = require('../log/utils');

const filterRequest = (req, propertiesFilter) => {
  const filteredRequest = {
    id: req.id,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    headers: req.headers,
    method: req.method,
    params: req.params,
    query: req.query,
    sessionID: req.sessionID,
    httpVersion: req.httpVersion,
    httpVersionMajor: req.httpVersionMajor,
    httpVersionMinor: req.httpVersionMinor,
  };
  if (req.body && req.headers['content-type'] && req.headers['content-type'].indexOf('application/json') >= 0) {
    filteredRequest.body = logUtils.filterSensibleProperties(req.body, propertiesFilter);
    filteredRequest.bodyPlainText = JSON.stringify(filteredRequest.body);
    filteredRequest.headers['content-length'] = JSON.stringify(filteredRequest.body).length;
  }
  if (req.headers['x-forwarded-for']) {
    // Unwrap tokenization
    const ipTokenList = req.headers['x-forwarded-for'] || '';
    filteredRequest.ip = ipTokenList.replace(/^.*,/, '');
  }
  return filteredRequest;
};

const filterResponse = (res, propertiesFilter, shouldStoreBody) => {
  const filteredResponse = {
    statusCode: res.statusCode,
    headers: _.get(res, '_headers', ''),
    req: {
      url: _.get(res, 'req.url', ''),
      method: _.get(res, 'req.method', ''),
    },
  };
  if (res.sentBody && res._headers['content-type']
    && res._headers['content-type'].indexOf('application/json') >= 0) {
    // only save errors bodies in the range of 500
    if (shouldStoreBody && res.statusCode.toString().match(/^5\d{2}$/)) {
      filteredResponse.body = logUtils.filterSensibleProperties(
        JSON.parse(res.sentBody),
        propertiesFilter,
      );
      filteredResponse.bodyPlainText = JSON.stringify(filteredResponse.body);
      filteredResponse.headers['content-length'] = JSON.stringify(filteredResponse.body).length;
    }
  }
  return filteredResponse;
};

const _getLspId = (req) => {
  // Check if user exist
  if (req.session && req.session.user) {
    return _.get(req, 'session.user.lsp._id');
  } if (req.$user) {
    return req.$user.lsp._id;
  }
  // Check if lspId is in req.body
  return _.get(req, 'body.lspId', null);
};

const buildAudit = (req, propertiesFilter) => {
  const timestamp = moment().utc().toDate();
  const lspId = _getLspId(req);
  const _id = new ObjectId();
  const audit = {
    _id: _id.toString(),
    timestamp,
    createdAt: timestamp,
    req: filterRequest(req, propertiesFilter),
    lspId,
  };

  if (req.session && req.session.user) {
    const { user } = req.session;
    audit.user = { _id: user._id, email: user.email };
  } else if (req.$user) {
    audit.user = { _id: req.$user._id, email: req.$user.email };
  }
  return audit;
};

const shouldRecordContent = (res) => res._headers && res._headers['content-type']
  && res._headers['content-type'].length
  && res._headers['content-type'].indexOf('application/json') >= 0;

const wrapResponse = (res) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];
  res.write = (chunk, encoding, callback) => {
    if (shouldRecordContent(res)) {
      chunks.push(chunk);
    }
    oldWrite.apply(res, [chunk, encoding, callback]);
  };
  res.end = (chunk, encoding, callback) => {
    if (shouldRecordContent(res) && chunk) {
      chunks.push(chunk);
    }
    if (chunks.length) {
      res.sentBody = Buffer.concat(chunks).toString('utf8');
    } else {
      res.sentBody = null;
    }
    oldEnd.apply(res, [chunk, encoding, callback]);
  };
};

module.exports = {
  filterRequest,
  filterResponse,
  buildAudit,
  shouldRecordContent,
  wrapResponse,
};
