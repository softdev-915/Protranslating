const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./segment-controller');

const { defineResponse } = definitions;
const route = module.exports = Router.create();

route.post('/lsp/{lspId}/mt-translator/sr/{srId}/segment',
  controller.segmentLSP, {
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
      name: 'srId',
      in: 'path',
      description: 'The segmentation rule id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Data for segmentation',
      required: true,
      schema: {
        $ref: '#/definitions/segmentation-data',
      },
    }],
    description: 'Returns segmented text for lsp using selected SR file',
    summary: 'Returns a JSON array of segmented text',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/segmented-text',
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

route.post('/lsp/{lspId}/mt-translator/company/{companyId}/sr/{srId}/segment',
  controller.segmentCompany, {
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
      name: 'companyId',
      in: 'path',
      description: 'The company id',
      type: 'string',
      required: true,
    }, {
      name: 'srId',
      in: 'path',
      description: 'The segmentation rule id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Data for segmentation',
      required: true,
      schema: {
        $ref: '#/definitions/segmentation-data',
      },
    }],
    description: 'Returns segmented text for company using selected SR file',
    summary: 'Returns a JSON array of segmented text',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/segmented-text',
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

route.definition('segmented-text', defineResponse({
  segmentedText: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}));

route.definition('segmentation-data', {
  properties: {
    text: {
      type: 'string',
    },
    langCode: {
      type: 'string',
    },
  },
});
