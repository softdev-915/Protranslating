const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { customizableList } = definitions;
const { defineResponse } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = Router.create();

const controller = require('./scheduler-controller');

route.put(
  '/lsp/{lspId}/scheduler',
  controller.runNow,

  {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        'SCHEDULER_READ_ALL',
      ],
    },
    description: 'Execute the scheduler immediately',
    summary: 'Execute the scheduler immediately',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The scheduler\' id',
      schema: {
        $ref: '#/definitions/scheduler-put-input',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'Returns the scheduler object',
        schema: {
          $ref: '#/definitions/scheduler-response',
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
  },
);

route.get(
  '/lsp/{lspId}/scheduler/export',
  controller.schedulerExport,

  {
    tags: [
      'Scheduler',
    ],
    'x-swagger-security': {
      roles: [
        'SCHEDULER_READ_ALL',
      ],
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
  },
);

route.get(
  '/lsp/{lspId}/scheduler/{schedulerId}',
  controller.schedulerList,

  {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        'SCHEDULER_READ_ALL',
      ],
    },
    description: 'Retrieves all scheduled jobs',
    summary: 'Retrieves all scheduled jobs',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'schedulerId',
      in: 'path',
      description: 'The scheduler\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The scheduled detail',
        schema: {
          $ref: '#/definitions/scheduler-response',
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
  },
);

route.get(
  '/lsp/{lspId}/scheduler',
  controller.schedulerList,

  {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        'SCHEDULER_READ_ALL',
      ],
    },
    description: 'Retrieves all scheduled jobs',
    summary: 'Retrieves all scheduled jobs',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The scheduled jobs list',
        schema: {
          $ref: '#/definitions/scheduler-list',
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

route.put(
  '/lsp/{lspId}/scheduler/{schedulerId}',
  controller.update,

  {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        'SCHEDULER_UPDATE_ALL',
      ],
    },
    description: 'Update a scheduled job',
    summary: 'Updates a scheduled job',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'schedulerId',
      in: 'path',
      description: 'Existing schedule id',
      required: true,
      type: 'string',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new schedule',
      required: true,
      schema: {
        $ref: '#/definitions/scheduler',
      },
    }],
    responses: {
      200: {
        description: 'The updated scheduled job',
        schema: {
          $ref: '#/definitions/scheduler-response',
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
  },
);

route.definition('scheduler', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    every: {
      type: 'string',
    },
    options: {
      type: 'object',
      $ref: '#/definitions/scheduler-options',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['name', 'every'],
});

route.definition('scheduler-options', {
  properties: {
    lockLifetime: {
      type: 'number',
    },
    priority: {
      type: 'string',
      enum: ['lowest', 'low', 'normal', 'high', 'highest'],
    },
    additionalValues: {
      type: 'object',
    },
    additionalSchema: {
      type: 'object',
    },
    notificationDelay: {
      type: 'number',
    },
  },
});

route.definition('scheduler-list', customizableList({
  $ref: '#/definitions/scheduler',
}));

route.definition('scheduler-response', defineResponse({
  scheduler: {
    $ref: '#/definitions/scheduler',
  },
}));

route.definition('scheduler-put-input', {
  properties: {
    schedulerId: {
      type: 'string',
    },
  },
  required: ['schedulerId'],
});

module.exports = route;
