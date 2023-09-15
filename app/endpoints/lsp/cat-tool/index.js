const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./cat-tool-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/cat/export',
  controller.catToolExport, {
    tags: [
      'CAT Tool',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT_READ_ALL', 'REQUEST_READ_ALL', 'REQUEST_READ_OWN', 'USER_READ_ALL'] },
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
  });

route.get('/lsp/{lspId}/cat/{catToolId}',
  controller.catToolList, {
    tags: [
      'CAT Tool',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT_READ_ALL', 'REQUEST_READ_ALL', 'REQUEST_READ_OWN', 'USER_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'catToolId',
      in: 'path',
      description: 'The cat tool\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves the CAT tools',
    summary: 'Retrieves the CAT tools',
    responses: {
      200: {
        description: 'The user CAT Tool',
        schema: {
          $ref: '#/definitions/cat-tool-response',
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

route.get('/lsp/{lspId}/cat',
  controller.catToolList, {
    tags: [
      'CAT Tool',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT_READ_ALL', 'REQUEST_READ_ALL', 'REQUEST_READ_OWN', 'USER_READ_ALL', 'WORKFLOW_READ_OWN'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves the CAT tools',
    summary: 'Retrieves the CAT tools',
    responses: {
      200: {
        description: 'The user CAT Tool',
        schema: {
          $ref: '#/definitions/cat-tool-list',
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

route.post('/lsp/{lspId}/cat',
  controller.catToolCreate, {
    tags: [
      'CAT Tool',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'CAT_CREATE_ALL',
          'USER_CREATE_ALL',
        ],
      }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new CAT Tool',
      required: true,
      schema: {
        $ref: '#/definitions/cat-tool',
      },
    }],
    description: 'Creates a new CAT Tool',
    summary: 'Creates a new CAT Tool',
    responses: {
      200: {
        description: 'The newly created CAT Tool',
        schema: {
          $ref: '#/definitions/cat-tool-list',
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

route.put('/lsp/{lspId}/cat/{catToolId}',
  controller.catToolUpdate, {
    tags: [
      'CAT Tool',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'CAT_UPDATE_ALL',
          'USER_CREATE_ALL',
        ],
      }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'catToolId',
      in: 'path',
      description: 'The cat tool\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The CAT Tool to upate',
      required: true,
      schema: {
        $ref: '#/definitions/cat-tool',
      },
    }],
    description: 'Updates an existing CAT Tool',
    summary: 'Updates an existing CAT Tool',
    responses: {
      200: {
        description: 'The updated CAT Tool',
        schema: {
          $ref: '#/definitions/cat-tool-list',
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

route.definition('cat-tool-list', customizableList({
  $ref: '#/definitions/cat-tool',
}));

route.definition('cat-tool-response', defineResponse({
  catTool: {
    $ref: '#/definitions/cat-tool',
  },
}));

route.definition('cat-tool', {
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
});
