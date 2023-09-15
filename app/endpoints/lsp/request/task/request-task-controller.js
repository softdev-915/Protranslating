const _ = require('lodash');
const { chooseProperBucket } = require('../../../../components/aws/mock-bucket');
const apiResponse = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');
const configuration = require('../../../../components/configuration');

const RestError = apiResponse.RestError;
const RequestTaskApi = require('./request-task-api');

module.exports = {
  async serveTaskFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { requestId, taskId, providerTaskId } = _.get(req, 'swagger.params');
    const request = {
      _id: requestId.value,
      task: taskId.value,
      providerTask: providerTaskId.value,
    };
    const bucket = chooseProperBucket(configuration);
    const requestTaskAPI = new RequestTaskApi({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    try {
      await requestTaskAPI.serveTaskFilesZip(user, request, res);
    } catch (e) {
      const message = e.message || e;
      req.$logger.error(`Error serving task zip file. Error: ${message}`);
      throw new RestError(500, { message: `Error building task zip file: ${e}`, stack: e.stack });
    }
  },
  async updateProviderTaskTTE(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { requestId, workflowId, taskId, providerTaskId } = _.get(req, 'swagger.params');
    const request = {
      requestId: requestId.value,
      workflowId: workflowId.value,
      taskId: taskId.value,
      providerTaskId: providerTaskId.value,
    };
    const data = _.get(req, 'swagger.params.data.value');
    const requestTaskAPI = new RequestTaskApi({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
    });
    try {
      await requestTaskAPI.updateProviderTaskTTE(request, data);
      return apiResponse.sendResponse(res, 200, { message: 'TTE updated' });
    } catch (e) {
      const message = e.message || e;
      req.$logger.error(`Error updating TTE. Error: ${message}`);
      throw new RestError(400, { message: `Error updating TTE: ${e}`, stack: e.stack });
    }
  },
};
