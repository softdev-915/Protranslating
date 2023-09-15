const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./scheduling-status-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/scheduling-status/export',
  controller.schedulingStatusExport, {
    tags: [
      'Request-type',
    ],
    'x-swagger-security': {
      roles: [
        'REQUEST_CREATE_ALL',
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

route.get('/lsp/{lspId}/scheduling-status/{schedulingStatusId}',
  controller.schedulingStatusDetail, {
    tags: [
      'Request-type',
    ],
    'x-swagger-security': {
      roles: [
        'REQUEST_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'schedulingStatusId',
      in: 'path',
      description: 'The request type\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves all the scheduling status',
    summary: 'Retrieves all the scheduling status',
    responses: {
      200: {
        description: 'The scheduling status',
        schema: {
          $ref: '#/definitions/scheduling-status-response',
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

route.get('/lsp/{lspId}/scheduling-status',
  controller.schedulingStatusList, {
    tags: [
      'Request-type',
    ],
    'x-swagger-security': {
      roles: [
        'REQUEST_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all the scheduling status',
    summary: 'Retrieves all the scheduling status',
    responses: {
      200: {
        description: 'The scheduling status',
        schema: {
          $ref: '#/definitions/scheduling-status-list',
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

route.post('/lsp/{lspId}/scheduling-status',
  controller.schedulingStatusCreate, {
    tags: [
      'Request-type',
    ],
    'x-swagger-security': {
      roles: [
        'REQUEST_CREATE_ALL',
      ],
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
      description: 'The new scheduling status',
      required: true,
      schema: {
        $ref: '#/definitions/scheduling-status',
      },
    }],
    description: 'Creates a new scheduling status',
    summary: 'Creates a new scheduling status',
    responses: {
      200: {
        description: 'The newly created scheduling status',
        schema: {
          $ref: '#/definitions/scheduling-status-list',
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

route.put('/lsp/{lspId}/scheduling-status/{schedulingStatusId}',
  controller.schedulingStatusUpdate, {
    tags: [
      'Request-type',
    ],
    'x-swagger-security': {
      roles: [
        'REQUEST_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'schedulingStatusId',
      in: 'path',
      description: 'The request type\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The request type to update',
      required: true,
      schema: {
        $ref: '#/definitions/scheduling-status',
      },
    }],
    description: 'Updates an existing scheduling status',
    summary: 'Updates an existing scheduling status',
    responses: {
      200: {
        description: 'The updated request type',
        schema: {
          $ref: '#/definitions/scheduling-status-list',
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

route.definition('scheduling-status-list', customizableList({
  $ref: '#/definitions/scheduling-status',
}));

route.definition('scheduling-status-response', defineResponse({
  schedulingStatus: {
    $ref: '#/definitions/scheduling-status',
  },
}));

route.definition('scheduling-status', {
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
