
const definitions = require('../../../../components/application/definitions');
const Router = require('../../../../components/application/route');

const route = module.exports = Router.create();
const controller = require('./activity-document-controller');

const defineResponse = definitions.defineResponse;

route.post('/lsp/{lspId}/activity/{activityId}/document',
  controller.uploadDocument, {
    tags: [
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_CREATE_ALL',
          'ACTIVITY-NC-CC_CREATE_OWN',
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_CREATE_ALL',
          'ACTIVITY-VES1_UPDATE_ALL'],
        },
      ],
    },
    description: 'Uploads the document prospect\'s data',
    summary: 'Uploads the document prospect\'s data',
    consumes: ['multipart/form-data'],
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
      name: 'file',
      in: 'formData',
      description: 'The file to upload',
      type: 'file',
      required: true,
    }],
    responses: {
      200: {
        description: 'The uploaded document',
        schema: {
          $ref: '#/definitions/document-prospect-list',
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

route.delete('/lsp/{lspId}/activity/{activityId}/document/delete-selected',
  controller.deleteDocuments, {
    tags: [
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_UPDATE_ALL'],
        },
      ],
    },
    description: 'Deletes a document prospect',
    summary: 'Deletes a document prospects',
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
      name: 'documentIds',
      in: 'query',
      description: 'The document\'s ids to delete',
      type: 'array',
      items: {
        type: 'string',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'Deleted documents',
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
  });

route.delete('/lsp/{lspId}/activity/{activityId}/deleteDocument/{documentId}/filename/{filename}',
  controller.deleteDocuments, {
    tags: [
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-NC-CC_UPDATE_ALL',
          'ACTIVITY-NC-CC_UPDATE_OWN',
          'ACTIVITY-VES1_UPDATE_ALL'],
        },
      ],
    },
    description: 'Deletes a document prospect',
    summary: 'Deletes a document prospect',
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
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'filename',
      in: 'path',
      description: 'The document\'s name',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The deleted document',
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
  });

route.get('/lsp/{lspId}/activity/document/{attachmentId}/filename/{filename}',
  controller.getDocument, {
    description: 'Returns the email attachment',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'attachmentId',
        in: 'path',
        description: 'The attachment\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'filename',
        in: 'path',
        description: 'Name of the file',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Document\'s content',
        schema: {
          type: 'file',
        },
      },
      404: {
        description: 'File does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/activity/{activityId}/attachment/{attachmentId}/filename/{filename}',
  controller.getDocument, {
    description: 'Returns the email attachment',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'activityId',
        in: 'path',
        description: 'The activitiy\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'attachmentId',
        in: 'path',
        description: 'The attachment\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'filename',
        in: 'path',
        description: 'Name of the file',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Document\'s content',
        schema: {
          type: 'file',
        },
      },
      404: {
        description: 'File does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('activity-document', defineResponse({
  document: {
    $ref: '#/definitions/activity-document',
  },
}));
