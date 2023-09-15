const _ = require('lodash');
const ActivityDocumentAPI = require('./activity-document-api');
const { sendResponse, RestError } = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const requestUtils = require('../../../../utils/request');
const ActivityDocumentApi = require('./activity-document-api');
const CloudStorage = require('../../../../components/cloud-storage');

module.exports = {
  async uploadDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityIdToEdit = _.get(req, 'swagger.params.activityId.value');
    const file = _.get(req, 'swagger.params.file.value');
    const mock = _.get(req.flags, 'mock', false);
    const activityDocumentApi = new ActivityDocumentAPI(user, configuration, req.$logger, mock);
    const activityDocumentUploaded = await activityDocumentApi.createDocument(user,
      activityIdToEdit, file);
    return sendResponse(res, 200, { document: activityDocumentUploaded });
  },
  async deleteDocuments(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const filename = _.get(req, 'swagger.params.filename.value');
    const activityIdToEdit = _.get(req, 'swagger.params.activityId.value');
    const documentIdsToDelete = _.get(req, 'swagger.params.documentIds.value');
    const mock = _.get(req.flags, 'mock', false);
    const activityDocumentApi = new ActivityDocumentAPI(user, configuration, req.$logger, mock);
    let activityDocumentsDeleted;
    if (documentIdsToDelete) {
      activityDocumentsDeleted = await activityDocumentApi.deleteDocuments(
        activityIdToEdit,
        documentIdsToDelete,
      );
      return sendResponse(res, 200, { documents: activityDocumentsDeleted });
    }
    await activityDocumentApi.deleteDocument(activityIdToEdit, documentId, filename);
    return sendResponse(res, 200, { document: { _id: documentId, name: filename, deleted: true } });
  },
  async getDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityId = _.get(req, 'swagger.params.activityId.value');
    const documentId = _.get(req, 'swagger.params.attachmentId.value');
    const filename = _.get(req, 'swagger.params.filename.value');
    const mock = _.get(req.flags, 'mock', false);
    const useAwsBucket = true;
    const activityDocumentApi = new ActivityDocumentApi(
      user,
      configuration,
      req.$logger,
      mock,
    );
    const file = await activityDocumentApi
      .buildActivityEmailFilePath(activityId, documentId, filename);
    res.setHeader('Content-disposition', `attachment;filename="${filename}"`);
    if (!useAwsBucket) {
      return res.sendFile(file.path);
    }
    const cloudStorage = new CloudStorage(configuration);
    try {
      const cloudFile = await cloudStorage.gcsGetFile(file.path);
      cloudFile.createReadStream().pipe(res);
    } catch (error) {
      throw new RestError(404, { message: 'The file does not exist', stack: error.stack });
    }
  },
};
