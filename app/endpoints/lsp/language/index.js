const definitions = require('../../../components/application/definitions');
const Router = require('../../../components/application/route');

const route = module.exports = Router.create();
const { customizableList, defineResponse } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const controller = require('./language-controller');

route.get('/lsp/{lspId}/language/export',
  controller.languageExport, {
    tags: [
      'Language',
    ],
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

route.get('/lsp/{lspId}/language/{languageId}',
  controller.languageList, {
    tags: [
      'Language',
    ],
    description: 'Retrieves the Language\'s detail',
    summary: 'Retrieves the Language\'s detail',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'languageId',
      in: 'path',
      description: 'The language\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The language\'s detail',
        schema: {
          $ref: '#/definitions/language-response',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
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

route.get('/lsp/{lspId}/language',
  controller.languageList, {
    tags: [
      'Language',
    ],
    description: 'Retrieves the Language\'s list',
    summary: 'Retrieves the Language\'s list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The language list',
        schema: {
          $ref: '#/definitions/language-list',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
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

route.post('/lsp/{lspId}/language',
  controller.languageCreate, {
    tags: [
      'Language',
    ],
    'x-swagger-security': {
      roles: ['LANGUAGE_CREATE_ALL'],
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
      description: 'The new language',
      required: true,
      schema: {
        $ref: '#/definitions/language',
      },
    }],
    description: 'Creates a new language',
    summary: 'Creates a new language',
    responses: {
      200: {
        description: 'The newly created language',
        schema: {
          $ref: '#/definitions/language-list',
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

route.put('/lsp/{lspId}/language/{languageId}',
  controller.languageUpdate, {
    tags: [
      'Language',
    ],
    'x-swagger-security': {
      roles: ['LANGUAGE_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'languageId',
      in: 'path',
      description: 'The language\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The language to upate',
      required: true,
      schema: {
        $ref: '#/definitions/language',
      },
    }],
    description: 'Updates a language',
    summary: 'Updates a language',
    responses: {
      200: {
        description: 'The updated language',
        schema: {
          $ref: '#/definitions/language-list',
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

route.definition('language-list', customizableList({
  $ref: '#/definitions/language',
}));

route.definition('language-response', defineResponse({
  language: {
    $ref: '#/definitions/language',
  },
}));

route.definition('generic-language', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
    cultureCode: {
      type: 'string',
    },
  },
});

route.definition('input-language', {
  properties: {
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
  },
  required: ['isoCode'],
});

route.definition('language', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
});
