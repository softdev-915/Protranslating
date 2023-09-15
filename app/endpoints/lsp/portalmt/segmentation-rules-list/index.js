const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./segmentation-rules-list-controller');

const { defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/mt-translator/segmentation-rules-list',
  controller.getLSPSegmentationRules, {
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
    }],
    description: 'Returns segmentations rules for LSP',
    summary: 'Returns a JSON array of objects with SR id and SR name',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/segmentation-rules-list',
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

route.get('/lsp/{lspId}/mt-translator/company/{companyId}/segmentation-rules-list',
  controller.getCompanySegmentationRules, {
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
    }],
    description: 'Returns segmentations rules for company',
    summary: 'Returns a JSON array of objects with SR id and SR name',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/segmentation-rules-list',
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

route.get('/lsp/{lspId}/mt-translator/segmentation-rule/{srId}',
  controller.getSegmentationRule, {
    tags: [
      'Portal Translator',
    ],
    'x-swagger-security': {
      roles: ['MT-TRANSLATOR_READ_ALL'],
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
      description: 'The SR file id',
      type: 'string',
      required: true,
    }],
    description: 'Returns segmentations rule by id',
    summary: 'Returns a JSON object with SR',
    produces: ['application/json'],
    responses: {
      200: {
        description: 'JSON containing the data',
        schema: {
          $ref: '#/definitions/segmentation-rule',
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

route.definition('segmentation-rules-list', defineResponse({
  segmentationRulesList: {
    type: 'array',
    items: {
      type: 'object',
      $ref: '#/definitions/segmentation-rule',
    },
  },
}));

route.definition('segmentation-rule', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['name', '_id'],
});
