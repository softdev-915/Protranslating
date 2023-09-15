const Router = require('../../../components/application/route');
const { customizableList } = require('../../../components/application/definitions');
const controller = require('./ar-adjustment-controller');
const generate = require('../../../utils/swagger');

const route = module.exports = Router.create();
const READ_ROLES = ['AR-ADJUSTMENT_READ_ALL', 'AR-ADJUSTMENT_READ_OWN', 'AR-ADJUSTMENT_READ_COMPANY'];
const CREATE_ROLES = ['AR-ADJUSTMENT_CREATE_ALL', 'AR-ADJUSTMENT-ACCT_READ_ALL'];
const UPDATE_ROLES = ['AR-ADJUSTMENT_UPDATE_ALL'];
const TAGS = ['Ar Adjustments'];
const ENTITY_NAME = 'ar adjustment';
const REFS = {
  ENTITY: '#/definitions/ar-adjustment',
  ENTITY_INPUT: '#/definitions/ar-adjustment-input',
  LIST: '#/definitions/ar-adjustment-list',
};

route.post('/lsp/{lspId}/ar-adjustment', controller.create,
  generate.createRouteDescription({ ENTITY_NAME, TAGS, ROLES: CREATE_ROLES, REFS }));

route.get('/lsp/{lspId}/ar-adjustment/export', controller.export,
  generate.exportRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }] }));

route.put('/lsp/{lspId}/ar-adjustment/{id}', controller.update,
  generate.updateRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: UPDATE_ROLES }], REFS }));

route.get('/lsp/{lspId}/ar-adjustment', controller.list,
  generate.listRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS }));

route.get('/lsp/{lspId}/ar-adjustment/{id}', controller.details,
  generate.detailsRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS }));

route.delete('/lsp/{lspId}/ar-adjustment/{entityId}/attachments/{attachmentId}', controller.detachFile,
  generate.detachFileDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: UPDATE_ROLES }] }));

route.get('/lsp/{lspId}/ar-adjustment/{entityId}/attachments/{attachmentId}', controller.getFileStream,
  generate.fileStreamRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }] }),
);

// ***********************DEFINITIONS***************************

route.definition('ar-adjustment', {
  properties: {
    _id: {
      type: 'string',
    },
    no: {
      type: 'string',
    },

  },
});

route.definition('ar-adjustment-input', {
  properties: {
    _id: {
      type: 'string',
    },
    no: {
      type: 'string',
    },

  },
});

route.definition('ar-adjustment-list', customizableList({
  $ref: '#/definitions/ar-adjustment',
}));
