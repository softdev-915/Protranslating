const Router = require('../../../../components/application/route');

const route = module.exports = Router.create();

const controller = require('./document-translation-controller');

route.get('/lsp/{lspId}/request/{requestId}/document/{documentId}/translation/{language}',
  controller.detail, {
    tags: [
      'Request', 'Document', 'Translation',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['REQUEST-DOCUMENT_READ_OWN', 'REQUEST-DOCUMENT_READ_COMPANY'] },
      ],
    },
    description: 'Retrieves the request\'s document translation',
    summary: 'Retrieves the request\'s document translation',
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
      name: 'documentId',
      in: 'path',
      description: 'The document id',
      type: 'string',
      required: true,
    }, {
      name: 'language',
      in: 'path',
      description: 'The translation language',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The document translation',
        schema: {
          $ref: '#/definitions/request-translation',
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

route.put('/lsp/{lspId}/request/{requestId}/document/{documentId}/translation/{language}',
  controller.createOrEdit, {
    tags: [
      'Request', 'Document', 'Translation',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['REQUEST-DOCUMENT_READ_OWN', 'REQUEST-DOCUMENT_READ_COMPANY'] },
      ],
    },
    description: 'Retrieves the request\'s document translation',
    summary: 'Retrieves the request\'s document translation',
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
      name: 'documentId',
      in: 'path',
      description: 'The document id',
      type: 'string',
      required: true,
    }, {
      name: 'language',
      in: 'path',
      description: 'The translation language',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The translated document',
      required: true,
      schema: {
        $ref: '#/definitions/request-translation',
      },
    }],
    responses: {
      200: {
        description: 'The document translation',
        schema: {
          $ref: '#/definitions/request-translation',
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

route.definition('request-translation', {
  properties: {
    _id: {
      type: 'string',
    },
    request: {
      type: 'string',
    },
    document: {
      type: 'string',
    },
    readDate: {
      type: 'string',
      format: 'date-time',
    },
    language: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    translation: {
      type: 'string',
    },
  },
  required: ['language', 'translation'],
});
