const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./translation-unit-controller');

route.get('/lsp/{lspId}/translation-unit/export',
  controller.translationUnitExport, {
    tags: [
      'Billing Unit',
    ],
    'x-swagger-security': {
      roles: [
        'TRANSLATION-UNIT_READ_ALL',
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

route.get('/lsp/{lspId}/translation-unit/{translationUnitId}',
  controller.list, {
    tags: [
      'Billing Unit',
    ],
    'x-swagger-security': {
      roles: [
        'TRANSLATION-UNIT_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'translationUnitId',
      in: 'path',
      description: 'The billing unit id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing billing unit',
    summary: 'Retrieves an existing billing unit',
    responses: {
      200: {
        description: 'The billing unit',
        schema: {
          $ref: '#/definitions/translation-unit-response',
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
        description: 'The billing unit doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/translation-unit',
  controller.list, {
    tags: [
      'Billing Unit',
    ],
    'x-swagger-security': {
      roles: ['TRANSLATION-UNIT_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the translation units list',
    summary: 'Retrieves the translation units list',
    responses: {
      200: {
        description: 'The units list',
        schema: {
          $ref: '#/definitions/translation-unit-list',
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

route.post('/lsp/{lspId}/translation-unit',
  controller.create, {
    tags: [
      'Billing Unit',
    ],
    'x-swagger-security': {
      roles: [
        'TRANSLATION-UNIT_CREATE_ALL',
      ],
    },
    description: 'Creates a new Billing Unit',
    summary: 'Creates a new Billing Unit',
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
      description: 'The new Billing Unit',
      required: true,
      schema: {
        $ref: '#/definitions/translation-unit',
      },
    }],
    responses: {
      200: {
        description: 'The new created Billing Unit',
        schema: {
          $ref: '#/definitions/translation-unit-response',
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
        description: 'The Billing Unit already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/translation-unit/{translationUnitId}',
  controller.update, {
    tags: [
      'Billing Unit',
    ],
    'x-swagger-security': {
      roles: [
        'TRANSLATION-UNIT_UPDATE_ALL',
      ],
    },
    description: 'Updates a Billing Unit',
    summary: 'Updates a Billing Unit',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'translationUnitId',
      in: 'path',
      description: 'Existing Billing Unit id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The Billing unit to update',
      required: true,
      schema: {
        $ref: '#/definitions/translation-unit',
      },
    }],
    responses: {
      200: {
        description: 'The updated Billing Unit',
        schema: {
          $ref: '#/definitions/translation-unit-response',
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
        description: 'The billing unit doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('translation-unit', {
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

route.definition('translation-unit-list', customizableList({
  $ref: '#/definitions/translation-unit',
}));

route.definition('translation-unit-response', defineResponse({
  'translation-unit': {
    $ref: '#/definitions/translation-unit',
  },
}));
