const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./request-type-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/request-type/export',
  controller.requestTypeExport, {
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

route.get('/lsp/{lspId}/request-type/{requestTypeId}',
  controller.requestTypeDetail, {
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
      name: 'requestTypeId',
      in: 'path',
      description: 'The request type\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves all request types',
    summary: 'Retrieves all the request types',
    responses: {
      200: {
        description: 'The request types',
        schema: {
          $ref: '#/definitions/request-type-response',
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

route.get('/lsp/{lspId}/request-type',
  controller.requestTypeList, {
    tags: [
      'Request-type',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: ['REQUEST_CREATE_OWN', 'REQUEST_CREATE_ALL'],
      }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all the request types',
    summary: 'Retrieves all the request types',
    responses: {
      200: {
        description: 'The request types',
        schema: {
          $ref: '#/definitions/request-type-list',
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

route.post('/lsp/{lspId}/request-type',
  controller.requestTypeCreate, {
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
      description: 'The new request types',
      required: true,
      schema: {
        $ref: '#/definitions/request-type',
      },
    }],
    description: 'Creates a new request types',
    summary: 'Creates a new abillity',
    responses: {
      200: {
        description: 'The newly created request types',
        schema: {
          $ref: '#/definitions/request-type-list',
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

route.put('/lsp/{lspId}/request-type/{requestTypeId}',
  controller.requestTypeUpdate, {
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
      name: 'requestTypeId',
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
        $ref: '#/definitions/request-type',
      },
    }],
    description: 'Updates an existing abillity',
    summary: 'Updates an existing abillity',
    responses: {
      200: {
        description: 'The updated request type',
        schema: {
          $ref: '#/definitions/request-type-list',
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

route.definition('request-type-list', customizableList({
  $ref: '#/definitions/request-type',
}));

route.definition('request-type-response', defineResponse({
  requestType: {
    $ref: '#/definitions/request-type',
  },
}));

route.definition('request-type', {
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
