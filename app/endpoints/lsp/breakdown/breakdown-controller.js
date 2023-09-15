const _ = require('lodash');
const BreakdownAPI = require('./breakdown-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async breakdownExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new BreakdownAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'breakdownExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const breakdownId = _.get(req, 'swagger.params.breakdownId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (breakdownId) {
      filters._id = breakdownId;
    }
    const breakdownAPI = new BreakdownAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(breakdownAPI, req);
    const breakdowns = await paginableApiDecorator.list(filters);

    if (breakdownId) {
      if (breakdowns && breakdowns.list.length) {
        return sendResponse(res, 200, {
          breakdown: breakdowns.list[0],
        });
      }
      throw new RestError(404, { message: `Breakdown ${breakdownId} does not exist` });
    } else {
      return sendResponse(res, 200, breakdowns);
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const breakdownAPI = new BreakdownAPI(req.$logger, { user });
    const breakdown = _.get(req, 'swagger.params.data.value');
    const breakdownCreated = await breakdownAPI.create(breakdown);
    return sendResponse(res, 200, { breakdown: breakdownCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const breakdownAPI = new BreakdownAPI(req.$logger, { user });
    const breakdownId = _.get(req, 'swagger.params.breakdownId.value');
    const breakdown = _.get(req, 'swagger.params.data.value');
    breakdown._id = breakdownId;
    const breakdownUpdated = await breakdownAPI.update(breakdown);
    return sendResponse(res, 200, { breakdown: breakdownUpdated });
  },
};
