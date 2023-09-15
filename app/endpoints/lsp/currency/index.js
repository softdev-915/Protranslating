const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./currency-controller');

route.get('/lsp/{lspId}/currency/export',
  controller.currencyExport, {
    tags: [
      'Currency',
    ],
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

route.get('/lsp/{lspId}/currency',
  controller.list, {
    tags: [
      'Currency',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the currencies',
    summary: 'Retrieves the currencies',
    responses: {
      200: {
        description: 'The currencies list',
        schema: {
          $ref: '#/definitions/currency-list',
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

route.get('/lsp/{lspId}/currency/{currencyId}',
  controller.list, {
    tags: [
      'Currency',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'currencyId',
      in: 'path',
      description: 'The currency id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing currency',
    summary: 'Retrieves an existing currency',
    responses: {
      200: {
        description: 'The currency',
        schema: {
          $ref: '#/definitions/currency-response',
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
        description: 'The currency doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.post('/lsp/{lspId}/currency',
  controller.create, {
    tags: [
      'Currency',
    ],
    'x-swagger-security': {
      roles: [
        'CURRENCY_CREATE_ALL',
      ],
    },
    description: 'Creates a new Currency',
    summary: 'Creates a new Currency',
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
      description: 'The new Currency',
      required: true,
      schema: {
        $ref: '#/definitions/currency',
      },
    }],
    responses: {
      200: {
        description: 'The new created Currency',
        schema: {
          $ref: '#/definitions/currency-response',
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
        description: 'The currency already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/currency/{currencyId}',
  controller.update, {
    tags: [
      'Currency',
    ],
    'x-swagger-security': {
      roles: [
        'CURRENCY_UPDATE_ALL',
      ],
    },
    description: 'Updates a Currency',
    summary: 'Updates a Currency',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'currencyId',
      in: 'path',
      description: 'Existing currency id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The currency to update',
      required: true,
      schema: {
        $ref: '#/definitions/currency',
      },
    }],
    responses: {
      200: {
        description: 'The updated currency',
        schema: {
          $ref: '#/definitions/currency-response',
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
        description: 'The currency doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('currency', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
    symbol: {
      type: 'string',
    },
  },
  required: ['name', 'isoCode'],
});
route.definition('currency-list', customizableList({
  $ref: '#/definitions/currency',
}));

route.definition('currency-response', defineResponse({
  currency: {
    $ref: '#/definitions/currency',
  },
}));
