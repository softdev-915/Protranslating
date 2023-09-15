const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./mt-engine-controller');

route.get('/lsp/{lspId}/mt-engine/export',
  controller.export, {
    tags: [
      'Mt engines',
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
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing data from a custom query',
    produces: ['text/csv'],
    responses: {
      200: {
        description: 'The CSV file containing the data',
        schema: {
          type: 'file',
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

route.get('/lsp/{lspId}/mt-engine',
  controller.list, {
    tags: [
      'Mt engines',
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
    description: 'Retrieves an existing mt engine',
    summary: 'Retrieves an existing mt engine',
    responses: {
      200: {
        description: 'The mt engine',
        schema: {
          $ref: '#/definitions/mt-engine-list',
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
        description: 'The mt engine doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/mt-engine/{id}',
  controller.mtEngineDetail, {
    tags: [
      'Mt engines',
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
      description: 'The mt engine id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves an specific mt engine by _id',
    summary: 'Retrieves an specific mt engine by _id',
    responses: {
      200: {
        description: 'The mt engines',
        schema: {
          $ref: '#/definitions/mt-engine-response',
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

route.post('/lsp/{lspId}/mt-engine',
  controller.create, {
    tags: [
      'Mt engines',
    ],
    'x-swagger-security': {
      roles: ['MT-ENGINES_CREATE_ALL'],
    },
    description: 'Creates a new Mt engine',
    summary: 'Creates a new Mt engine',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new mt engine',
      required: true,
      schema: {
        $ref: '#/definitions/mt-engine',
      },
    }],
    responses: {
      200: {
        description: 'The new created mt engine',
        schema: {
          $ref: '#/definitions/mt-engine-response',
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
      409: {
        description: 'The mt engine already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/mt-engine/{id}',
  controller.update, {
    tags: [
      'Mt engines',
    ],
    'x-swagger-security': {
      roles: ['MT-ENGINES_UPDATE_ALL'],
    },
    description: 'Updates a Mt engine',
    summary: 'Updates a Mt engine',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing mt engine id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The mt engine',
      required: true,
      schema: {
        $ref: '#/definitions/mt-engine',
      },
    }],
    responses: {
      200: {
        description: 'The updated mt engine entity',
        schema: {
          $ref: '#/definitions/mt-engine-response',
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
        description: 'The mt engine doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('mt-engine', {
  properties: {
    _id: {
      type: 'string',
    },
    mtProvider: {
      type: 'string',
    },
    apiKey: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['mtProvider', 'apiKey'],
});

route.definition('mt-engine-list', customizableList({
  $ref: '#/definitions/mt-engine',
}));

route.definition('mt-engine-response', defineResponse({
  'mt-engine': {
    $ref: '#/definitions/mt-engine',
  },
}));
