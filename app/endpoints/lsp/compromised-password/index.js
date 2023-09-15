const Router = require('../../../components/application/route');
const { customizableList } = require('../../../components/application/definitions');
const controller = require('./compromised-password-controller');
const generate = require('../../../utils/swagger');

const route = module.exports = Router.create();
const TAGS = ['Compromised Passwords'];
const ENTITY_NAME = 'compromised password';
const REFS = { LIST: '#/definitions/compromised-password-list' };
const READ_ROLES = ['COMPROMISED-PASSWORD_READ_ALL'];

route.get('/lsp/{lspId}/compromised-password/export', controller.export,
  generate.exportRouteDescription({
    ENTITY_NAME,
    TAGS,
    ROLES: [{ oneOf: READ_ROLES }],
  }));

route.get('/lsp/{lspId}/compromised-password', controller.list,
  generate.listRouteDescription({
    ENTITY_NAME,
    TAGS,
    ROLES: [{ oneOf: READ_ROLES }],
    REFS,
  }));

route.definition('compromised-password', {
  properties: {
    _id: {
      type: 'string',
    },
    no: {
      type: 'string',
    },
  },
});

route.definition('compromised-password-list', customizableList({
  $ref: '#/definitions/compromised-password',
}));
