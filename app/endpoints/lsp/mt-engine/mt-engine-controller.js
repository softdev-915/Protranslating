const _ = require('lodash');
const MtEngineApi = require('./mt-engine-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');

const { fileContentDisposition, sendResponse } = apiResponse;
const { pipeWithErrors } = require('../../../utils/stream');

module.exports = {
  async export(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new MtEngineApi(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'export' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const mtEngineApi = new MtEngineApi(req.$logger, { user, configuration });
    const paginableApiDecorator = new PaginableAPIDecorator(mtEngineApi, req);
    const mtEngines = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, mtEngines);
  },
  async mtEngineDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const mtEngineApi = new MtEngineApi(req.$logger, { user, configuration });
    const mtEngine = await mtEngineApi.mtEngineDetail(id);
    return sendResponse(res, 200, { mtEngine });
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtEngineApi = new MtEngineApi(req.$logger, { user, configuration });
    const mtEngine = _.get(req, 'swagger.params.data.value');
    const mtEngineCreated = await mtEngineApi.create(mtEngine);
    return sendResponse(res, 200, { mtEngine: mtEngineCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtEngineApi = new MtEngineApi(req.$logger, { user, configuration });
    const id = _.get(req, 'swagger.params.id.value');
    const mtEngine = _.get(req, 'swagger.params.data.value');
    mtEngine._id = id;
    const mtEngineUpdated = await mtEngineApi.update(mtEngine);
    return sendResponse(res, 200, { mtEngine: mtEngineUpdated });
  },
};
