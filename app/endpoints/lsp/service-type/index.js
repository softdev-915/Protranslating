const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./service-type-controller');

route.get('/lsp/{lspId}/service-type/{id}',
  controller.details, {
    tags: [
      'Service Type',
    ],
    'x-swagger-security': {
      roles: [
        'SERVICE-TYPE_READ_ALL',
      ],
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
      description: 'The service type\'s match id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing service type',
    summary: 'Retrieves an existing service type',
    responses: {
      200: {
        description: 'The service type',
        schema: {
          $ref: '#/definitions/service-type-response',
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
        description: 'The service type doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/service-type',
  controller.list, {
    tags: [
      'Service Type',
    ],
    'x-swagger-security': {
      roles: ['SERVICE-TYPE_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the service type list',
    summary: 'Retrieves the service type list',
    responses: {
      200: {
        description: 'The service type list',
        schema: {
          $ref: '#/definitions/service-type-list',
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

route.get('/lsp/{lspId}/service-type/nameList',
  controller.nameList, {
    tags: [
      'Service type name list',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['SERVICE-TYPE_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'select',
      in: 'query',
      description: 'Filters results to specific fields',
      type: 'string',
    }, {
      name: 'query',
      in: 'query',
      description: 'Records condition',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the service types',
    summary: 'Retrieves the service types',
    responses: {
      200: {
        description: 'The service types list',
        schema: {
          $ref: '#/definitions/service-type-list',
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

route.post('/lsp/{lspId}/service-type',
  controller.create, {
    tags: [
      'Service Type',
    ],
    'x-swagger-security': {
      roles: [
        'SERVICE-TYPE_CREATE_ALL',
      ],
    },
    description: 'Creates a new service type',
    summary: 'Creates a new service type',
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
      description: 'The new service type',
      required: true,
      schema: {
        $ref: '#/definitions/service-type',
      },
    }],
    responses: {
      200: {
        description: 'The new created service type',
        schema: {
          $ref: '#/definitions/service-type-response',
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
        description: 'The service type already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/service-type/{id}',
  controller.update, {
    tags: [
      'Service Type',
    ],
    'x-swagger-security': {
      roles: [
        'SERVICE-TYPE_UPDATE_ALL',
      ],
    },
    description: 'Updates a service type',
    summary: 'Updates a service type',
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
      description: 'Existing service type id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The service type to update',
      required: true,
      schema: {
        $ref: '#/definitions/service-type',
      },
    }],
    responses: {
      200: {
        description: 'The updated service type',
        schema: {
          $ref: '#/definitions/service-type-response',
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
        description: 'The service type doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('service-type', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    inactive: {
      type: 'boolean',
    },
  },
  required: ['name'],
});

route.definition('service-type-list', customizableList({
  $ref: '#/definitions/service-type',
}));

route.definition('service-type-response', defineResponse({
  serviceType: {
    $ref: '#/definitions/service-type',
  },
}));
