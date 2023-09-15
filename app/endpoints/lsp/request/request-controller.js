const _ = require('lodash');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const { extractUserIp } = require('../../../utils/request');
const configuration = require('../../../components/configuration');

const { sendResponse, RestError } = apiResponse;
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const RequestAPI = require('./request-api');

module.exports = {
  async requestExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const api = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req,
      bucket,
    });
    const csvHeaders = _.get(req, 'swagger.params.csvHeaders.value', []);
    const supportsIpQuoting = _.get(user, 'lsp.supportsIpQuoting', false);
    const columnOptions = supportsIpQuoting && csvHeaders.length > 1
      ? { headers: csvHeaders }
      : undefined;
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'requestExport',
      req,
    });
    await paginableApiDecorator.list({ columnOptions }, res, req);
  },
  async requestList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const api = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const paginableApiDecorator = new PaginableAPIDecorator(api, req);
    let requestsList;
    try {
      requestsList = await paginableApiDecorator.list({}, res, req);
    } catch (e) {
      if (e.code) {
        throw e;
      } else {
        const message = e.message || e;
        throw new RestError(500, { message, stack: e.stack });
      }
    }
    return sendResponse(res, 200, requestsList);
  },
  async requestDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const api = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    let request;
    try {
      request = await api.findOneWithWorkflows(requestId, { withCATData });
      const { isUserIpAllowed = true } = res.locals;
      return sendResponse(res, 200, { request, isUserIpAllowed });
    } catch (e) {
      if (e.code) {
        throw e;
      } else {
        const message = e.message || e;
        throw new RestError(500, { message, stack: e.stack });
      }
    }
  },
  async requestCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const newTranslationRequest = _.get(req, 'swagger.params.data.value');
    if (req.query.mockPm) {
      newTranslationRequest.mockPm = req.query.mockPm;
    }
    if (req.flags.mockApiFailure) {
      throw new RestError(400, {
        message: 'Error updating request: mockApiFailure',
      });
    }
    const bucket = chooseProperBucket(configuration);
    const clientIP = extractUserIp(req);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      bucket,
    });
    const createdTranslationRequest = await requestApi.create(newTranslationRequest, clientIP);
    return sendResponse(res, 200, { request: createdTranslationRequest });
  },
  async saveQuoteRequestData(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const templatesData = _.get(req, 'swagger.params.data.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    try {
      const editedRequest = await requestApi.saveRequestQuoteData(requestId, templatesData);
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      const requestReadAgain = await requestApi.findOne(requestId);
      throw new RestError(code, {
        data: requestReadAgain,
        message,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async requestEdit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const request = _.get(req, 'swagger.params.data.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      bucket,
    });
    try {
      if (req.flags.mockApiFailure) {
        throw new RestError(400, {
          message: 'Error updating request: mockApiFailure',
        });
      }
      await requestApi.edit(user, request);
      const editedRequest = await requestApi.findOneWithWorkflows(request._id);
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      const requestReadAgain = await requestApi.findOne(request._id);
      throw new RestError(code, {
        data: requestReadAgain,
        message: `Error updating request: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async approveQuote(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
    });
    const request = await requestApi.approveQuote(requestId);
    requestUtils.setReadDate(req, 'request', request);
    return sendResponse(res, 200);
  },
  async calculatePatentFee(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const requestId = _.get(req, 'swagger.params.requestId.value');
      const translationOnly = _.get(req, 'swagger.params.translationOnly.value');
      const patent = _.get(req, 'swagger.params.data.value');
      const requestApi = new RequestAPI({
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      });
      const request = await requestApi.updatePatent(requestId, patent, translationOnly);
      return sendResponse(res, 200, { request });
    } catch (err) {
      req.$logger.error(`Failed to update patent fee: ${err.message}`);
      throw err instanceof RestError ? err : new RestError(500, { message: err.message });
    }
  },
  async forceUpdatePatentFee(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const requestId = _.get(req, 'swagger.params.requestId.value');
      const countries = _.get(req, 'swagger.params.data.value');
      const requestApi = new RequestAPI({
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      });
      const request = await requestApi.forceUpdatePatentFee(requestId, countries);
      return sendResponse(res, 200, { request });
    } catch (err) {
      req.$logger.error(`Failed to update patent fee: ${err.message}`);
      throw err instanceof RestError ? err : new RestError(500, { message: err.message });
    }
  },
  async importFilesToPCat(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
    });
    const request = await requestApi.importFilesToPCat(requestId, body);
    return sendResponse(res, 200, { request });
  },
};
