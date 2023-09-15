const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./activity-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/activity/export',
  controller.activityExport, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_READ_ALL',
          'ACTIVITY-NC-CC_READ_OWN',
          'ACTIVITY-VES1_READ_ALL',
          'ACTIVITY-NC-CC_READ_DEPARTMENT',
          'ACTIVITY-USER-NOTE_READ_ALL',
        ] },
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
  });

route.get('/lsp/{lspId}/activity/{activityId}',
  controller.activityList, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_READ_ALL',
          'ACTIVITY-NC-CC_READ_OWN',
          'ACTIVITY-VES1_READ_ALL',
          'ACTIVITY-VES2_READ_ALL',
          'ACTIVITY-VES-T_READ_ALL',
          'ACTIVITY-VES-B_READ_ALL',
          'ACTIVITY-VES-CA_READ_ALL',
          'ACTIVITY-VES-FR_READ_ALL',
          'ACTIVITY-EMAIL_READ_ALL',
          'ACTIVITY-EMAIL_READ_OWN',
          'ACTIVITY-USER-NOTE_READ_ALL',
          'ACTIVITY-NC-CC_READ_DEPARTMENT',
        ] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves all the user activities',
    summary: 'Retrieves all the user activities',
    responses: {
      200: {
        description: 'The user activities',
        schema: {
          $ref: '#/definitions/activity-response',
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

route.put('/lsp/{lspId}/activity/{activityId}/sendQuote',
  controller.sendQuote, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'ACTIVITY-EMAIL_UPDATE_ALL',
            'ACTIVITY-EMAIL_UPDATE_OWN',
          ],
        },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Send an email with the quote',
    summary: 'Send an email with the quote',
    responses: {
      200: {
        description: 'Quote has been sent sucessfully',
        schema: {
          $ref: '#/definitions/activity-list',
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

route.get('/lsp/{lspId}/activity',
  controller.activityList, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_READ_ALL',
          'ACTIVITY-NC-CC_READ_OWN',
          'ACTIVITY-VES1_READ_ALL',
          'ACTIVITY-VES2_READ_ALL',
          'ACTIVITY-VES-T_READ_ALL',
          'ACTIVITY-VES-B_READ_ALL',
          'ACTIVITY-VES-CA_READ_ALL',
          'ACTIVITY-VES-FR_READ_ALL',
          'ACTIVITY-NC-CC_READ_DEPARTMENT',
          'ACTIVITY-EMAIL_READ_ALL',
          'ACTIVITY-EMAIL_READ_OWN',
          'ACTIVITY-USER-NOTE_READ_ALL',
        ] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all the user activities',
    summary: 'Retrieves all the user activities',
    responses: {
      200: {
        description: 'The user activities',
        schema: {
          $ref: '#/definitions/activity-list',
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

route.post('/lsp/{lspId}/activity',
  controller.activityCreate, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_CREATE_ALL',
          'ACTIVITY-NC-CC_CREATE_OWN',
          'ACTIVITY-VES1_CREATE_ALL',
          'ACTIVITY-VES2_CREATE_ALL',
          'ACTIVITY-VES-T_CREATE_ALL',
          'ACTIVITY-VES-B_CREATE_ALL',
          'ACTIVITY-VES-CA_CREATE_ALL',
          'ACTIVITY-VES-FR_CREATE_ALL',
          'ACTIVITY-EMAIL_CREATE_ALL',
          'ACTIVITY-EMAIL_CREATE_OWN',
          'ACTIVITY-USER-NOTE_CREATE_ALL',
          'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
        ] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new activity',
      required: true,
      schema: {
        $ref: '#/definitions/activity',
      },
    }],
    description: 'Creates a new activity',
    summary: 'Creates a new activity',
    responses: {
      200: {
        description: 'The newly created activity',
        schema: {
          $ref: '#/definitions/activity-list',
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

route.put('/lsp/{lspId}/activity/{activityId}',
  controller.activityUpdate, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_UPDATE_ALL',
          'ACTIVITY-VES2_UPDATE_ALL',
          'ACTIVITY-VES-T_UPDATE_ALL',
          'ACTIVITY-VES-B_UPDATE_ALL',
          'ACTIVITY-VES-CA_UPDATE_ALL',
          'ACTIVITY-VES-FR_UPDATE_ALL',
          'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
          'ACTIVITY-EMAIL_UPDATE_OWN',
          'ACTIVITY-EMAIL_UPDATE_ALL',
          'ACTIVITY-USER-NOTE_UPDATE_ALL',
        ] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The activity to upate',
      required: true,
      schema: {
        $ref: '#/definitions/activity',
      },
    }],
    description: 'Updates an existing activity',
    summary: 'Updates an existing activity',
    responses: {
      200: {
        description: 'The updated activity',
        schema: {
          $ref: '#/definitions/activity-list',
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

route.get('/lsp/{lspId}/activity/{activityId}/document/{documentId}/filename/{filename}',
  controller.serveFile, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_CREATE_ALL',
          'ACTIVITY-NC-CC_READ_ALL',
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_CREATE_OWN',
          'ACTIVITY-NC-CC_READ_OWN',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_READ_ALL',
          'ACTIVITY-VES1_CREATE_ALL',
          'ACTIVITY-VES1_UPDATE_ALL',
          'ACTIVITY-VES2_READ_ALL',
          'ACTIVITY-VES2_CREATE_ALL',
          'ACTIVITY-VES2_UPDATE_ALL',
          'ACTIVITY-VES-T_READ_ALL',
          'ACTIVITY-VES-T_CREATE_ALL',
          'ACTIVITY-VES-T_UPDATE_ALL',
          'ACTIVITY-VES-B_READ_ALL',
          'ACTIVITY-VES-B_CREATE_ALL',
          'ACTIVITY-VES-B_UPDATE_ALL',
          'ACTIVITY-CA_READ_ALL',
          'ACTIVITY-CA_CREATE_ALL',
          'ACTIVITY-CA_UPDATE_ALL',
          'ACTIVITY-FR_READ_ALL',
          'ACTIVITY-FR_CREATE_ALL',
          'ACTIVITY-FR_UPDATE_ALL',
          'ACTIVITY-NC-CC_READ_DEPARTMENT',
          'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
          'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
        ],
        },
      ],
    },
    description: 'Retrieves the account\'s users',
    summary: 'Retrieves the activity\'s file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'filename',
      in: 'path',
      description: 'The document\'s filename',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The file\'s content',
        schema: {
          type: 'file',
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
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/emailActivity/{activityId}/document/{documentId}/filename/{filename}',
  controller.serveEmailActivityFile, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_CREATE_ALL',
          'ACTIVITY-NC-CC_READ_ALL',
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_CREATE_OWN',
          'ACTIVITY-NC-CC_READ_OWN',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_READ_ALL',
          'ACTIVITY-VES1_CREATE_ALL',
          'ACTIVITY-VES1_UPDATE_ALL',
          'ACTIVITY-VES2_READ_ALL',
          'ACTIVITY-VES2_CREATE_ALL',
          'ACTIVITY-VES2_UPDATE_ALL',
          'ACTIVITY-VES-T_READ_ALL',
          'ACTIVITY-VES-T_CREATE_ALL',
          'ACTIVITY-VES-T_UPDATE_ALL',
          'ACTIVITY-VES-B_READ_ALL',
          'ACTIVITY-VES-B_CREATE_ALL',
          'ACTIVITY-VES-B_UPDATE_ALL',
          'ACTIVITY-CA_READ_ALL',
          'ACTIVITY-CA_CREATE_ALL',
          'ACTIVITY-CA_UPDATE_ALL',
          'ACTIVITY-FR_READ_ALL',
          'ACTIVITY-FR_CREATE_ALL',
          'ACTIVITY-FR_UPDATE_ALL',
          'ACTIVITY-NC-CC_READ_DEPARTMENT',
          'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
          'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
          'ACTIVITY-EMAIL_UPDATE_ALL',
          'ACTIVITY-EMAIL_CREATE_ALL',
        ],
        },
      ],
    },
    description: 'Retrieves the account\'s users',
    summary: 'Retrieves the activity\'s file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'filename',
      in: 'path',
      description: 'The document\'s filename',
      type: 'string',
      required: true,
    },
    ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The file\'s content',
        schema: {
          type: 'file',
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
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.post('/lsp/{lspId}/activity/{activityId}/document/{documentId}/filename/{filename}',
  controller.serveFile, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_CREATE_ALL',
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_CREATE_OWN',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_CREATE_ALL',
          'ACTIVITY-VES1_UPDATE_ALL',
          'ACTIVITY-VES2_CREATE_ALL',
          'ACTIVITY-VES2_UPDATE_ALL',
          'ACTIVITY-VES-T_CREATE_ALL',
          'ACTIVITY-VES-T_UPDATE_ALL',
          'ACTIVITY-VES-B_CREATE_ALL',
          'ACTIVITY-VES-B_UPDATE_ALL',
          'ACTIVITY-CA_CREATE_ALL',
          'ACTIVITY-CA_UPDATE_ALL',
          'ACTIVITY-FR_CREATE_ALL',
          'ACTIVITY-FR_UPDATE_ALL',
          'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
          'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
        ],
        },
      ],
    },
    description: 'Retrieves the activity\'s file',
    summary: 'Retrieves the activity\'s file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'filename',
      in: 'path',
      description: 'The document\'s filename',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The file\'s content',
        schema: {
          type: 'file',
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

route.get('/lsp/{lspId}/activity/{activityId}/documents/zip',
  controller.serveFilesZip, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_CREATE_ALL',
          'ACTIVITY-NC-CC_READ_ALL',
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_CREATE_OWN',
          'ACTIVITY-NC-CC_READ_OWN',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_READ_ALL',
          'ACTIVITY-VES1_CREATE_ALL',
          'ACTIVITY-VES1_UPDATE_ALL',
          'ACTIVITY-VES2_READ_ALL',
          'ACTIVITY-VES2_CREATE_ALL',
          'ACTIVITY-VES2_UPDATE_ALL',
          'ACTIVITY-VES-T_READ_ALL',
          'ACTIVITY-VES-T_CREATE_ALL',
          'ACTIVITY-VES-T_UPDATE_ALL',
          'ACTIVITY-VES-B_READ_ALL',
          'ACTIVITY-VES-B_CREATE_ALL',
          'ACTIVITY-VES-B_UPDATE_ALL',
          'ACTIVITY-CA_READ_ALL',
          'ACTIVITY-CA_CREATE_ALL',
          'ACTIVITY-CA_UPDATE_ALL',
          'ACTIVITY-FR_READ_ALL',
          'ACTIVITY-FR_CREATE_ALL',
          'ACTIVITY-FR_UPDATE_ALL',
          'ACTIVITY-NC-CC_READ_DEPARTMENT',
          'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
          'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
        ],
        },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the activity\'s documents as a zip file',
    summary: 'Serves all the activity\'s documents as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'activityId',
      in: 'path',
      description: 'The activity id',
      type: 'string',
      required: true,
    }, {
      name: 'ptsCookieValue',
      in: 'query',
      description: 'Will set a cookie named "pts-file-cookie" with this value',
      type: 'string',
    }, {
      name: 'documentIds',
      in: 'query',
      description: 'The document\'s ids to download',
      type: 'array',
      items: {
        type: 'string',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'The zip file containing all the activity\'s documents',
        schema: {
          type: 'file',
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
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/activity/{activityId}/send-invoice-email',
  controller.sendInvoiceEmail, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'ACTIVITY-EMAIL_UPDATE_ALL',
            'ACTIVITY-EMAIL_UPDATE_OWN',
          ],
        },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'activityId',
      in: 'path',
      description: 'The activity\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Send an email with notification',
    summary: 'Send an email with notification',
    responses: {
      200: {
        description: 'Notification has been sent sucessfully',
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

route.definition('activity-list', customizableList({
  $ref: '#/definitions/activity',
}));

route.definition('activity-response', defineResponse({
  activity: {
    $ref: '#/definitions/activity',
  },
}));

route.definition('activity', {
  properties: {
    _id: {
      type: 'string',
    },
    requestId: {
      type: 'string',
    },
    dateSent: {
      type: 'string',
      format: 'date-time',
    },
    activityType: {
      type: 'string',
    },
    activityCreatedBy: {
      type: 'string',
    },
    body: {
      type: 'string',
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    deleted: {
      type: 'boolean',
    },
  },
});
