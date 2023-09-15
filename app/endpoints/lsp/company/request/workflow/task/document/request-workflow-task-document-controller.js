const _ = require('lodash');
const { chooseProperBucket } = require('../../../../../../../components/aws/mock-bucket');
const requestUtils = require('../../../../../../../utils/request');
const { sendResponse } = require('../../../../../../../components/api-response');
const RequestWorkflowTaskDocumentApi = require('./request-workflow-task-document-api');
const RequestDocumentApiDecorator = require('../../../../../../../utils/request/request-document-api-decorator');
const configuration = require('../../../../../../../components/configuration');
const CloudStorage = require('../../../../../../../components/cloud-storage');

module.exports = {
  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { requestId, taskId, companyId, documentId } = _.get(req, 'swagger.params');
    const bucket = chooseProperBucket(configuration);
    const cloudStorage = new CloudStorage(configuration);
    const api = new RequestWorkflowTaskDocumentApi({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const decoratedApi = new RequestDocumentApiDecorator({ api, cloudStorage, req, res });
    await decoratedApi.serveFile({
      request: requestId.value,
      companyId: companyId.value,
      taskId: taskId.value,
      documentId: documentId.value,
    });
  },
  async deleteDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { requestId, taskId, documentId } = _.get(req, 'swagger.params');
    const api = new RequestWorkflowTaskDocumentApi({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket: chooseProperBucket(configuration),
    });
    const request = await api.deleteDocument(requestId.value, taskId.value, documentId.value);
    return sendResponse(res, 200, { request });
  },
};
