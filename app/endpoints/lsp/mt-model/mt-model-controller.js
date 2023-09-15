const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const MtModelAPI = require('./mt-model-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async mtModelExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtModelAPI = new MtModelAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(mtModelAPI, req, { listMethod: 'mtModelExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async mtModelList(req, res) {
    const mtModelFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const mtModelAPI = new MtModelAPI(req.$logger, { user, configuration });

    mtModelFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    mtModelFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    mtModelFilters.deleted = _.get(req, 'swagger.params.withDeleted.value', false);

    const paginableApiDecorator = new PaginableAPIDecorator(mtModelAPI, req, { listMethod: 'list' });
    const mtModels = await paginableApiDecorator.list(mtModelFilters);
    return sendResponse(res, 200, mtModels);
  },
  async getMtModel(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtModelAPI = new MtModelAPI(req.$logger, { user, configuration });
    const mtModelId = _.get(req, 'swagger.params.mtModelId.value');
    const mtModels = await mtModelAPI.list({ _id: mtModelId });
    const mtModel = _.get(mtModels, 'list[0]');
    return sendResponse(res, 200, {
      mtModel: mtModel,
    });
  },
  async mtModelCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtModelAPI = new MtModelAPI(req.$logger, { user });
    const mtModel = _.get(req, 'swagger.params.data.value');
    const mtModelCreated = await mtModelAPI
      .create(user, mtModel);
    return sendResponse(res, 200, { mtModel: mtModelCreated });
  },
  async mtModelUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtModelAPI = new MtModelAPI(req.$logger, { user });
    const mtModel = _.get(req, 'swagger.params.data.value');
    const mtModelId = _.get(req, 'swagger.params.mtModelId.value');
    mtModel._id = mtModelId;
    const mtModelUpdated = await mtModelAPI
      .update(user, mtModel);
    return sendResponse(res, 200, { mtModel: mtModelUpdated });
  },
};
