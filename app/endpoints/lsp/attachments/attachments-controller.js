const _ = require('lodash');
const AttachmentsApi = require('./attachments-api');
const configuration = require('../../../components/configuration');
const { getUserFromSession } = require('../../../utils/request');
const { wrapControllerLogic, RestError, fileContentDisposition, sendResponse } = require('../../../components/api-response');
const { hasRole, getRoles } = require('../../../utils/roles');
const { pipeWithErrors } = require('../../../utils/stream');

const updateRoles = {
  invoice: ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'],
  'invoice-advance': ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'],
  'invoice-payment': ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'],
  'invoice-adjustment': ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'],
};

module.exports = {
  async detach(req, res) {
    await wrapControllerLogic(async () => {
      const user = getUserFromSession(req);
      const entityName = _.get(req, 'swagger.params.entityName.value');
      const entityId = _.get(req, 'swagger.params.entityId.value');
      const attachmentId = _.get(req, 'swagger.params.attachmentId.value');
      const userRoles = getRoles(user);
      const requiredRoles = updateRoles[entityName];
      if (!userRoles.some(r => hasRole(r, requiredRoles))) {
        throw new RestError(403, { message: 'User is authorized to perform this action' });
      }
      const api = new AttachmentsApi(req.$logger, { user, configuration });
      const attachments = await api.detach(entityName, entityId, attachmentId);
      sendResponse(res, 200, { attachments });
    });
  },

  async streamFile(req, res) {
    await wrapControllerLogic(async () => {
      const user = getUserFromSession(req);
      const entityName = _.get(req, 'swagger.params.entityName.value');
      const entityId = _.get(req, 'swagger.params.entityId.value');
      const attachmentId = _.get(req, 'swagger.params.attachmentId.value');
      const api =
        new AttachmentsApi(req.$logger, { user, configuration });
      const { fileReadStream, filename } =
        await api.getFileStream(entityName, entityId, attachmentId);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', fileContentDisposition(filename));
      pipeWithErrors(fileReadStream, res);
    });
  },
};
