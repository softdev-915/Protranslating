const Router = require('../../../components/application/route');
const { customizableList, defineResponse, swaggerPaginationParams } = require('../../../components/application/definitions');
const definitions = require('../../../components/application/definitions');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = module.exports = Router.create();

const controller = require('./toast-controller');

route.get('/lsp/{lspId}/toast/export',
  controller.toastExport, {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [],
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
  });

route.get('/lsp/{lspId}/toast',
  controller.list, {
    tags: [
      'Toast',
    ],
    'x-swagger-security': {
      roles: ['HEADER-NOTIFICATION_READ_ALL'],
    },
    description: 'Retrieves the toast detail for a toast',
    summary: 'Retrieves the toast detail for a toast',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'lsp-tz',
      in: 'header',
      description: 'UTC timezone offset in minutes',
      type: 'number',
    }, ...swaggerPaginationParams],
    responses: {
      200: {
        description: 'The toast list',
        schema: {
          $ref: '#/definitions/toast-list',
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

route.get('/lsp/{lspId}/toast/{toastId}',
  controller.list, {
    tags: [
      'Toast',
    ],
    'x-swagger-security': {
      roles: ['HEADER-NOTIFICATION_READ_ALL'],
    },
    description: 'Retrieves the toast detail for a toast',
    summary: 'Retrieves the toast detail for a toast',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'toastId',
      in: 'path',
      description: 'The toast\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'lsp-tz',
      in: 'header',
      description: 'UTC timezone offset in minutes',
      type: 'number',
    }, ...swaggerPaginationParams],
    responses: {
      200: {
        description: 'The toast list',
        schema: {
          $ref: '#/definitions/toast-list',
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

route.post('/lsp/{lspId}/toast',
  controller.create, {
    tags: [
      'Toast',
    ],
    'x-swagger-security': {
      // to retrieve the user's own toast notifications
      // there is no role required
      roles: ['HEADER-NOTIFICATION_CREATE_ALL'],
    },
    description: 'Create a toast',
    summary: 'Create a toast',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'lsp-tz',
      in: 'header',
      description: 'UTC timezone offset in minutes',
      type: 'number',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new toast to create',
      required: true,
      schema: {
        $ref: '#/definitions/toast-input',
      },
    }],
    responses: {
      200: {
        description: 'The user\'s own toast list',
        schema: {
          $ref: '#/definitions/toast-response',
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

route.put('/lsp/{lspId}/toast/{toastId}',
  controller.edit, {
    tags: [
      'Toast',
    ],
    'x-swagger-security': {
      // to retrieve the user's own toast notifications
      // there is no role required
      roles: ['HEADER-NOTIFICATION_CREATE_ALL'],
    },
    description: 'Create a toast',
    summary: 'Create a toast',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'toastId',
      in: 'path',
      description: 'The toast\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'lsp-tz',
      in: 'header',
      description: 'UTC timezone offset in minutes',
      type: 'number',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new request to create',
      required: true,
      schema: {
        $ref: '#/definitions/toast-input',
      },
    }],
    responses: {
      200: {
        description: 'The user\'s own toast list',
        schema: {
          $ref: '#/definitions/toast-response',
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

route.definition('toast', {
  properties: {
    lspId: {
      type: 'string',
    },
    usersName: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    users: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    title: {
      type: 'string',
    },
    message: {
      type: 'string',
    },
    state: {
      type: 'string',
      enum: ['success', 'danger', 'warning', 'info'],
    },
    context: {
      type: 'object',
      properties: {},
    },
    from: {
      type: 'string',
      format: 'date-time',
    },
    to: {
      type: 'string',
      format: 'date-time',
    },
    updatedBy: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
  },
});

route.definition('toast-input', {
  properties: {
    users: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    message: {
      type: 'string',
    },
    state: {
      type: 'string',
      enum: ['success', 'danger', 'warning', 'info'],
    },
    context: {
      type: 'object',
      properties: {},
    },
    requireDismiss: {
      type: 'boolean',
    },
    from: {
      type: 'string',
    },
    to: {
      type: 'string',
    },
  },
  required: ['users', 'message', 'requireDismiss'],
});

route.definition('toast-list', customizableList({
  $ref: '#/definitions/toast',
}));

route.definition('toast-response', defineResponse({
  toast: {
    $ref: '#/definitions/toast',
  },
}));
