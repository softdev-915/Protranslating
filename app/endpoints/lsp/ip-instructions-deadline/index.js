const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./ip-instructions-deadline-controller');

route.get('/lsp/{lspId}/ip-instructions-deadline/{ipInstructionsDeadlineId}',
  controller.getIpInstructionsDeadline, {
    tags: [
      'IP Instructions Deadline',
    ],
    'x-swagger-security': {
      roles: [
        'IP-INSTRUCTIONS-DEADLINE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'ipInstructionsDeadlineId',
      in: 'path',
      description: 'The ip instructions deadline id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing ip instructions deadline',
    summary: 'Retrieves an ip instructions deadline',
    responses: {
      200: {
        description: 'The ip instructions deadline',
        schema: {
          $ref: '#/definitions/ip-instructions-deadline-response',
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
        description: 'The ip instructions deadline doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/ip-instructions-deadline',
  controller.listIpInstructionsDeadlines, {
    tags: [
      'IP Instructions Deadline',
    ],
    'x-swagger-security': {
      roles: ['IP-INSTRUCTIONS-DEADLINE_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the ip instructions deadline list',
    summary: 'Retrieves the ip instructions deadline list',
    responses: {
      200: {
        description: 'The ip instructions deadline list',
        schema: {
          $ref: '#/definitions/ip-instructions-deadline-list',
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

route.post('/lsp/{lspId}/ip-instructions-deadline',
  controller.create, {
    tags: [
      'IP Instructions Deadline',
    ],
    'x-swagger-security': {
      roles: [
        'IP-INSTRUCTIONS-DEADLINE_CREATE_ALL',
      ],
    },
    description: 'Creates a new IP Instructions Deadline',
    summary: 'Creates a new IP Instructions Deadline',
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
      description: 'The new IP Instructions Deadline',
      required: true,
      schema: {
        $ref: '#/definitions/ip-instructions-deadline',
      },
    }],
    responses: {
      200: {
        description: 'The new created IP Instructions Deadline',
        schema: {
          $ref: '#/definitions/ip-instructions-deadline-response',
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
        description: 'The IP Instructions Deadline already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/ip-instructions-deadline/{ipInstructionsDeadlineId}',
  controller.update, {
    tags: [
      'IP Instructions Deadline',
    ],
    'x-swagger-security': {
      roles: [
        'IP-INSTRUCTIONS-DEADLINE_UPDATE_ALL',
      ],
    },
    description: 'Updates an IP Instructions Deadline',
    summary: 'Updates an IP Instructions Deadline',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'ipInstructionsDeadlineId',
      in: 'path',
      description: 'Existing IP Instructions Deadline id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The IP Instructions Deadline to update',
      required: true,
      schema: {
        $ref: '#/definitions/ip-instructions-deadline',
      },
    }],
    responses: {
      200: {
        description: 'The updated IP Instructions Deadline',
        schema: {
          $ref: '#/definitions/ip-instructions-deadline-response',
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
        description: 'The ip instructions deadline doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('ip-instructions-deadline', {
  properties: {
    _id: {
      type: 'string',
    },
    totalOrClaimsWordCount: {
      type: 'string',
    },
    noticePeriod: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['totalOrClaimsWordCount', 'noticePeriod'],
});

route.definition('ip-instructions-deadline-list', customizableList({
  $ref: '#/definitions/ip-instructions-deadline',
}));

route.definition('ip-instructions-deadline-response', defineResponse({
  'ip-instructions-deadline': {
    $ref: '#/definitions/ip-instructions-deadline',
  },
}));
