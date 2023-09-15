const Router = require('../../../components/application/route');
const defineResponse = require('../../../components/application/definitions').defineResponse;

const route = module.exports = Router.create();

const controller = require('./documentation-controller');

route.get('/lsp/{lspId}/documentation/{name}',
  controller.getDocumentation, {
    tags: [
      'Documentation',
    ],
    'x-swagger-security': {
      roles: ['DOCUMENTATION_READ_ALL'],
    },
    description: 'Retrieves the application\'s documentation for a topic',
    summary: 'Retrieves the application\'s documentation for a topic',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'name',
      in: 'path',
      description: 'The documentation name',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The documentation for the route',
        schema: {
          $ref: '#/definitions/documentation-response',
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

route.get('/lsp/{lspId}/documentation',
  controller.getDocumentation, {
    tags: [
      'Documentation',
    ],
    'x-swagger-security': {
      roles: ['DOCUMENTATION_READ_ALL'],
    },
    description: 'Retrieves all the application\'s documentation',
    summary: 'Retrieves all the application\'s documentation',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'keywords',
      in: 'query',
      description: 'Search documentation keywords',
      type: 'string',
    }],
    responses: {
      200: {
        description: 'The documentation for the route',
        schema: {
          $ref: '#/definitions/documentation-list-response',
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

route.put('/lsp/{lspId}/documentation/{name}',
  controller.update, {
    tags: [
      'Documentation',
    ],
    'x-swagger-security': {
      roles: [
        'DOCUMENTATION_UPDATE_ALL',
      ],
    },
    description: 'Update the application\'s documentation for a topic',
    summary: 'Update the application\'s documentation for a topic',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'name',
      in: 'path',
      required: true,
      description: 'The documentation name',
      type: 'string',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new schedule',
      required: true,
      schema: {
        $ref: '#/definitions/documentation-input',
      },
    }],
    responses: {
      200: {
        description: 'The new created group',
        schema: {
          $ref: '#/definitions/documentation',
        },
      },
      400: {
        description: 'Bad request',
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
      404: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('documentation', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    lang: {
      type: 'string',
    },
    unformattedHelp: {
      type: 'string',
    },
    help: {
      type: 'string',
    },
    creation: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: ['name', 'title', 'lang', 'unformattedHelp', 'help'],
});

route.definition('documentation-input', {
  properties: {
    name: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    lang: {
      type: 'string',
    },
    help: {
      type: 'string',
    },
  },
  required: ['name', 'title', 'lang', 'help'],
});

route.definition('documentation-list-response', defineResponse({
  documentation: {
    type: 'array',
    items: {
      $ref: '#/definitions/documentation',
    },
  },
}));

route.definition('documentation-response', defineResponse({
  documentation: {
    $ref: '#/definitions/documentation',
  },
}));
