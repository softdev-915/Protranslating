const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const route = module.exports = Router.create();
const controller = require('./lsp-logo-controller.js');

route.get('/lsp/lsp-logos',
  controller.list, {
    'x-swagger-security': {
      roles: ['TEMPLATE_READ_ALL'],
    },
    parameters: [
      {
        name: 'searchTerm',
        in: 'query',
        description: 'filter by search term',
        type: 'string',
        required: false,
      },
    ],
    description: 'Returns a list of lsp logo filenames',
    summary: 'Returns a list of lsp logo filenames',
    responses: {
      200: {
        description: 'The list of logo filenames',
        schema: {
          $ref: '#/definitions/lsp-logos-list',
        },
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      403: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.definition('lsp-logos', {
  properties: {
    logoName: {
      type: 'string',
    },
  },
});

route.definition('lsp-logos-list', customizableList({
  $ref: '#/definitions/lsp-logos',
}));
