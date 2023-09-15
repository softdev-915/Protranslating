const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./company-external-accounting-code-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/company-external-accounting-codes/export',
  controller.companyExternalAccountingCodeExport, {
    tags: [
      'Company External Accounting Code',
    ],
    'x-swagger-security': {
      roles: [
        'EXTERNAL-ACCOUNTING-CODE_READ_ALL',
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
      500: {
        description: 'Internal error',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/company-external-accounting-code/{companyExternalAccountingCodeId}',
  controller.retrieveById, {
    tags: [
      'Company External Accounting Code',
    ],
    'x-swagger-security': {
      roles: [
        'EXTERNAL-ACCOUNTING-CODE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyExternalAccountingCodeId',
      in: 'path',
      description: 'The companyExternalAccountingCodeId\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves an existing company external accounting code',
    summary: 'Retrieves an existing company external accounting code',
    responses: {
      200: {
        description: 'The company external accounting code',
        schema: {
          $ref: '#/definitions/company-external-accounting-code-response',
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
        description: 'The company external accounting code doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Internal error',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/company-external-accounting-code',
  controller.list, {
    tags: [
      'Company External Accounting Code',
    ],
    'x-swagger-security': {
      roles: [
        'EXTERNAL-ACCOUNTING-CODE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all the company external accounting code',
    summary: 'Retrieves all the company external accounting code',
    responses: {
      200: {
        description: 'The company external accounting code',
        schema: {
          $ref: '#/definitions/company-external-accounting-code-list',
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
      500: {
        description: 'Internal error',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.post('/lsp/{lspId}/company-external-accounting-code',
  controller.create, {
    tags: [
      'Company External Accounting Code',
    ],
    'x-swagger-security': {
      roles: [
        'EXTERNAL-ACCOUNTING-CODE_CREATE_ALL',
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
      description: 'The new company external accounting code',
      required: true,
      schema: {
        $ref: '#/definitions/company-external-accounting-code',
      },
    }],
    description: 'Creates a new company external accounting code',
    summary: 'Creates a new company external accounting code',
    responses: {
      200: {
        description: 'The newly created company external accounting code',
        schema: {
          $ref: '#/definitions/company-external-accounting-code-list',
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
      500: {
        description: 'Internal error',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.put('/lsp/{lspId}/company-external-accounting-code/{companyExternalAccountingCodeId}',
  controller.update, {
    tags: [
      'Company External Accounting Code',
    ],
    'x-swagger-security': {
      roles: [
        'EXTERNAL-ACCOUNTING-CODE_UPDATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyExternalAccountingCodeId',
      in: 'path',
      description: 'The company external accounting code\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The company external accounting code to update',
      required: true,
      schema: {
        $ref: '#/definitions/company-external-accounting-code',
      },
    }],
    description: 'Updates a company existing external accounting code',
    summary: 'Updates a company existing external accounting code',
    responses: {
      200: {
        description: 'The updated company external accounting code',
        schema: {
          $ref: '#/definitions/company-external-accounting-code-response',
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
      500: {
        description: 'Internal error',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.definition('company', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['_id', 'name'],
});

route.definition('company-external-accounting-code', {
  properties: {
    _id: {
      type: 'string',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    companyExternalAccountingCode: {
      type: 'string',
    },
  },
  required: ['company', 'companyExternalAccountingCode'],
});

route.definition('company-external-accounting-code-list', customizableList({
  $ref: '#/definitions/company-external-accounting-code',
}));

route.definition('company-external-accounting-code-response', defineResponse({
  'company-external-accounting-code': {
    $ref: '#/definitions/company-external-accounting-code',
    properties: {
      company: {
        type: 'object',
        $ref: '#/definitions/company',
      },
      companyExternalAccountingCode: {
        type: 'string',
      },
    },
  },
}));
