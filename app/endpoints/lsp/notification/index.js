const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./notification-controller');

const { customizableList } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const router = Router.create();

router.get('/lsp/{lspId}/notification/export', controller.notificationExport, {
  tags: ['Notification'],
  'x-swagger-security': { roles: ['NOTIFICATION_READ_ALL'] },
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

router.get('/lsp/{lspId}/notification', controller.notificationList, {
  tags: ['Notification'],
  'x-swagger-security': { roles: ['NOTIFICATION_READ_ALL'] },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, ...PAGINATION_PARAMS],
  description: 'Retrieves all the system\'s notifications',
  summary: 'Retrieves all the system\'s notifications',
  responses: {
    200: {
      description: 'The system notifications',
      schema: {
        $ref: '#/definitions/notification-list',
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

router.get('/lsp/{lspId}/notification/backups', controller.getBackupInfo, {
  tags: ['Notification'],
  'x-swagger-security': { roles: ['RESTORE_UPDATE_ALL'] },
  description: 'Retrieves a list of available backups',
  summary: 'Retrieves a list of available backups',
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }],
  responses: {
    200: {
      description: 'Available backups list',
      schema: {
        $ref: '#/definitions/notification-backups',
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

router.put('/lsp/{lspId}/notification/restore', controller.restoreFrom, {
  tags: ['Notification'],
  'x-swagger-security': { roles: ['RESTORE_UPDATE_ALL'] },
  description: 'Restores backups from the cloud',
  summary: 'Restores backups from the cloud',
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
    description: 'The restore\'s details',
    required: true,
    schema: {
      $ref: '#/definitions/notification-restore-input',
    },
  }],
  responses: {
    200: {
      description: 'The notification list',
      schema: {
        $ref: '#/definitions/notification-backups',
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
    403: {
      description: 'Forbidden',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    404: {
      description: 'Request does not exist',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

router.put('/lsp/{lspId}/notification/test-restore-and-backup', controller.testRestoreAndBackup, {
  tags: ['Notification'],
  'x-swagger-security': { roles: ['RESTORE_UPDATE_ALL'] },
  description: 'Tests restore and backup for notification entity per e2e',
  summary: 'Tests restore and backup for notification entity per e2e',
  consumes: ['application/json'],
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }],
  responses: {
    200: {
      description: 'The result of backup and restore testing',
      schema: {
        $ref: '#/definitions/notification-backups',
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
    403: {
      description: 'Forbidden',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

router.get('/lsp/{lspId}/notification/{notificationId}', controller.notificationDetail, {
  tags: [
    'Notification',
  ],
  'x-swagger-security': {
    roles: [
      'NOTIFICATION_READ_ALL',
    ],
  },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'notificationId',
    in: 'path',
    description: 'The notification\'s id',
    type: 'string',
    required: true,
  }],
  description: 'Retrieves detail of system\'s notification',
  summary: 'Retrieves detail of system\'s notification',
  responses: {
    200: {
      description: 'Notification details',
      schema: {
        $ref: '#/definitions/notification',
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

router.definition('notification-restore-input', {
  properties: {
    fromMonth: {
      type: 'number',
    },
    fromYear: {
      type: 'number',
    },
  },
  required: ['fromMonth', 'fromYear'],
});

router.definition('notification-backups', customizableList({
  $ref: '#/definitions/available-backup',
}));

router.definition('notification-list', customizableList({
  $ref: '#/definitions/notification',
}));

router.definition('notification', {
  properties: {
    _id: {
      type: 'string',
    },
    updatedBy: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
      format: 'date',
    },
    updatedAt: {
      type: 'string',
      format: 'date',
    },
    type: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
    error: {
      type: 'string',
    },
    email: {
      type: 'object',
      items: {
        $ref: '#/definitions/notification-email',
      },
    },
  },
  required: ['type', 'createdBy', 'email'],
});

router.definition('notification-email', {
  properties: {
    subject: {
      type: 'string',
    },
    content: {
      type: 'array',
      items: {
        $ref: '#/definitions/notification-content',
      },
    },
    to: {
      type: 'array',
      items: {
        type: 'string',
        format: 'email',
      },
    },
  },
});

router.definition('notification-content', {
  properties: {
    mime: {
      type: 'string',
    },
    data: {
      type: 'string',
    },
  },
});

router.definition('available-backup', {
  properties: {
    year: {
      type: 'string',
    },
    month: {
      type: 'string',
    },
  },
});

module.exports = router;
