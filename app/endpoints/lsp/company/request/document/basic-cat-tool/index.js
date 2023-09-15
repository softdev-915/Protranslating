const Router = require('../../../../../../components/application/route');
const { defineResponse } = require('../../../../../../components/application/definitions');

const route = module.exports = Router.create();

const controller = require('./basic-cat-tool-document-controller');

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/document/{documentId}/info',
  controller.documentInfo, {
    tags: [
      'Request',
      'Document',
      'Basic CAT tool',
    ],
    description: 'Returns a basic cat tool compliant file',
    summary: 'Returns a basic cat tool compliant file',
    produces: ['application/octet-stream'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
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
    },
  });

route.get('/lsp/{lspId}/company/{companyId}/request/{requestId}/document/{documentId}/{page}',
  controller.serveFileImage, {
    tags: [
      'Request',
      'Document',
      'Basic CAT tool',
    ],
    description: 'Returns a basic cat tool compliant file',
    summary: 'Returns a basic cat tool compliant file',
    produces: ['application/octet-stream'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'page',
      in: 'path',
      description: 'The document\'s page',
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
    },
  });

route.definition('pdf-info', {
  properties: {
    encripted: {
      type: 'boolean',
    },
    size: {
      type: 'integer',
    },
    optimized: {
      type: 'boolean',
    },
    pdfVersion: {
      type: 'string',
    },
    pageRotation: {
      type: 'string',
    },
    pageSize: {
      type: 'string',
    },
    pageCount: {
      type: 'integer',
    },
    title: {
      type: 'string',
    },
  },
});

route.definition('company-response', defineResponse({
  info: {
    $ref: '#/definitions/pdf-info',
  },
}));

