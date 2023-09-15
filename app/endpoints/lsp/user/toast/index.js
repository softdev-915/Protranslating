const Router = require('../../../../components/application/route');
const { customizableList, defineResponse } = require('../../../../components/application/definitions');

const route = module.exports = Router.create();

const controller = require('./user-toast-controller');

route.get('/lsp/{lspId}/user/{userId}/toast',
  controller.list, {
    tags: [
      'Toast', 'User',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Retrieves all visible toast for a user',
    summary: 'Retrieves all visible toast for a user',
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
        description: 'The user\'s toast list',
        schema: {
          $ref: '#/definitions/user-toast-list',
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

route.put('/lsp/{lspId}/user/{userId}/toast/{toastId}',
  controller.edit, {
    tags: [
      'User', 'Grid',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Deletes a users\'s grid configuration',
    summary: 'Deletes a users\'s grid configuration',
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
      name: 'toastId',
      in: 'path',
      description: 'The toast\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The user toast to update',
      required: true,
      schema: {
        $ref: '#/definitions/user-toast-input',
      },
    }],
    responses: {
      200: {
        description: 'the updated toast',
        schema: {
          $ref: '#/definitions/user-toast-response',
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

route.definition('user-toast', {
  type: 'object',
  properties: {
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
    lastReadTime: {
      type: 'string',
      format: 'date-time',
    },
    dismissedTime: {
      type: 'string',
      format: 'date-time',
    },
    requireDismiss: {
      type: 'boolean',
    },
    ttl: {
      type: 'number',
    },
    from: {
      type: 'string',
      format: 'date-time',
    },
    to: {
      type: 'string',
      format: 'date-time',
    },
  },
});

route.definition('user-toast-input', {

});

route.definition('user-toast-list', customizableList({
  $ref: '#/definitions/user-toast',
}));

route.definition('user-toast-response', defineResponse({
  user: {
    $ref: '#/definitions/user-toast',
  },
}));
