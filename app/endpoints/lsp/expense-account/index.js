const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./expense-account-controller');

route.get('/lsp/{lspId}/expense-account/export',
  controller.expenseAccountExport, {
    tags: [
      'Expense Account',
    ],
    'x-swagger-security': {
      roles: [
        'EXPENSE-ACCOUNT_READ_ALL',
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

route.get('/lsp/{lspId}/expense-account/{expenseAccountId}',
  controller.retrieveById, {
    tags: [
      'Expense Account',
    ],
    'x-swagger-security': {
      roles: [
        'EXPENSE-ACCOUNT_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'expenseAccountId',
      in: 'path',
      description: 'The expenseAccount\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing expense account',
    summary: 'Retrieves an existing expense account',
    responses: {
      200: {
        description: 'The expense account',
        schema: {
          $ref: '#/definitions/expense-account-response',
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
        description: 'The expense account doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/expense-account',
  controller.list, {
    tags: [
      'Expense account',
    ],
    'x-swagger-security': {
      roles: ['EXPENSE-ACCOUNT_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the expense account list',
    summary: 'Retrieves the expense account list',
    responses: {
      200: {
        description: 'The expense account list',
        schema: {
          $ref: '#/definitions/expense-account-list',
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

route.post('/lsp/{lspId}/expense-account',
  controller.create, {
    tags: [
      'Expense account',
    ],
    'x-swagger-security': {
      roles: [
        'EXPENSE-ACCOUNT_CREATE_ALL',
      ],
    },
    description: 'Creates a new expense',
    summary: 'Creates a new expense account',
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
      description: 'The new expense account',
      required: true,
      schema: {
        $ref: '#/definitions/expense-account',
      },
    }],
    responses: {
      200: {
        description: 'The new created expense account',
        schema: {
          $ref: '#/definitions/expense-account-response',
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
        description: 'The expense account already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/expense-account/{expenseAccountId}',
  controller.update, {
    tags: [
      'Expense account',
    ],
    'x-swagger-security': {
      roles: [
        'EXPENSE-ACCOUNT_UPDATE_ALL',
      ],
    },
    description: 'Updates an expense account',
    summary: 'Updates an expense account',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'expenseAccountId',
      in: 'path',
      description: 'Existing expense account id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The expense account to update',
      required: true,
      schema: {
        $ref: '#/definitions/expense-account',
      },
    }],
    responses: {
      200: {
        description: 'The updated expense account',
        schema: {
          $ref: '#/definitions/expense-account-response',
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
        description: 'The expense account doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('expense-account', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    number: {
      type: 'string',
    },
    costType: {
      type: 'string',
      enum: ['Variable', 'Fixed'],
    },
    inactive: {
      type: 'boolean',
    },
  },
  required: ['number', 'costType'],
});

route.definition('expense-account-list', customizableList({
  $ref: '#/definitions/expense-account',
}));

route.definition('expense-account-response', defineResponse({
  'expense-account': {
    $ref: '#/definitions/expense-account',
  },
}));
