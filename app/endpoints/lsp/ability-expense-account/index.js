const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./ability-expense-account-controller');

route.get('/lsp/{lspId}/ability-expense-account/export',
  controller.abilityExpenseAccountExport, {
    tags: [
      'Ability Expense Account',
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

route.get('/lsp/{lspId}/ability-expense-account/{abilityExpenseAccountId}',
  controller.retrieveById, {
    tags: [
      'Ability Expense Account',
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
      name: 'abilityExpenseAccountId',
      in: 'path',
      description: 'The abilityExpenseAccount\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves an existing ability expense account',
    summary: 'Retrieves an ability existing expense account',
    responses: {
      200: {
        description: 'The ability expense account',
        schema: {
          $ref: '#/definitions/ability-expense-account-response',
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
        description: 'The ability expense account doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/ability-expense-account',
  controller.list, {
    tags: [
      'Ability Expense account',
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
    description: 'Retrieves the ability expense account list',
    summary: 'Retrieves the ability expense account list',
    responses: {
      200: {
        description: 'The ability expense account list',
        schema: {
          $ref: '#/definitions/ability-expense-account-list',
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

route.post('/lsp/{lspId}/ability-expense-account',
  controller.create, {
    tags: [
      'Ability Expense account',
    ],
    'x-swagger-security': {
      roles: [
        'EXPENSE-ACCOUNT_CREATE_ALL',
      ],
    },
    description: 'Creates a new ability expense account',
    summary: 'Creates a new ability expense account',
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
      description: 'The new ability expense account',
      required: true,
      schema: {
        $ref: '#/definitions/ability-expense-account',
      },
    }],
    responses: {
      200: {
        description: 'The new created ability expense account',
        schema: {
          $ref: '#/definitions/ability-expense-account-response',
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
        description: 'The ability expense account already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/ability-expense-account/{abilityExpenseAccountId}',
  controller.update, {
    tags: [
      'Ability Expense account',
    ],
    'x-swagger-security': {
      roles: [
        'EXPENSE-ACCOUNT_UPDATE_ALL',
      ],
    },
    description: 'Updates an ability expense account',
    summary: 'Updates an ability expense account',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'abilityExpenseAccountId',
      in: 'path',
      description: 'Existing ability expense account id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The ability expense account to update',
      required: true,
      schema: {
        $ref: '#/definitions/ability-expense-account',
      },
    }],
    responses: {
      200: {
        description: 'The updated ability expense account',
        schema: {
          $ref: '#/definitions/ability-expense-account-response',
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
        description: 'The ability expense account doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('ability-expense-account', {
  properties: {
    _id: {
      type: 'string',
    },
    expenseAccount: {
      type: 'string',
    },
    ability: {
      type: 'string',
    },
    inactive: {
      type: 'boolean',
    },
  },
  required: ['expenseAccount', 'ability'],
});

route.definition('ability-expense-account-list', customizableList({
  $ref: '#/definitions/ability-expense-account',
}));

route.definition('ability-expense-account-response', defineResponse({
  'ability-expense-account': {
    $ref: '#/definitions/ability-expense-account',
    properties: {
      ability: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      },
      expenseAccount: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
        },
      },
    },
  },
}));
