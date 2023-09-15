const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const SchedulerStatusAPI = require('./scheduling-status-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async schedulingStatusExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new SchedulerStatusAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'schedulingStatusExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async schedulingStatusDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const schedulingStatusAPI = new SchedulerStatusAPI(req.$logger, { user, configuration });
    const schedulingStatusId = _.get(req, 'swagger.params.schedulingStatusId.value');
    const schedulingStatus = await schedulingStatusAPI.detail(schedulingStatusId);
    return sendResponse(res, 200, {
      schedulingStatus,
    });
  },
  async schedulingStatusList(req, res) {
    const schedulingStatusFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const schedulingStatusAPI = new SchedulerStatusAPI(req.$logger, { user, configuration });
    const schedulingStatusId = _.get(req, 'swagger.params.schedulingStatusId.value');

    // Set filter params
    schedulingStatusFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    schedulingStatusFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    schedulingStatusFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (schedulingStatusId) {
      schedulingStatusFilters._id = schedulingStatusId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(schedulingStatusAPI, req, { listMethod: 'schedulingStatusList' });
    const schedulingStatuses = await paginableApiDecorator.list(schedulingStatusFilters);
    return sendResponse(res, 200, schedulingStatuses);
  },
  async schedulingStatusCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const schedulingStatusAPI = new SchedulerStatusAPI(req.$logger, { user });
    const schedulingStatus = _.get(req, 'swagger.params.data.value');
    const schedulingStatusCreated = await schedulingStatusAPI
      .create(schedulingStatus);
    return sendResponse(res, 200, { schedulingStatus: schedulingStatusCreated });
  },
  async schedulingStatusUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const schedulingStatusAPI = new SchedulerStatusAPI(req.$logger, { user });
    const schedulingStatus = _.get(req, 'swagger.params.data.value');
    const schedulingStatusId = _.get(req, 'swagger.params.schedulingStatusId.value');
    schedulingStatus._id = schedulingStatusId;
    const schedulingStatusUpdated = await schedulingStatusAPI
      .update(schedulingStatus);
    return sendResponse(res, 200, { schedulingStatus: schedulingStatusUpdated });
  },
};
