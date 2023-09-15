const _ = require('lodash');
const UserDocumentAPI = require('./user-document-api');
const { sendResponse } = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const requestUtils = require('../../../../utils/request');

module.exports = {
  async uploadDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userIdToEdit = _.get(req, 'swagger.params.userId.value');
    const file = _.get(req, 'swagger.params.file.value');
    const fileType = _.get(req, 'swagger.params.fileType.value');
    const mock = _.get(req.flags, 'mock', false);
    const userDocumentApi = new UserDocumentAPI(user, configuration, req.$logger, mock);
    const userDocumentUploaded = await userDocumentApi.createDocument(user,
      userIdToEdit, fileType, file);
    return sendResponse(res, 200, { document: userDocumentUploaded });
  },

  async deleteDocument(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const userIdToEdit = _.get(req, 'swagger.params.userId.value');
    const mock = _.get(req.flags, 'mock', false);
    const userDocumentApi = new UserDocumentAPI(user, configuration, req.$logger, mock);
    const userDocumentDeleted = await userDocumentApi.deleteDocument(user,
      userIdToEdit, documentId);
    return sendResponse(res, 200, { documents: userDocumentDeleted });
  },
};
