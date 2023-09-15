const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./portalmt-settings-controller');

const { defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/mt-translator/settings',
  controller.getPortalMTSettings, {
    tags: [
      'Portal Translator',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns saved Portal Translator settings for this user',
    summary: 'Returns a JSON object with settings',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/portalmt-settings-response',
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

route.post('/lsp/{lspId}/mt-translator/settings',
  controller.updatePortalMTSettings, {
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
      description: 'Settings for saving',
      required: true,
      schema: {
        $ref: '#/definitions/portalmt-settings',
      },
    }],
    description: 'Returns saved Portal Translator settings for this user',
    summary: 'Returns a JSON object with settings',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/portalmt-settings-response',
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

route.definition('portalmt-settings-response', defineResponse({
  portalTranslatorSettings: {
    $ref: '#/definitions/portalmt-settings',
  },
}));

route.definition('portalmt-settings', {
  properties: {
    sourceLanguage: {
      type: 'string',
    },
    targetLanguage: {
      type: 'string',
    },
    isGeneral: {
      type: 'boolean',
    },
    industry: {
      type: 'string',
    },
    client: {
      type: 'string',
    },
    maxSuggestions: {
      type: 'number',
    },
    isDisplayGeneral: {
      type: 'boolean',
    },
    isDisplayIndustry: {
      type: 'boolean',
    },
    isDisplayClient: {
      type: 'boolean',
    },
    segmentationType: {
      type: 'string',
      enum: ['Client', 'LSP'],
    },
    segmentationCompany: {
      type: 'object',
      $ref: '#/definitions/company',
    },
  },
});
