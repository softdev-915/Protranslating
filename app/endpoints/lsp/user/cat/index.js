const Router = require('../../../../components/application/route');
const defineResponse = require('../../../../components/application/definitions').defineResponse;

const route = module.exports = Router.create();

const controller = require('./cat-config-controller');

const AVAILABLE_COMPONENTS = ['preview', 'editor', 'files'];

route.get('/lsp/{lspId}/user/{userId}/cat',
  controller.retrieve, {
    tags: [
      'CAT', 'User',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Retrieves the basic cat tool layout config',
    summary: 'Retrieves the basic cat tool layout config',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The basic cat tool\'s display configuration',
        schema: {
          $ref: '#/definitions/cat-config-response',
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
      404: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/user/{userId}/cat',
  controller.createOrEdit, {
    tags: [
      'CAT', 'User',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Creates or edits the basic cat tool layout config',
    summary: 'Creates or edits the basic cat tool layout config',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The updated basic cat tool\'s display config',
      required: true,
      schema: {
        $ref: '#/definitions/cat-config',
      },
    }],
    responses: {
      200: {
        description: 'The basic cat tool\'s display configuration',
        schema: {
          $ref: '#/definitions/cat-config-response',
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
    },
  });

route.definition('cat-config', {
  type: 'object',
  properties: {
    northComponent: {
      type: 'string',
      enum: AVAILABLE_COMPONENTS,
    },
    southComponent: {
      type: 'string',
      enum: AVAILABLE_COMPONENTS,
    },
    westComponent: {
      type: 'string',
      enum: AVAILABLE_COMPONENTS,
    },
    northSize: {
      type: 'integer',
    },
    westSize: {
      type: 'integer',
    },
  },
});

route.definition('cat-config-response', defineResponse({
  config: {
    $ref: '#/definitions/cat-config',
  },
}));
