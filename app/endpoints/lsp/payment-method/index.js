const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./payment-method-controller');

route.get('/lsp/{lspId}/payment-method/export',
  controller.paymentMethodExport, {
    tags: [
      'Payment method',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['PAYMENT-METHOD_READ_ALL', 'COMPANY-BILLING_READ_OWN', 'COMPANY_UPDATE_ALL'] },
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

route.get('/lsp/{lspId}/payment-method/{paymentMethodId}',
  controller.paymentMethodList, {
    tags: [
      'Payment method',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['PAYMENT-METHOD_READ_ALL', 'COMPANY-BILLING_READ_OWN', 'COMPANY_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'paymentMethodId',
      in: 'path',
      description: 'The payment\'s method id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing payment method',
    summary: 'Retrieves an existing payment method',
    responses: {
      200: {
        description: 'The payment method',
        schema: {
          $ref: '#/definitions/payment-method-response',
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
        description: 'The payment method doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/payment-method',
  controller.paymentMethodList, {
    tags: [
      'Payment method',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['PAYMENT-METHOD_READ_ALL', 'COMPANY-BILLING_READ_OWN', 'COMPANY_UPDATE_ALL', 'BILL_READ_OWN'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the payment methods list',
    summary: 'Retrieves the payment methods list',
    responses: {
      200: {
        description: 'The payment methods list',
        schema: {
          $ref: '#/definitions/payment-method-list',
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

route.post('/lsp/{lspId}/payment-method',
  controller.paymentMethodCreate, {
    tags: [
      'Payment method',
    ],
    'x-swagger-security': {
      roles: [
        'PAYMENT-METHOD_CREATE_ALL',
      ],
    },
    description: 'Creates a new Payment',
    summary: 'Creates a new Payment',
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
      description: 'The new Payment method',
      required: true,
      schema: {
        $ref: '#/definitions/payment-method',
      },
    }],
    responses: {
      200: {
        description: 'The new created Payment method',
        schema: {
          $ref: '#/definitions/payment-method-response',
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
        description: 'The payment method already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/payment-method/{paymentMethodId}',
  controller.paymentMethodUpdate, {
    tags: [
      'Payment method',
    ],
    'x-swagger-security': {
      roles: [
        'PAYMENT-METHOD_UPDATE_ALL',
      ],
    },
    description: 'Updates a Payment',
    summary: 'Updates a Payment',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'paymentMethodId',
      in: 'path',
      description: 'Existing Payment id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The Payment Method to update',
      required: true,
      schema: {
        $ref: '#/definitions/payment-method',
      },
    }],
    responses: {
      200: {
        description: 'The updated payment method',
        schema: {
          $ref: '#/definitions/payment-method-response',
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
        description: 'The payment method doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('payment-method', {
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

route.definition('payment-method-list', customizableList({
  $ref: '#/definitions/payment-method',
}));

route.definition('payment-method-response', defineResponse({
  'payment-method': {
    $ref: '#/definitions/payment-method',
  },
}));
