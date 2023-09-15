const definitions = require('../../../../components/application/definitions');
const Router = require('../../../../components/application/route');

const route = module.exports = Router.create();
const defineResponse = definitions.defineResponse;

const controller = require('./user-document-controller');

route.post('/lsp/{lspId}/user/{userId}/document',
  controller.uploadDocument, {
    tags: [
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        'STAFF-FILE-MANAGEMENT_UPDATE_ALL',
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
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'file',
      in: 'formData',
      description: 'The file to upload',
      type: 'file',
      required: true,
    }, {
      name: 'fileType',
      in: 'query',
      description: 'The file type of the uploaded file',
      type: 'string',
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

route.delete('/lsp/{lspId}/user/{userId}/document/{documentId}',
  controller.deleteDocument, {
    tags: [
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        'USER_DELETE_ALL',
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
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
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
  });

route.definition('user-document', defineResponse({
  document: {
    $ref: '#/definitions/user-document',
  },
}));
