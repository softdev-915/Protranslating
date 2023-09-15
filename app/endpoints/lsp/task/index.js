const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = module.exports = Router.create();

const controller = require('./task-controller');

route.get('/lsp/{lspId}/task/provider/{providerId}',
  controller.taskList, {
    tags: [
      'Task',
    ],
    'x-swagger-security': {
      roles: ['TASK_READ_OWN'],
    },
    description: 'Retrieves the task list',
    summary: 'Retrieves the task list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'providerId',
      in: 'path',
      description: 'Provider id',
      type: 'string',
      required: true,
    }, {
      name: 'priorityStatus',
      in: 'query',
      description: 'The task prority status to filter the list',
      type: 'string',
      required: false,
    }],
    responses: {
      200: {
        description: 'Task list filtered by provider',
        schema: {
          $ref: '#/definitions/task-management-list',
        },
      },
      400: {
        description: 'Invalid task',
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

route.get('/lsp/{lspId}/task',
  controller.taskGridList, {
    tags: [
      'Task',
    ],
    'x-swagger-security': {
      roles: ['TASK_READ_OWN'],
    },
    description: 'Retrieves the task list filtered by the given criteria',
    summary: 'Retrieves the task list filtered by the given criteria',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }].concat(PAGINATION_PARAMS),
    responses: {
      200: {
        description: 'The task list filtered by the given criteria',
        schema: {
          $ref: '#/definitions/task-list',
        },
      },
      400: {
        description: 'Invalid task',
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

route.get('/lsp/{lspId}/task/export',
  controller.taskGridExport, {
    tags: [
      'Task',
    ],
    'x-swagger-security': {
      roles: ['TASK_READ_OWN'],
    },
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing data from a custom query',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }].concat(PAGINATION_PARAMS),
    responses: {
      200: {
        description: 'The CSV file containing the data',
        schema: {
          $ref: '#/definitions/task-management-list',
        },
      },
      400: {
        description: 'Invalid task',
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

route.definition('task-provider-task', {
  properties: {
    _id: {
      type: 'string',
    },
    provider: {
      $ref: '#/definitions/user-lsp-selected',
    },
    taskDueDate: {
      type: 'string',
      format: 'date-time',
    },
    cancelledAt: {
      type: 'string',
      format: 'date-time',
    },
    status: {
      type: 'string',
    },
    priorityStatus: {
      type: 'string',
    },
  },
});

route.definition('task-workflow-task', {
  properties: {
    _id: {
      type: 'string',
    },
    ability: {
      type: 'string',
    },
    providerTasks: {
      type: 'array',
      items: {
        $ref: '#/definitions/task-provider-task',
      },
    },
  },
});

route.definition('task-workflow', {
  properties: {
    _id: {
      type: 'string',
    },
    language: {
      $ref: '#/definitions/generic-language',
    },
    workflowDueDate: {
      type: 'string',
      format: 'date-time',
    },
    tasks: {
      type: 'array',
      items: {
        $ref: '#/definitions/task-workflow-task',
      },
    },
  },
});

route.definition('task', {
  properties: {
    no: {
      type: 'string',
    },
    company: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        hierarchy: {
          type: 'string',
        },
      },
    },
    contact: {
      $ref: '#/definitions/user-lsp-selected',
    },
    srcLang: {
      $ref: '#/definitions/generic-language',
    },
    tgtLangs: {
      type: 'array',
      items: {
        $ref: '#/definitions/generic-language',
      },
    },
    status: {
      type: 'string',
    },
    workflows: {
      type: 'array',
      items: {
        $ref: '#/definitions/task-workflow',
      },
    },
  },
});

route.definition('dashboard-task', {
  properties: {
    ability: {
      type: 'string',
    },
    providerTasks: {
      type: 'array',
      items: {
        $ref: '#/definitions/provider-task',
      },
    },
    updatedBy: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
  },
});

route.definition('task-management-list', customizableList({
  $ref: '#/definitions/dashboard-task',
}));

route.definition('task-list', customizableList({
  $ref: '#/definitions/task',
}));
