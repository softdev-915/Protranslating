const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./vendor-minimum-charge-controller');

route.get('/lsp/{lspId}/vendor-minimum-charge/export',
  controller.vendorMinimumChargeExport, {
    tags: [
      'Vendor Minimum Charge',
    ],
    'x-swagger-security': {
      roles: [
        'VENDOR-MIN-CHARGE_READ_ALL',
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

route.get('/lsp/{lspId}/vendor-minimum-charge/{vendorMinimumChargeId}',
  controller.retrieveById, {
    tags: [
      'Vendor Minimum Charge',
    ],
    'x-swagger-security': {
      roles: [
        'VENDOR-MIN-CHARGE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'vendorMinimumChargeId',
      in: 'path',
      description: 'The vendorMinimumCharge\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing vendor minimum charge',
    summary: 'Retrieves an existing vendor minimum charge',
    responses: {
      200: {
        description: 'The vendor minimum charge',
        schema: {
          $ref: '#/definitions/vendor-minimum-charge-response',
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
        description: 'The vendor minimum charge doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/vendor-minimum-charge',
  controller.list, {
    tags: [
      'Vendor Minimum Charge',
    ],
    'x-swagger-security': {
      roles: ['VENDOR-MIN-CHARGE_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the vendor minimum charge list',
    summary: 'Retrieves the vendor minimum charge list',
    responses: {
      200: {
        description: 'The vendor minimum charge list',
        schema: {
          $ref: '#/definitions/vendor-minimum-charge-list',
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
route.get('/lsp/{lspId}/provider-minimum-charge',
  controller.retrieveProviderMinimumCharge, {
    tags: [
      'Vendor Minimum Charge',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'VENDOR-MIN-CHARGE_READ_ALL',
          'TASK_READ_ALL',
          'TASK_READ_OWN',
        ],
      }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'vendorId',
      in: 'query',
      description: 'The vendor\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'ability',
      in: 'query',
      description: 'The ability\'s name',
      type: 'string',
      required: false,
    }, {
      name: 'languageCombination',
      in: 'query',
      description: 'The language combination',
      type: 'string',
      required: false,
    }],
    description: 'Retrieves the vendor minimum charge',
    summary: 'Retrieves the vendor minimum charge',
    responses: {
      200: {
        description: 'The vendor minimum charge',
        schema: {
          $ref: '#/definitions/provider-minimum-charge-response',
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

route.post('/lsp/{lspId}/vendor-minimum-charge',
  controller.create, {
    tags: [
      'Vendor Minimum Charge',
    ],
    'x-swagger-security': {
      roles: [
        'VENDOR-MIN-CHARGE_CREATE_ALL',
      ],
    },
    description: 'Creates a new expense',
    summary: 'Creates a new vendor minimum charge',
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
      description: 'The new vendor minimum charge',
      required: true,
      schema: {
        $ref: '#/definitions/vendor-minimum-charge-input',
      },
    }],
    responses: {
      200: {
        description: 'The new created vendor minimum charge',
        schema: {
          $ref: '#/definitions/vendor-minimum-charge-response',
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
        description: 'The vendor minimum charge already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/vendor-minimum-charge/{vendorMinimumChargeId}',
  controller.update, {
    tags: [
      'Vendor Minimum Charge',
    ],
    'x-swagger-security': {
      roles: [
        'VENDOR-MIN-CHARGE_UPDATE_ALL',
      ],
    },
    description: 'Updates an vendor minimum charge',
    summary: 'Updates an vendor minimum charge',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'vendorMinimumChargeId',
      in: 'path',
      description: 'Existing vendor minimum charge id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The vendor minimum charge to update',
      required: true,
      schema: {
        $ref: '#/definitions/vendor-minimum-charge-input',
      },
    }],
    responses: {
      200: {
        description: 'The updated vendor minimum charge',
        schema: {
          $ref: '#/definitions/vendor-minimum-charge-response',
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
        description: 'The vendor minimum charge doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('vendor-minimum-charge', {
  properties: {
    _id: {
      type: 'string',
    },
    vendor: {
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
    vendorName: {
      type: 'string',
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
        type: 'string',
      },
    },
    rate: {
      type: 'number',
    },
  },
  required: ['vendor', 'vendorName'],
});

route.definition('vendor-minimum-charge-list', customizableList({
  $ref: '#/definitions/vendor-minimum-charge',
}));
route.definition('vendor-minimum-charge-input', {
  properties: {
    vendor: {
      type: 'string',
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
    rate: {
      type: 'number',
    },
  },
  required: ['vendor', 'ability'],
});

route.definition('vendor-minimum-charge-response', defineResponse({
  'vendor-minimum-charge': {
    $ref: '#/definitions/vendor-minimum-charge',
  },
}));

route.definition('provider-minimum-charge-response', {
  properties: {
    rate: {
      type: 'number',
    },
  },
  required: ['rate'],
});
