const Router = require('../../../components/application/route');
const { defineResponse } = require('../../../components/application/definitions');

const route = module.exports = Router.create();

const controller = require('./external-resource-controller');

route.get('/lsp/{lspId}/external-resource',
  controller.retrieve, {
    tags: [
      'External Resource',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: ['EXTERNAL-RESOURCES_READ_ALL', 'EXTERNAL-RESOURCES_UPDATE_ALL'],
      }],
    },
    description: 'Retrieves list of external resource',
    summary: 'Retrieves list of external resource',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The list of files',
        schema: {
          $ref: '#/definitions/external-resource-response',
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
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/external-resource',
  controller.upsert, {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        'EXTERNAL-RESOURCES_UPDATE_ALL',
      ],
    },
    description: 'Updates the list of external resource',
    summary: 'Updates the list of external resource',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new toast to create',
      required: true,
      schema: {
        $ref: '#/definitions/external-resource-input',
      },
    }],
    responses: {
      200: {
        description: 'The list of files',
        schema: {
          $ref: '#/definitions/external-resource-response',
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
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('external-resource-input', {
  properties: {
    html: {
      type: 'string',
    },
  },
  required: ['html'],
});

route.definition('external-resource', {
  properties: {
    _id: {
      type: 'string',
    },
    lspId: {
      type: 'string',
    },
    html: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedBy: {
      type: 'string',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: ['html'],
});

route.definition('external-resource-response', defineResponse({
  externalResource: {
    $ref: '#/definitions/external-resource',
  },
}));
