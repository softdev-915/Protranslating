const _ = require('lodash');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const TaskApi = require('./task-api');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async taskGridList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const bucket = chooseProperBucket(configuration);
    let api = new TaskApi({
      user,
      log: req.$logger,
      configuration,
      mock: req.flags.mock,
      bucket,
    });
    api = new PaginableAPIDecorator(api, req, { listMethod: 'aggregateTasks' });
    const taskResponse = await api.list(filters);
    return sendResponse(res, 200, taskResponse);
  },
  async taskGridExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.session, 'lmsTz', '0');
    const filters = {
      __tz: tz,
    };
    const bucket = chooseProperBucket(configuration);
    let api = new TaskApi({
      user,
      log: req.$logger,
      configuration,
      mock: req.flags.mock,
      bucket,
    });
    api = new PaginableAPIDecorator(api, req, { listMethod: 'aggregateTasksCSV' });
    const csvStream = await api.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async taskList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const providerId = _.get(req, 'swagger.params.providerId.value');
    const priorityStatus = _.get(req, 'swagger.params.priorityStatus.value');
    const bucket = chooseProperBucket(configuration);
    const api = new TaskApi({
      user,
      log: req.$logger,
      configuration,
      mock: req.flags.mock,
      bucket,
    });
    const taskList = await api.list(user, providerId, priorityStatus);
    return sendResponse(res, 200, taskList);
  },
};
