const Router = require('../../../../../components/application/route');

const route = module.exports = Router.create();

const controller = require('./request-document-controller');

route.delete('/lsp/{lspId}/request/{requestId}/document/{documentId}',
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
      name: 'documentId',
      in: 'path',
      description: "The document's id",
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Updated request',
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

route.get('/lsp/{lspId}/request/{requestId}/file-removal-permission',
  controller.checkRemovalPermissions, {
    tags: [
      'Request',
      'Document',
    ],
    description: 'Returns cidr permissions related to file removal',
    summary: 'Returns cidr permissions related to file removal',
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
    }],
    responses: {
      200: {
        description: 'Permission object',
        schema: {
          $ref: '#/definitions/permission-object',
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

route.definition('permission-object', {
  properties: {
    hasPermission: {
      type: 'boolean',
    },
  },
  required: ['hasPermission'],
});

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/document/{documentId}',
  controller.serveFile, {
    tags: [
      'Request',
      'Document',
    ],
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
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The file download uri',
        schema: {
          type: 'string',
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

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/languageCombination/{languageCombinationId}/document/{documentId}/ocr_result',
  controller.serveOcrFilesZip, {
    tags: [
      'Request',
      'Document',
    ],
    description: 'Returns the OCR data for file if exists',
    summary: 'Returns the OCR data for file if exists',
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
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company id',
      type: 'string',
      required: true,
    },
    {
      name: 'languageCombinationId',
      in: 'path',
      description: 'The language combination\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The file download uri',
        schema: {
          type: 'string',
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

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/documents/final/zip',
  controller.serveFinalFilesZip, {
    tags: [
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['REQUEST_READ_OWN', 'REQUEST_READ_ALL', 'REQUEST_READ_COMPANY'] },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the request\'s final files as a zip file',
    summary: 'Serves all the request\'s final files as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request id',
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
        description: 'The zip file containing all the request\'s final files',
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

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/languageCombination/{languageCombinationId}/documents/src/zip',
  controller.serveSourceFilesZip, {
    tags: [
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'REQUEST_READ_OWN',
            'REQUEST_READ_ALL',
            'REQUEST_READ_COMPANY',
            'REQUEST_READ_ASSIGNED-TASK',
          ],
        },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the request\'s source files as a zip file',
    summary: 'Serves all the request\'s source files as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    }, {
      name: 'languageCombinationId',
      in: 'path',
      description: 'The language combination id',
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
        description: 'The zip file containing all the request\'s source files',
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

