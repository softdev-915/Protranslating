const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./mt-provider-controller');

route.get('/lsp/{lspId}/mt-provider',
  controller.list, {
    tags: [
      'Mt providers',
    ],
    'x-swagger-security': {
      roles: ['MT-ENGINES_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing mt provider',
    summary: 'Retrieves an existing mt provider',
    responses: {
      200: {
        description: 'The mt provider',
        schema: {
          $ref: '#/definitions/mt-provider-list',
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
      404: {
        description: 'The mt provider doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/mt-provider/{id}',
  controller.mtProviderDetail, {
    tags: [
      'Mt providers',
    ],
    'x-swagger-security': {
      roles: ['MT-ENGINES_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The mt provder id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves an specific mt provider by _id',
    summary: 'Retrieves an specific mt provider by _id',
    responses: {
      200: {
        description: 'The mt provider details',
        schema: {
          $ref: '#/definitions/mt-provider-response',
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
  });

route.definition('mt-provider', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['name'],
});

route.definition('mt-provider-list', customizableList({
  $ref: '#/definitions/mt-provider',
}));

route.definition('mt-provider-response', defineResponse({
  'mt-provider': {
    $ref: '#/definitions/mt-provider',
  },
}));
