const _ = require('lodash');
const SchedulerAPI = require('./scheduler-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const requestUtils = require('../../../utils/request');
const { streamFile, sendResponse, RestError } = require('../../../components/api-response');

module.exports = {
  async schedulerExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const schedulerApi = new SchedulerAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(schedulerApi, req, { listMethod: 'schedulerExport' });
    const file = await paginableApiDecorator.list(filters);
    streamFile(res, file);
  },
  async schedulerList(req, res) {
    const schedulerFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const schedulerApi = new SchedulerAPI(req.$logger, { user, configuration });
    const schedulerId = _.get(req, 'swagger.params.schedulerId.value');

    // Set filter params
    schedulerFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    schedulerFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    schedulerFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (schedulerId) {
      schedulerFilters._id = schedulerId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(schedulerApi, req, { listMethod: 'schedulerList' });
    const schedulers = await paginableApiDecorator.list(schedulerFilters);

    if (schedulerId) {
      if (schedulers && schedulers.list.length) {
        return sendResponse(res, 200, { scheduler: schedulers.list[0] });
      }
      throw new RestError(404, { message: `Scheduler ${schedulerId} does not exist` });
    } else {
      return sendResponse(res, 200, schedulers);
    }
  },
  async update(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const schedulerAPI = new SchedulerAPI(req.$logger, { user, configuration });
      const scheduler = _.get(req, 'swagger.params.data.value');
      const schedulerId = _.get(req, 'swagger.params.schedulerId.value');
      const lspId = _.get(req, 'swagger.params.lspId.value');
      scheduler._id = schedulerId;
      const schedulerUpdated = await schedulerAPI.update(user, scheduler, lspId);
      return sendResponse(res, 200, { scheduler: schedulerUpdated });
    } catch (error) {
      req.$logger.error(error);
      throw new RestError(500, { message: error.toString() });
    }
  },
  async runNow(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const { mock, mockServerTime } = req.flags;
      const schedulerAPI = new SchedulerAPI(req.$logger,
        { user, configuration, mock, mockServerTime });
      const schedulerId = _.get(req, 'body.schedulerId');
      const reqParams = _.get(req, 'body.params', '');
      const schedulerParams = { user, schedulerId, flags: req.flags };
      if (!_.isEmpty(reqParams)) {
        const parsedParams = JSON.parse(reqParams);
        Object.assign(schedulerParams, parsedParams, { user, schedulerId, flags: req.flags });
      }
      await schedulerAPI.runNow(schedulerParams);
      return sendResponse(res, 200);
    } catch (error) {
      req.$logger.debug(error);
      throw new RestError(500, { message: error.toString() });
    }
  },
};
