const Router = require('../../../components/application/route');
const {
  swaggerPaginationParams, customizableList,
} = require('../../../components/application/definitions');
const controller = require('./bank-account-controller');

const route = module.exports = Router.create();

route.get('/lsp/{lspId}/bank-account',
  controller.list, {
    tags: ['Accounts'],
    'x-swagger-security': { roles: ['BANK-ACCOUNT_READ_ALL'] },
    description: 'Retrieves accounts',
    summary: 'Retrieves accounts',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...swaggerPaginationParams],
    responses: {
      200: {
        description: 'The accounts list',
        schema: { $ref: '#/definitions/bank-account-list' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/bank-account/export',
  controller.export, {
    tags: ['Accounts'],
    'x-swagger-security': { roles: ['BANK-ACCOUNT_READ_ALL'] },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...swaggerPaginationParams],
    description: 'Returns a CSV file containing the accounts list',
    summary: 'Returns a CSV file containing the accounts list',
    produces: ['text/csv'],
    responses: {
      200: {
        description: 'The CSV file',
        schema: { type: 'file' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/bank-account/{id}',
  controller.details, {
    tags: ['Accounts'],
    'x-swagger-security': { roles: ['BANK-ACCOUNT_READ_ALL'] },
    description: 'Retrieves an bank account by id',
    summary: 'Retrieves an bank account by id',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The bank account\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The bank account details',
        schema: { $ref: '#/definitions/bank-account' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.post('/lsp/{lspId}/bank-account',
  controller.create, {
    tags: ['Accounts'],
    'x-swagger-security': { roles: ['BANK-ACCOUNT_CREATE_ALL'] },
    description: 'Create a new bank account',
    summary: 'Create a new bank account',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The bank account data',
      schema: { $ref: '#/definitions/bank-account' },
      required: true,
    }],
    responses: {
      200: {
        description: 'Created bank account',
        schema: { $ref: '#/definitions/bank-account' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.put('/lsp/{lspId}/bank-account/{id}',
  controller.update, {
    tags: ['Accounts'],
    'x-swagger-security': { roles: ['BANK-ACCOUNT_UPDATE_ALL'] },
    description: 'Updates an bank account',
    summary: 'Updates an bank account',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The baaccount\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The bank account data',
      schema: { $ref: '#/definitions/bank-account' },
      required: true,
    }],
    responses: {
      200: {
        description: 'Updated bank account details',
        schema: { $ref: '#/definitions/bank-account' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.definition('bank-account', {
  properties: {
    no: { type: ['string', 'number'] },
    name: { type: 'string' },
    deleted: { type: 'boolean' },
  },
  required: ['no', 'name'],
});

route.definition('bank-account-list', customizableList({ $ref: '#/definitions/bank-account' }));
