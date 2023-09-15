const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./document-type-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/document-type/export',
  controller.documentTypeExport, {
    tags: [
      'Document Type',
    ],
    'x-swagger-security': {
      roles: [
        'DOCUMENT-TYPE_READ_ALL',
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
  },
);

route.get('/lsp/{lspId}/document-type/{documentTypeId}',
  controller.retrieveById, {
    tags: [
      'Document Type',
    ],
    'x-swagger-security': {
      roles: [
        'DOCUMENT-TYPE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'documentTypeId',
      in: 'path',
      description: 'The Document Type\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns a specific document Type',
    summary: 'Returns a specific document Type',
    responses: {
      200: {
        description: 'The document Type',
        schema: {
          $ref: '#/definitions/document-type-response',
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

route.get('/lsp/{lspId}/document-type',
  controller.documentTypeList, {
    tags: [
      'Document Type',
    ],
    'x-swagger-security': {
      roles: [
        'DOCUMENT-TYPE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves the Document Types',
    summary: 'Retrieves the Document Types',
    responses: {
      200: {
        description: 'The user Document Type',
        schema: {
          $ref: '#/definitions/document-type-list',
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

route.post('/lsp/{lspId}/document-type',
  controller.documentTypeCreate, {
    tags: [
      'Document Type',
    ],
    'x-swagger-security': {
      roles: [
        'DOCUMENT-TYPE_CREATE_ALL',
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
      description: 'The new Document Type',
      required: true,
      schema: {
        $ref: '#/definitions/document-type',
      },
    }],
    description: 'Creates a new Document Type',
    summary: 'Creates a new Document Type',
    responses: {
      200: {
        description: 'The newly created Document Type',
        schema: {
          $ref: '#/definitions/document-type-list',
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

route.put('/lsp/{lspId}/document-type/{documentTypeId}',
  controller.documentTypeUpdate, {
    tags: [
      'Document Type',
    ],
    'x-swagger-security': {
      roles: [
        'DOCUMENT-TYPE_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'documentTypeId',
      in: 'path',
      description: 'The Document Type\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The Document Type to upate',
      required: true,
      schema: {
        $ref: '#/definitions/document-type',
      },
    }],
    description: 'Updates an existing Document Type',
    summary: 'Updates an existing Document Type',
    responses: {
      200: {
        description: 'The updated Document Type',
        schema: {
          $ref: '#/definitions/document-type-list',
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

route.definition('document-type-list', customizableList({
  $ref: '#/definitions/document-type',
}));

route.definition('document-type-response', defineResponse({
  documentType: {
    $ref: '#/definitions/document-type',
  },
}));

route.definition('document-type', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
    extensions: {
      type: 'string',
    },
  },
  required: ['name'],
});
