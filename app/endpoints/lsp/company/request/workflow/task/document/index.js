const Router = require('../../../../../../../components/application/route');

const route = module.exports = Router.create();

const controller = require('./request-workflow-task-document-controller');

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/task/{taskId}/document/{documentId}',
  controller.serveFile, {
    tags: [
      'Request',
      'Task',
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'WORKFLOW_READ_ALL',
            'TASK_UPDATE_OWN',
            'TASK-FINAL-FILE_UPDATE_OWN',
          ],
        },
      ],
    },
    description: 'Returns the file content',
    summary: 'Returns the file content',
    produces: ['application/octet-stream'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company id',
      type: 'string',
      required: true,
    },
    {
      name: 'taskId',
      in: 'path',
      description: 'The provider task\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    }],
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

route.delete('/lsp/{lspId}/request/{requestId}/task/{taskId}/providerTask/{providerTaskId}/document/{documentId}',
  controller.deleteDocument, {
    tags: ['Document'],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'REQUEST_UPDATE_COMPANY',
          'REQUEST_UPDATE_OWN',
          'TASK_UPDATE_OWN',
          'REQUEST_UPDATE_ALL',
          'TASK_UPDATE_OWN',
          'TASK-FINAL-FILE_UPDATE_OWN',
        ],
      }],
    },
    description: 'Deletes a document prospect',
    summary: 'Deletes a document prospect',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: "The request's id",
      type: 'string',
      required: true,
    },
    {
      name: 'taskId',
      in: 'path',
      description: 'The task\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'providerTaskId',
      in: 'path',
      description: 'The provider task\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: "The document's id",
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The uploaded document',
        schema: {
          $ref: '#/definitions/document-prospect',
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
  },
);
