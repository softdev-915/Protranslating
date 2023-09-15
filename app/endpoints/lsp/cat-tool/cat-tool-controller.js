const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const CatToolAPI = require('./cat-tool-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async catToolExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CatToolAPI(req.$logger, { configuration, user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'catToolExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async catToolList(req, res) {
    const catToolFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const catToolAPI = new CatToolAPI(req.$logger, { user, configuration });
    const catToolId = _.get(req, 'swagger.params.catToolId.value');
    // Set filter params
    catToolFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    catToolFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    catToolFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (catToolId) {
      catToolFilters._id = catToolId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(catToolAPI, req, { listMethod: 'catToolList' });
    const catTools = await paginableApiDecorator.list(catToolFilters);
    if (catToolId) {
      if (catTools && catTools.list.length) {
        return sendResponse(res, 200, { catTool: catTools.list[0] });
      }
      throw new RestError(404, { message: `Cat Tool ${catToolId} does not exist` });
    } else {
      return sendResponse(res, 200, catTools);
    }
  },
  async catToolCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const catTool = _.get(req, 'swagger.params.data.value');
    const catToolAPI = new CatToolAPI(req.$logger, { user, configuration });
    const catToolCreated = await catToolAPI.create(user, catTool);
    return sendResponse(res, 200, { catTool: catToolCreated });
  },
  async catToolUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const catToolAPI = new CatToolAPI(req.$logger, { user, configuration });
    const catToolId = _.get(req, 'swagger.params.catToolId.value');
    const catTool = _.get(req, 'swagger.params.data.value');
    catTool._id = catToolId;
    const catToolUpdated = await catToolAPI
      .update(user, catTool);
    return sendResponse(res, 200, { catTool: catToolUpdated });
  },
};
