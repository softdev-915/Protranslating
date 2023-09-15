const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./translate-segments-controller');

const { defineResponse } = definitions;
const route = module.exports = Router.create();

route.post('/lsp/{lspId}/mt-translator/translate-segments',
  controller.translateSegments, {
    tags: [
      'Portal Translator',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['MT-TRANSLATOR_READ_ALL', 'MT-TRANSLATOR_READ_COMPANY'] },
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
      description: 'Data for translation',
      required: true,
      schema: {
        $ref: '#/definitions/segment-translation-data',
      },
    }],
    description: 'Returns translated text using selected model',
    summary: 'Returns a JSON array of translated text',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/translated-text',
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

route.post('/lsp/{lspId}/mt-translator/translate-suggestions',
  controller.translateSuggest, {
    tags: [
      'Portal Translator',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['MT-TRANSLATOR_READ_ALL', 'MT-TRANSLATOR_READ_COMPANY'] },
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
      description: 'Data for translation',
      required: true,
      schema: {
        $ref: '#/definitions/suggestion-request-data',
      },
    }],
    description: 'Returns translated text using selected model',
    summary: 'Returns a JSON array of translated text',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/translated-text',
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

route.definition('translated-text', defineResponse({
  translatedText: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
  mtNode: {
    type: 'string',
  },
}));

route.definition('segment-translation-data', {
  properties: {
    source: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    sourceLang: {
      type: 'string',
    },
    targetLang: {
      type: 'string',
    },
    model: {
      type: 'string',
    },
  },
  required: ['source', 'sourceLang', 'targetLang', 'model'],
});

route.definition('suggestion-request-data', {
  properties: {
    source: {
      type: 'string',
    },
    prefix: {
      type: 'string',
    },
    sourceLang: {
      type: 'string',
    },
    targetLang: {
      type: 'string',
    },
    models: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['source', 'sourceLang', 'targetLang', 'models', 'prefix'],
});

route.definition('suggestion-model', {
  properties: {
    model_version: {
      type: 'string',
    },
    model_name: {
      type: 'string',
    },
    language: {
      type: 'string',
    },
    translations: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['model_version', 'model_name', 'language', 'translations'],
});

route.definition('suggestion-data', {
  properties: {
    suggestions: {
      type: 'object',
      $ref: '#/definitions/suggestion-model',
    },
    mtNode: {
      type: 'string',
    },
  },
});
