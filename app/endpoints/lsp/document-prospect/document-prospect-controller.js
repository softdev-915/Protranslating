
const _ = require('lodash');
const DocumentProspectApi = require('./document-prospect-api');
const CloudStorage = require('../../../components/cloud-storage');
const configuration = require('../../../components/configuration');
const requestUtils = require('../../../utils/request');
const { extractUserIp } = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');

const { RestError, sendResponse } = apiResponse;

module.exports = {
  async uploadCompanyDocument(req, res) {
    const cloudStorage = new CloudStorage(configuration, req.$logger);
    let files = _.get(req, 'swagger.params.files.value');
    if (!Array.isArray(files)) {
      files = [files];
    }
    if (!_.isEmpty(files)) {
      await cloudStorage.gcsUploadFilesViaStream(req, files)
        .then(documents =>
          sendResponse(res, 200, { documents }),
        ).catch((err) => {
          throw new RestError(500, err);
        });
    }
  },
  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const api = new DocumentProspectApi(req.$logger,
      { user, configuration, lspId, mock: req.flags.mock });
    const document = await api.getDocumentProspect(documentId);
    res.setHeader('Content-Disposition', apiResponse.fileContentDisposition(document.name));
    const cloudStorage = new CloudStorage(configuration);
    try {
      const cloudFile = await cloudStorage.gcsGetFile(document.cloudKey);
      cloudFile.createReadStream().pipe(res);
    } catch (error) {
      throw new RestError(404, { message: 'The file does not exist', stack: error.stack });
    }
  },
  async uploadDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    let files = _.get(req, 'swagger.params.files.value');
    if (!Array.isArray(files)) {
      files = [files];
    }
    const clientIP = extractUserIp(req);
    const documentProspectApi = new DocumentProspectApi(user, configuration, req.$logger, clientIP);
    const documentsUploaded = await documentProspectApi.createProspects(user, files);
    return sendResponse(res, 200, { documents: documentsUploaded });
  },

  async deleteProspectDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const documentProspectId = _.get(req, 'swagger.params.documentProspectId.value');
    const clientIP = extractUserIp(req);
    const documentProspectApi = new DocumentProspectApi(user, configuration, req.$logger, clientIP);
    const documentDeleted = await documentProspectApi.deleteProspectDocument(user,
      documentProspectId);
    return sendResponse(res, 200, { document: documentDeleted });
  },
};
