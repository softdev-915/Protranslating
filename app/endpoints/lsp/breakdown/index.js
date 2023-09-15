const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./breakdown-controller');

route.get('/lsp/{lspId}/breakdown/export',
  controller.breakdownExport, {
    tags: [
      'Breakdown',
    ],
    'x-swagger-security': {
      roles: [
        'BREAKDOWN_READ_ALL',
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
  },
);

route.get('/lsp/{lspId}/breakdown/{breakdownId}',
  controller.list, {
    tags: [
      'Breakdown',
    ],
    'x-swagger-security': {
      roles: [
        'BREAKDOWN_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'breakdownId',
      in: 'path',
      description: 'The fuzzy\'s match id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing breakdown',
    summary: 'Retrieves an existing breakdown',
    responses: {
      200: {
        description: 'The breakdown',
        schema: {
          $ref: '#/definitions/breakdown-response',
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
        description: 'The breakdown doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/breakdown',
  controller.list, {
    tags: [
      'Breakdown',
    ],
    'x-swagger-security': {
      roles: ['BREAKDOWN_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the breakdown list',
    summary: 'Retrieves the breakdown list',
    responses: {
      200: {
        description: 'The breakdown list',
        schema: {
          $ref: '#/definitions/breakdown-list',
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

route.post('/lsp/{lspId}/breakdown',
  controller.create, {
    tags: [
      'Breakdown',
    ],
    'x-swagger-security': {
      roles: [
        'BREAKDOWN_CREATE_ALL',
      ],
    },
    description: 'Creates a new fuzzy',
    summary: 'Creates a new fuzzy',
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
      description: 'The new breakdown',
      required: true,
      schema: {
        $ref: '#/definitions/breakdown',
      },
    }],
    responses: {
      200: {
        description: 'The new created fuzzy',
        schema: {
          $ref: '#/definitions/breakdown-response',
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
        description: 'The breakdown already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/breakdown/{breakdownId}',
  controller.update, {
    tags: [
      'Breakdown',
    ],
    'x-swagger-security': {
      roles: [
        'BREAKDOWN_UPDATE_ALL',
      ],
    },
    description: 'Updates a fuzzy',
    summary: 'Updates a fuzzy',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'breakdownId',
      in: 'path',
      description: 'Existing fuzzy id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The breakdown to update',
      required: true,
      schema: {
        $ref: '#/definitions/breakdown',
      },
    }],
    responses: {
      200: {
        description: 'The updated breakdown',
        schema: {
          $ref: '#/definitions/breakdown-response',
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
        description: 'The breakdown doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('breakdown', {
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

route.definition('breakdown-list', customizableList({
  $ref: '#/definitions/breakdown',
}));

route.definition('breakdown-response', defineResponse({
  breakdown: {
    $ref: '#/definitions/breakdown',
  },
}));
