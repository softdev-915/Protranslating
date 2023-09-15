const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./mt-model-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/mt-model/export',
  controller.mtModelExport, {
    tags: [
      'MT Model',
    ],
    'x-swagger-security': {
      roles: ['MT-MODEL_READ_ALL'],
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

route.get('/lsp/{lspId}/mt-model/{mtModelId}',
  controller.getMtModel, {
    tags: [
      'MT Model',
    ],
    'x-swagger-security': {
      roles: ['MT-MODEL_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'mtModelId',
      in: 'path',
      description: 'The ability\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves one MT model',
    summary: 'Retrieves one MT model',
    responses: {
      200: {
        description: 'MT model',
        schema: {
          $ref: '#/definitions/ability-response',
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

route.get('/lsp/{lspId}/mt-model',
  controller.mtModelList, {
    tags: [
      'MT Model',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['MT-MODEL_READ_ALL', 'MT-TRANSLATOR_READ_ALL', 'MT-TRANSLATOR_READ_COMPANY'] }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all mt models',
    summary: 'Retrieves all Mt models',
    responses: {
      200: {
        description: 'mt models',
        schema: {
          $ref: '#/definitions/mt-model-list',
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

route.post('/lsp/{lspId}/mt-model',
  controller.mtModelCreate, {
    tags: [
      'MT Model',
    ],
    'x-swagger-security': {
      roles: ['MT-MODEL_CREATE_ALL'],
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
      description: 'The new mt Model',
      required: true,
      schema: {
        $ref: '#/definitions/mt-model',
      },
    }],
    description: 'Creates a new mt model',
    summary: 'Creates a new mt model',
    responses: {
      200: {
        description: 'The newly created mt model',
        schema: {
          $ref: '#/definitions/mt-model',
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

route.put('/lsp/{lspId}/mt-model/{mtModelId}',
  controller.mtModelUpdate, {
    tags: [
      'MT Model',
    ],
    'x-swagger-security': {
      roles: ['MT-MODEL_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'mtModelId',
      in: 'path',
      description: 'The mt model\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The mt model to update',
      required: true,
      schema: {
        $ref: '#/definitions/mt-model',
      },
    }],
    description: 'Updates an existing abillity',
    summary: 'Updates an existing abillity',
    responses: {
      200: {
        description: 'The updated ability',
        schema: {
          $ref: '#/definitions/mt-model',
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

route.definition('mt-model-list', customizableList({
  $ref: '#/definitions/mt-model',
}));

route.definition('mt-model-response', defineResponse({
  ability: {
    $ref: '#/definitions/mt-model',
  },
}));

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
});

route.definition('mt-model', {
  properties: {
    _id: {
      type: 'string',
    },
    code: {
      type: 'string',
    },
    lastTrainedAt: {
      type: 'string',
    },
    sourceLanguage: {
      type: 'object',
      $ref: '#/definitions/language',
    },
    targetLanguage: {
      type: 'object',
      $ref: '#/definitions/language',
    },
    isGeneral: {
      type: 'boolean',
    },
    industry: {
      $ref: '#/definitions/industry-allow-empty',
    },
    deleted: {
      type: 'boolean',
    },
    client: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    isProductionReady: {
      type: 'boolean',
    },
  },
  required: ['_id', 'code', 'lastTrainedAt', 'sourceLanguage', 'targetLanguage'],
});
