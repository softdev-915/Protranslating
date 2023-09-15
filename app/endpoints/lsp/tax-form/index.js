const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./tax-form-controller');

route.get('/lsp/{lspId}/tax-form/export',
  controller.taxFormExport, {
    tags: [
      'Tax form',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['VENDOR_CREATE_ALL', 'VENDOR_UPDATE_ALL'] }],
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

route.get('/lsp/{lspId}/tax-form/{taxFormId}',
  controller.taxFormList, {
    tags: [
      'Tax form',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['VENDOR_CREATE_ALL', 'VENDOR_UPDATE_ALL'] }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'taxFormId',
      in: 'path',
      description: 'The tax form id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing tax form',
    summary: 'Retrieves an existing tax form',
    responses: {
      200: {
        description: 'The tax form',
        schema: {
          $ref: '#/definitions/tax-form-response',
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
        description: 'The tax form doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/tax-form',
  controller.taxFormList, {
    tags: [
      'Tax form',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['VENDOR_CREATE_ALL', 'VENDOR_UPDATE_ALL'] }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the tax forms list',
    summary: 'Retrieves the tax forms list',
    responses: {
      200: {
        description: 'The tax forms list',
        schema: {
          $ref: '#/definitions/tax-form-list',
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

route.post('/lsp/{lspId}/tax-form',
  controller.taxFormCreate, {
    tags: [
      'Tax form',
    ],
    'x-swagger-security': {
      roles: ['VENDOR_CREATE_ALL'],
    },
    description: 'Creates a new Tax Form',
    summary: 'Creates a new Tax Form',
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
      description: 'The new Tax form',
      required: true,
      schema: {
        $ref: '#/definitions/tax-form',
      },
    }],
    responses: {
      200: {
        description: 'The new created Tax form',
        schema: {
          $ref: '#/definitions/tax-form-response',
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
        description: 'The tax form already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/tax-form/{taxFormId}',
  controller.taxFormUpdate, {
    tags: [
      'Tax form',
    ],
    'x-swagger-security': {
      roles: ['VENDOR_UPDATE_ALL'],
    },
    description: 'Updates a Tax Form',
    summary: 'Updates a Tax Form',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'taxFormId',
      in: 'path',
      description: 'Existing Tax Form id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The Tax Form Method to update',
      required: true,
      schema: {
        $ref: '#/definitions/tax-form',
      },
    }],
    responses: {
      200: {
        description: 'The updated tax form',
        schema: {
          $ref: '#/definitions/tax-form-response',
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
        description: 'The tax form doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('tax-form', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    taxIdRequired: {
      type: 'boolean',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['name'],
});

route.definition('tax-form-list', customizableList({
  $ref: '#/definitions/tax-form',
}));

route.definition('tax-form-response', defineResponse({
  'tax-form': {
    $ref: '#/definitions/tax-form',
  },
}));
