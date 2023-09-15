const _ = require('lodash');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');

const { sendResponse, RestError } = apiResponse;
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const QuoteLmsApi = require('./quote-lms-api');

module.exports = {
  async quoteExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const api = new QuoteLmsApi(req.$logger, {
      user,
      configuration,
      mock: req.flags.mock,
      bucket,
    });
    const csvHeaders = _.get(req, 'swagger.params.csvHeaders.value', []);
    const supportsIpQuoting = _.get(user, 'lsp.supportsIpQuoting', false);
    const columnOptions = supportsIpQuoting && csvHeaders.length > 1
      ? { headers: csvHeaders }
      : null;
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'quoteExport',
      req,
    });
    await paginableApiDecorator.list({ columnOptions }, res, req);
  },
  async quoteList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const api = new QuoteLmsApi(req.$logger, {
      user,
      configuration,
      mock: req.flags.mock,
      bucket,
    });
    const paginableApiDecorator = new PaginableAPIDecorator(api, req);
    let quoteList;
    try {
      quoteList = await paginableApiDecorator.list({}, res, req);
    } catch (e) {
      if (e.code) {
        throw e;
      } else {
        const message = e.message || e;
        throw new RestError(500, { message, stack: e.stack });
      }
    }
    return sendResponse(res, 200, quoteList);
  },
  async quoteDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const quoteApi = new QuoteLmsApi(req.$logger, {
      user,
      configuration,
      mock: req.flags.mock,
    });
    let quoteDetail;
    try {
      quoteDetail = await quoteApi.quoteDetail(requestId);
    } catch (e) {
      if (e.code) {
        throw e;
      } else {
        const message = e.message || e;
        throw new RestError(500, { message, stack: e.stack });
      }
    }
    return sendResponse(res, 200, quoteDetail);
  },
};
