const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const { sendResponse, RestError } = require('../../../../components/api-response');
const { chooseProperBucket } = require('../../../../components/aws/mock-bucket');
const WorkflowAPI = require('./workflow-api');
const RequestAPI = require('../request-api');
const configuration = require('../../../../components/configuration');

module.exports = {
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflow = _.get(req, 'swagger.params.data.value.workflow');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const workflowApi = new WorkflowAPI({
      user,
      configuration,
      logger: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      requestApi,
    });
    try {
      await workflowApi.create(workflow, requestId);
      const editedRequest =
        await requestApi.findOneWithWorkflows(requestId, { withCATData });
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      throw new RestError(code, {
        message: `Error creating wrokflow: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async paste(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const sourceRequestId = _.get(req, 'swagger.params.data.value.sourceRequestId');
    const workflows = _.get(req, 'swagger.params.data.value.workflows');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const workflowApi = new WorkflowAPI({
      user,
      configuration,
      logger: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      requestApi,
    });
    try {
      await workflowApi.paste(requestId, sourceRequestId, workflows);
      const editedRequest =
        await requestApi.findOneWithWorkflows(requestId, { withCATData });
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      throw new RestError(code, {
        message: `Error pasting workflow: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async edit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const workflow = _.get(req, 'swagger.params.data.value.workflow');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      mockRequestBilled: req.flags.mockRequestBilled,
      bucket,
    });
    const workflowApi = new WorkflowAPI({
      user,
      configuration,
      logger: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      mockRequestBilled: req.flags.mockRequestBilled,
      requestApi,
    });
    try {
      await workflowApi.edit(workflow, requestId, workflowId);
      const editedRequest =
        await requestApi.findOneWithWorkflows(requestId, { withCATData });
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      throw new RestError(code, {
        message: `Error updating workflow: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async delete(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflows = _.get(req, 'swagger.params.data.value.workflows');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const workflowApi = new WorkflowAPI({
      user,
      configuration,
      logger: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      requestApi,
    });
    try {
      await workflowApi.delete(workflows, requestId);
      const editedRequest =
        await requestApi.findOneWithWorkflows(requestId, { withCATData });
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      throw new RestError(code, {
        message: `Error deleting workflow: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async setOrder(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowIds = _.get(req, 'swagger.params.data.value.workflowIds');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const workflowApi = new WorkflowAPI({
      user,
      configuration,
      logger: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      requestApi,
    });
    try {
      await workflowApi.setOrder(workflowIds, requestId);
      const editedRequest =
        await requestApi.findOneWithWorkflows(requestId, { withCATData });
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      throw new RestError(code, {
        message: `Error updating workflow: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowIds = _.get(req, 'swagger.params.workflowIds.value');
    const withCATData = _.get(req, 'swagger.params.withCATData.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const workflowApi = new WorkflowAPI({
      user,
      configuration,
      logger: req.$logger,
      mock: req.flags.mock,
      requestApi,
    });
    const workflows = await workflowApi.find(requestId, workflowIds, { withCATData });
    return sendResponse(res, 200, { workflows });
  },
};
