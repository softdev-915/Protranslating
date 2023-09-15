const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const RequestTypeAPI = require('./request-type-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async requestTypeExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new RequestTypeAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'requestTypeExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async requestTypeDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestTypeAPI = new RequestTypeAPI(req.$logger, { user, configuration });
    const requestTypeId = _.get(req, 'swagger.params.requestTypeId.value');
    const requestType = await requestTypeAPI.detail(requestTypeId);
    return sendResponse(res, 200, {
      requestType,
    });
  },
  async requestTypeList(req, res) {
    const requestTypeFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const requestTypeAPI = new RequestTypeAPI(req.$logger, { user, configuration });
    const requestTypeId = _.get(req, 'swagger.params.requestTypeId.value');

    // Set filter params
    requestTypeFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    requestTypeFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    requestTypeFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (requestTypeId) {
      requestTypeFilters._id = requestTypeId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(requestTypeAPI, req, { listMethod: 'requestTypeList' });
    const requestTypes = await paginableApiDecorator.list(requestTypeFilters);
    return sendResponse(res, 200, requestTypes);
  },
  async requestTypeCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestTypeAPI = new RequestTypeAPI(req.$logger, { user });
    const requestType = _.get(req, 'swagger.params.data.value');
    const requestTypeCreated = await requestTypeAPI
      .create(requestType);
    return sendResponse(res, 200, { requestType: requestTypeCreated });
  },
  async requestTypeUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestTypeAPI = new RequestTypeAPI(req.$logger, { user });
    const requestType = _.get(req, 'swagger.params.data.value');
    const requestTypeId = _.get(req, 'swagger.params.requestTypeId.value');
    requestType._id = requestTypeId;
    const requestTypeUpdated = await requestTypeAPI
      .update(requestType);
    return sendResponse(res, 200, { requestType: requestTypeUpdated });
  },
};
