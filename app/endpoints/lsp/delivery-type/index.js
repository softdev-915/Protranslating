const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./delivery-type-controller');

route.get('/lsp/{lspId}/delivery-type/{id}',
  controller.details, {
    tags: [
      'Delivery Type',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-TYPE_READ_ALL',
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
      description: 'The delivery type\'s match id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing delivery type',
    summary: 'Retrieves an existing delivery type',
    responses: {
      200: {
        description: 'The delivery type',
        schema: {
          $ref: '#/definitions/delivery-type-response',
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
        description: 'The delivery type doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/delivery-type',
  controller.list, {
    tags: [
      'Delivery Type',
    ],
    'x-swagger-security': {
      roles: ['DELIVERY-TYPE_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the delivery type list',
    summary: 'Retrieves the delivery type list',
    responses: {
      200: {
        description: 'The delivery type list',
        schema: {
          $ref: '#/definitions/delivery-type-list',
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

route.get('/lsp/{lspId}/delivery-type/nameList',
  controller.nameList, {
    tags: [
      'Delivery type name list',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['DELIVERY-TYPE_READ_ALL'] },
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
    description: 'Retrieves the delivery types',
    summary: 'Retrieves the delivery types',
    responses: {
      200: {
        description: 'The delivery types list',
        schema: {
          $ref: '#/definitions/delivery-type-list',
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

route.post('/lsp/{lspId}/delivery-type',
  controller.create, {
    tags: [
      'Delivery Type',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-TYPE_CREATE_ALL',
      ],
    },
    description: 'Creates a new delivery type',
    summary: 'Creates a new delivery type',
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
      description: 'The new delivery type',
      required: true,
      schema: {
        $ref: '#/definitions/delivery-type',
      },
    }],
    responses: {
      200: {
        description: 'The new created delivery type',
        schema: {
          $ref: '#/definitions/delivery-type-response',
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
        description: 'The delivery type already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/delivery-type/{id}',
  controller.update, {
    tags: [
      'Delivery Type',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-TYPE_UPDATE_ALL',
      ],
    },
    description: 'Updates a delivery type',
    summary: 'Updates a delivery type',
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
      description: 'Existing delivery type id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The delivery type to update',
      required: true,
      schema: {
        $ref: '#/definitions/delivery-type',
      },
    }],
    responses: {
      200: {
        description: 'The updated delivery type',
        schema: {
          $ref: '#/definitions/delivery-type-response',
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
        description: 'The delivery type doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('delivery-type', {
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

route.definition('delivery-type-list', customizableList({
  $ref: '#/definitions/delivery-type',
}));

route.definition('delivery-type-response', defineResponse({
  deliveryType: {
    $ref: '#/definitions/delivery-type',
  },
}));
