const _ = require('lodash');
const requestUtils = require('../.././../../utils/request');
const PortalCatDocumentApi = require('./portalcat-documents-api');
const configuration = require('../../../../components/configuration');
const { fileContentDisposition, RestError } = require('../../../../components/api-response');
const CloudStorage = require('../../../../components/cloud-storage');

module.exports = {
  async serveActionFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const pipelineId = _.get(req, 'swagger.params.pipelineId.value');
    const actionId = _.get(req, 'swagger.params.actionId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const pcDocumentsApi = new PortalCatDocumentApi(req.$logger, { user, configuration });
    const file = await pcDocumentsApi.findActionFile(pipelineId, actionId, fileId);
    const cloudStorage = new CloudStorage(configuration);

    res.setHeader('Content-Disposition', fileContentDisposition(file.filename));
    try {
      const cloudFile = await cloudStorage.gcsGetFile(file.path);
      const cloudFileReadStream = cloudFile.createReadStream();
      cloudFileReadStream.pipe(res);
    } catch (error) {
      throw new RestError(404, {
        message: 'Required file doesn\'t exist',
      });
    }
  },
  async serveActionsFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const pipelineId = _.get(req, 'swagger.params.pipelineId.value');
    const pcDocumentsApi = new PortalCatDocumentApi(req.$logger, { user, configuration });
    try {
      await pcDocumentsApi.serveActionsFilesZip(res, pipelineId);
    } catch (e) {
      throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
    }
  },
};
