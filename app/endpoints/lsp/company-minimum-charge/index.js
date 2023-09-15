const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./company-minimum-charge-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/company-minimum-charge/min-charge',
  controller.getMinCharge, {
    tags: [
      'Company minimum charge',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-MIN-CHARGE_READ_ALL',
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
      name: 'languageCombination',
      in: 'query',
      description: 'The language combination filter',
      type: 'string',
      required: false,
    },
    {
      name: 'ability',
      in: 'query',
      description: 'The ability filter',
      type: 'string',
      required: true,
    },
    {
      name: 'company',
      in: 'query',
      description: 'The company id filter',
      type: 'string',
      required: true,
    },
    {
      name: 'currencyId',
      in: 'query',
      description: 'The currency id filter',
      type: 'string',
      required: true,
    },
    ],
    description: 'Retrieves all company minimum charges',
    summary: 'Retrieves all the company minimum charges',
    responses: {
      200: {
        description: 'The company minimum charges',
        schema: {
          $ref: '#/definitions/min-charge',
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

route.get('/lsp/{lspId}/company-minimum-charge/export',
  controller.export, {
    tags: [
      'Company minimum charge',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-MIN-CHARGE_CREATE_ALL',
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
  });

route.get('/lsp/{lspId}/company-minimum-charge/{companyMinimumChargeId}',
  controller.detail, {
    tags: [
      'Company minimum charge',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-MIN-CHARGE_READ_ALL',
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
      name: 'companyMinimumChargeId',
      in: 'path',
      description: 'The company minimum charge\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves all company minimum charges',
    summary: 'Retrieves all the company minimum charges',
    responses: {
      200: {
        description: 'The company minimum charges',
        schema: {
          $ref: '#/definitions/company-minimum-charge-response',
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

route.get('/lsp/{lspId}/company-minimum-charge',
  controller.list, {
    tags: [
      'Company minimum charge',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-MIN-CHARGE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all the company minimum charges',
    summary: 'Retrieves all the company minimum charges',
    responses: {
      200: {
        description: 'The company minimum charges',
        schema: {
          $ref: '#/definitions/company-minimum-charge-list',
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

route.post('/lsp/{lspId}/company-minimum-charge',
  controller.create, {
    tags: [
      'Company minimum charge',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-MIN-CHARGE_CREATE_ALL',
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
      description: 'The new company minimum charges',
      required: true,
      schema: {
        $ref: '#/definitions/new-company-minimum-charge',
      },
    }],
    description: 'Creates a new company minimum charges',
    summary: 'Creates a new abillity',
    responses: {
      200: {
        description: 'The newly created company minimum charges',
        schema: {
          $ref: '#/definitions/company-minimum-charge-list',
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

route.put('/lsp/{lspId}/company-minimum-charge/{companyMinimumChargeId}',
  controller.update, {
    tags: [
      'Company minimum charge',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-MIN-CHARGE_UPDATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyMinimumChargeId',
      in: 'path',
      description: 'The company minimum charge\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The company minimum charge to update',
      required: true,
      schema: {
        $ref: '#/definitions/company-minimum-charge',
      },
    }],
    description: 'Updates an existing abillity',
    summary: 'Updates an existing abillity',
    responses: {
      200: {
        description: 'The updated company minimum charge',
        schema: {
          $ref: '#/definitions/company-minimum-charge-list',
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

route.definition('company-minimum-charge-list', customizableList({
  $ref: '#/definitions/company-minimum-charge',
}));

route.definition('company-minimum-charge-response', defineResponse({
  companyMinimumCharge: {
    $ref: '#/definitions/company-minimum-charge',
  },
}));

route.definition('min-charge', {
  properties: {
    minCharge: {
      type: 'number',
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
    hierarchy: {
      type: 'string',
    },
  },
  required: ['_id', 'name'],
});

route.definition('new-company-minimum-charge', {
  properties: {
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    ability: {
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
    languageCombinations: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    minCharge: {
      type: 'number',
    },
    deleted: {
      type: 'boolean',
    },
    currency: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        isoCode: {
          type: 'string',
        },
      },
    },
  },
  required: ['ability', 'minCharge', 'company', 'currency'],
});

route.definition('company-minimum-charge', {
  properties: {
    _id: {
      type: 'string',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    ability: {
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
    languageCombinations: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    minCharge: {
      type: 'number',
    },
    deleted: {
      type: 'boolean',
    },
    currency: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        isoCode: {
          type: 'string',
        },
      },
    },
  },
  required: ['_id', 'ability', 'minCharge', 'company', 'currency'],
});
