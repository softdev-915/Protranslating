const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./provider-instructions-controller');

route.get('/lsp/{lspId}/provider-instruction/export',
  controller.providerInstructionsExport, {
    tags: [
      'Provider instructions export',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['PROVIDER-TASK-INSTRUCTIONS_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing data from the table grid',
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
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get('/lsp/{lspId}/provider-instruction/{providerInstructionsId}',
  controller.getOne, {
    tags: [
      'Provider instruction detail',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['PROVIDER-TASK-INSTRUCTIONS_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'providerInstructionsId',
      in: 'path',
      description: 'The provider instruction id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing provider instruction',
    summary: 'Retrieves an existing provider instruction',
    responses: {
      200: {
        description: 'The provider instruction',
        schema: {
          $ref: '#/definitions/provider-instructions-response',
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
        description: 'The provider instruction doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/provider-instruction',
  controller.list, {
    tags: [
      'Provider instruction listing',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['PROVIDER-TASK-INSTRUCTIONS_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the provider instructions list',
    summary: 'Retrieves the provider instructions list',
    responses: {
      200: {
        description: 'The provider instructions list',
        schema: {
          $ref: '#/definitions/provider-instructions-list',
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
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.post('/lsp/{lspId}/provider-instruction',
  controller.create, {
    tags: [
      'Provider instruction creation',
    ],
    'x-swagger-security': {
      roles: [
        'PROVIDER-TASK-INSTRUCTIONS_CREATE_ALL',
      ],
    },
    description: 'Creates a new Provider instruction',
    summary: 'Creates a new Provider instruction',
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
      description: 'The new Provider instruction',
      required: true,
      schema: {
        $ref: '#/definitions/provider-instruction',
      },
    }],
    responses: {
      200: {
        description: 'The new created Provider instruction',
        schema: {
          $ref: '#/definitions/provider-instructions-response',
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
        description: 'The provider instruction already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/provider-instruction/{providerInstructionsId}',
  controller.update, {
    tags: [
      'Provider instruction update',
    ],
    'x-swagger-security': {
      roles: [
        'PROVIDER-TASK-INSTRUCTIONS_UPDATE_ALL',
      ],
    },
    description: 'Updates a Provider instruction',
    summary: 'Updates a Provider instruction',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'providerInstructionsId',
      in: 'path',
      description: 'Existing provider instruction id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The provider instruction',
      required: true,
      schema: {
        $ref: '#/definitions/provider-instruction',
      },
    }],
    responses: {
      200: {
        description: 'The updated provider instruction entity',
        schema: {
          $ref: '#/definitions/provider-instructions-response',
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
        description: 'The provider instruction doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('provider-instruction', {
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
    body: {
      type: 'string',
    },
  },
  required: ['name'],
});

route.definition('provider-instructions-list', customizableList({
  $ref: '#/definitions/provider-instruction',
}));

route.definition('provider-instructions-response', defineResponse({
  'provider-instruction': {
    $ref: '#/definitions/provider-instruction',
  },
}));
