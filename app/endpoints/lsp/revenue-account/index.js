const Router = require('../../../components/application/route');
const { swaggerPaginationParams: PAGINATION_PARAMS, customizableList } = require('../../../components/application/definitions');
const controller = require('./revenue-account-controller');

const route = module.exports = Router.create();

route.get('/lsp/{lspId}/revenue-account',
  controller.list, {
    tags: [
      'Accounts',
    ],
    'x-swagger-security': {
      roles: ['REVENUE-ACCOUNT_READ_ALL'],
    },
    description: 'Retrieves accounts',
    summary: 'Retrieves accounts',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The accounts list',
        schema: {
          $ref: '#/definitions/revenue-accounts-list',
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

route.get('/lsp/{lspId}/revenue-account/export',
  controller.export, {
    tags: [
      'Accounts',
    ],
    'x-swagger-security': {
      roles: ['REVENUE-ACCOUNT_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Returns a CSV file containing the accounts list',
    summary: 'Returns a CSV file containing the accounts list',
    produces: ['text/csv'],
    responses: {
      200: {
        description: 'The CSV file',
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

route.get('/lsp/{lspId}/revenue-account/{id}',
  controller.details, {
    tags: [
      'Accounts',
    ],
    'x-swagger-security': {
      roles: ['REVENUE-ACCOUNT_READ_ALL'],
    },
    description: 'Retrieves an account by id',
    summary: 'Retrieves an account by id',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The account\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The account details',
        schema: {
          $ref: '#/definitions/revenue-account',
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

route.post('/lsp/{lspId}/revenue-account',
  controller.create, {
    tags: [
      'Accounts',
    ],
    'x-swagger-security': {
      roles: ['REVENUE-ACCOUNT_CREATE_ALL'],
    },
    description: 'Create a new account',
    summary: 'Create a new account',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The account data',
      schema: {
        $ref: '#/definitions/revenue-account',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'Created account',
        schema: {
          $ref: '#/definitions/revenue-account',
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

route.put('/lsp/{lspId}/revenue-account/{id}',
  controller.update, {
    tags: [
      'Accounts',
    ],
    'x-swagger-security': {
      roles: ['REVENUE-ACCOUNT_UPDATE_ALL'],
    },
    description: 'Updates an account',
    summary: 'Updates an account',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The account\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The account data',
      schema: {
        $ref: '#/definitions/revenue-account',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'Updated account details',
        schema: {
          $ref: '#/definitions/revenue-account',
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

route.definition('revenue-account', {
  properties: {
    no: {
      type: ['string', 'number'],
    },
    name: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['no', 'name'],
});

route.definition('revenue-accounts-list', customizableList({
  $ref: '#/definitions/revenue-account',
}));
