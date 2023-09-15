const Router = require('../../../../components/application/route');

const route = module.exports = Router.create();

const controller = require('./request-task-controller');

route.get('/lsp/{lspId}/request/{requestId}/task/{taskId}/providerTask/{providerTaskId}/documents/zip',
  controller.serveTaskFilesZip, {
    tags: [
      'Provider Task files',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['TASK_READ_OWN', 'TASK_UPDATE_OWN', 'TASK_READ_ALL'] },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves provider\' task files as a zip file',
    summary: 'Serves provider\' task files as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    }, {
      name: 'taskId',
      in: 'path',
      description: 'The task id',
      type: 'string',
      required: true,
    }, {
      name: 'providerTaskId',
      in: 'path',
      description: 'The provider task id',
      type: 'string',
      required: true,
    }, {
      name: 'ptsCookieValue',
      in: 'query',
      description: 'Will set a cookie named "pts-file-cookie" with this value',
      type: 'string',
    }],
    responses: {
      200: {
        description: 'The zip file containing provider task\'s files',
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

route.put('/lsp/{lspId}/request/{requestId}/workflow/{workflowId}/task/{taskId}/providerTask/{providerTaskId}/tte',
  controller.updateProviderTaskTTE, {
    tags: [
      'Request',
      'Provider Task',
    ],
    description: 'Update provider task TTE (time-to-edit)',
    summary: 'Update provider task TTE (time-to-edit)',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    }, {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow id',
      type: 'string',
      required: true,
    }, {
      name: 'taskId',
      in: 'path',
      description: 'The task id',
      type: 'string',
      required: true,
    }, {
      name: 'providerTaskId',
      in: 'path',
      description: 'The provider task id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'TTE data',
      required: true,
      schema: {
        properties: {
          segmentEditTime: {
            type: 'number',
          },
          segmentWordsEdited: {
            type: 'number',
          },
          segmentTTE: {
            type: 'number',
          },
        },
        required: ['segmentEditTime', 'segmentWordsEdited', 'segmentTTE'],
      },
    }],
    responses: {
      200: {
        description: 'The updated provider task',
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
