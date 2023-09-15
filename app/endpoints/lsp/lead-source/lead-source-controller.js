const _ = require('lodash');
const LeadSourceAPI = require('./lead-source-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;
const { pipeWithErrors } = require('../../../utils/stream/');

module.exports = {
  async leadSourceExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LeadSourceAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const csvStream = await api.leadSourceExport(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async leadSourceList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const leadSourceId = _.get(req, 'swagger.params.leadSourceId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    // Set filter params
    filters.__tz = _.get(req.headers, 'lms-tz', '0');
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (leadSourceId) {
      filters._id = leadSourceId;
    }
    const leadSourceAPI = new LeadSourceAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(leadSourceAPI, req);
    const leadSources = await paginableApiDecorator.list(filters);

    if (leadSourceId) {
      if (leadSources && leadSources.list.length) {
        return sendResponse(res, 200, {
          leadSource: leadSources.list[0],
        });
      }
      throw new RestError(404, { message: `Lead source ${leadSourceId} does not exist` });
    } else {
      return sendResponse(res, 200, leadSources);
    }
  },
  async leadSourceCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const leadSourceAPI = new LeadSourceAPI(req.$logger, { user });
    const leadSource = _.get(req, 'swagger.params.data.value');
    const leadSourceCreated = await leadSourceAPI.create(leadSource);
    return sendResponse(res, 200, { leadSource: leadSourceCreated });
  },
  async leadSourceUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const leadSourceAPI = new LeadSourceAPI(req.$logger, { user });
    const leadSourceId = _.get(req, 'swagger.params.leadSourceId.value');
    const leadSource = _.get(req, 'swagger.params.data.value');
    leadSource._id = leadSourceId;
    const leadSourceUpdated = await leadSourceAPI.update(leadSource);
    return sendResponse(res, 200, { leadSource: leadSourceUpdated });
  },
};
