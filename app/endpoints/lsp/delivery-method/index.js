const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./delivery-method-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/delivery-method/export',
  controller.deliveryMethodExport, {
    tags: [
      'Delivery Method',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-METHOD_READ_ALL',
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

route.get('/lsp/{lspId}/delivery-method/{deliveryMethodId}',
  controller.retrieveById, {
    tags: [
      'Delivery Method',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-METHOD_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'deliveryMethodId',
      in: 'path',
      description: 'The Delivery Method\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns a particular Delivery Method',
    summary: 'Returns a particular Delivery Method',
    responses: {
      200: {
        description: 'Returns a particular Delivery Method',
        schema: {
          $ref: '#/definitions/delivery-method-response',
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

route.get('/lsp/{lspId}/delivery-method',
  controller.deliveryMethodList, {
    tags: [
      'Delivery Method',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-METHOD_READ_ALL',
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
    description: 'Retrieves the Delivery Methods',
    summary: 'Retrieves the Delivery Methods',
    responses: {
      200: {
        description: 'The user Delivery Method',
        schema: {
          $ref: '#/definitions/delivery-method-list',
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

route.post('/lsp/{lspId}/delivery-method',
  controller.deliveryMethodCreate, {
    tags: [
      'Delivery Method',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-METHOD_CREATE_ALL',
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
      description: 'The new Delivery Method',
      required: true,
      schema: {
        $ref: '#/definitions/delivery-method',
      },
    }],
    description: 'Creates a new Delivery Method',
    summary: 'Creates a new Delivery Method',
    responses: {
      200: {
        description: 'The newly created Delivery Method',
        schema: {
          $ref: '#/definitions/delivery-method-list',
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

route.put('/lsp/{lspId}/delivery-method/{deliveryMethodId}',
  controller.deliveryMethodUpdate, {
    tags: [
      'Delivery Method',
    ],
    'x-swagger-security': {
      roles: [
        'DELIVERY-METHOD_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'deliveryMethodId',
      in: 'path',
      description: 'The Delivery Method\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The Delivery Method to upate',
      required: true,
      schema: {
        $ref: '#/definitions/delivery-method',
      },
    }],
    description: 'Updates an existing Delivery Method',
    summary: 'Updates an existing Delivery Method',
    responses: {
      200: {
        description: 'The updated Delivery Method',
        schema: {
          $ref: '#/definitions/delivery-method-list',
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

route.definition('delivery-method-list', customizableList({
  $ref: '#/definitions/delivery-method',
}));

route.definition('delivery-method-response', defineResponse({
  deliveryMethod: {
    $ref: '#/definitions/delivery-method',
  },
}));

route.definition('delivery-method', {
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
