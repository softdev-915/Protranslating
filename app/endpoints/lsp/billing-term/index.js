const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./billing-term-controller');

route.get('/lsp/{lspId}/billing-term/export',
  controller.billingTermExport, {
    tags: [
      'Billing terms',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['BILLING-TERM_READ_ALL', 'COMPANY-BILLING_READ_OWN', 'COMPANY_UPDATE_ALL'] },
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

route.get('/lsp/{lspId}/billing-term/{billingTermId}',
  controller.list, {
    tags: [
      'Billing term',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['BILLING-TERM_READ_ALL', 'COMPANY-BILLING_READ_OWN', 'COMPANY_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billingTermId',
      in: 'path',
      description: 'The billing\'s term id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing billing term',
    summary: 'Retrieves an existing billing term',
    responses: {
      200: {
        description: 'The billing term',
        schema: {
          $ref: '#/definitions/billing-term-response',
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
        description: 'The billing term doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/billing-term',
  controller.list, {
    tags: [
      'Billing term',
    ],
    'x-swagger-security': {
      // billing term should be read by anybody with access to update a company
      roles: [
        { oneOf: ['BILLING-TERM_READ_ALL', 'COMPANY-BILLING_READ_OWN', 'COMPANY_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the billing terms list',
    summary: 'Retrieves the billing terms list',
    responses: {
      200: {
        description: 'The billing terms list',
        schema: {
          $ref: '#/definitions/billing-term-list',
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

route.post('/lsp/{lspId}/billing-term',
  controller.create, {
    tags: [
      'Billing term',
    ],
    'x-swagger-security': {
      roles: [
        'BILLING-TERM_CREATE_ALL',
      ],
    },
    description: 'Creates a new Billing term',
    summary: 'Creates a new Billing term',
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
      description: 'The new Billing',
      required: true,
      schema: {
        $ref: '#/definitions/billing-term',
      },
    }],
    responses: {
      200: {
        description: 'The new created Billing',
        schema: {
          $ref: '#/definitions/billing-term-response',
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
        description: 'The billing term already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/billing-term/{billingTermId}',
  controller.update, {
    tags: [
      'Billing term',
    ],
    'x-swagger-security': {
      roles: [
        'BILLING-TERM_UPDATE_ALL',
      ],
    },
    description: 'Updates a Billing term',
    summary: 'Updates a Billing term',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billingTermId',
      in: 'path',
      description: 'Existing billing term id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The billing term',
      required: true,
      schema: {
        $ref: '#/definitions/billing-term',
      },
    }],
    responses: {
      200: {
        description: 'The updated billing term entity',
        schema: {
          $ref: '#/definitions/billing-term-response',
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
        description: 'The billing term doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('billing-term', {
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
    days: {
      type: ['number', 'string', 'null'],
    },
  },
  required: ['name'],
});

route.definition('billing-term-list', customizableList({
  $ref: '#/definitions/billing-term',
}));

route.definition('billing-term-response', defineResponse({
  'billing-term': {
    $ref: '#/definitions/billing-term',
  },
}));
