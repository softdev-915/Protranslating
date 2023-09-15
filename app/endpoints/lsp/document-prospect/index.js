const definitions = require('../../../components/application/definitions');
const Router = require('../../../components/application/route');

const route = Router.create();
const { defineResponse } = definitions;

const controller = require('./document-prospect-controller');

// TODO: does contrller calls next and allow the upload,
// or upload get just in front of the controller
// https://github.com/apigee-127/swagger-tools/issues/287
route.post(
  '/lsp/{lspId}/company/{companyId}/document-prospect',
  controller.uploadCompanyDocument,
  {
    tags: ['Document'],
    'x-swagger-security': {
      roles: [
        // NOTE: editing roles here will take no effect, patch storage engine interceptor instead
        {
          oneOf: [
            'TASK-FINAL-FILE_UPDATE_OWN',
            'TASK_UPDATE_OWN',
            'REQUEST_CREATE_ALL',
            'REQUEST_UPDATE_ALL',
            'REQUEST_CREATE_COMPANY',
            'REQUEST_UPDATE_COMPANY',
            'REQUEST_CREATE_OWN',
            'REQUEST_UPDATE_OWN',
          ],
        },
      ],
    },
    description: "Uploads the document prospect's data",
    summary: "Uploads the document prospect's data",
    consumes: ['multipart/form-data'],
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: "The lsp's id",
        type: 'string',
        required: true,
      },
      {
        name: 'companyId',
        in: 'path',
        description: "The company's id",
        type: 'string',
        required: true,
      },
      {
        name: 'files',
        in: 'formData',
        description: 'The files to upload',
        type: 'file',
        required: true,
      },
    ],
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
  },
);

route.get(
  '/lsp/{lspId}/document-prospect/{documentId}/file',
  controller.serveFile,

  {
    tags: [
      'Document prospect',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'REQUEST_CREATE_OWN',
            'REQUEST_CREATE_COMPANY',
            'TASK-FINAL-FILE_UPDATE_OWN',
            'TASK_UPDATE_OWN',
            'ACTIVITY-EMAIL_CREATE_ALL',
            'ACTIVITY-EMAIL_CREATE_OWN',
          ],
        },
      ],
    },
    description: 'Retrieves a document prospect file',
    summary: 'Retrieves a document prospect file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
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
  },
);

route.post('/lsp/{lspId}/document-prospect', controller.uploadDocument, {
  tags: ['Document'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: [
          'REQUEST_CREATE_OWN',
          'REQUEST_CREATE_COMPANY',
          'TASK-FINAL-FILE_UPDATE_OWN',
          'TASK_UPDATE_OWN',
          'ACTIVITY-EMAIL_CREATE_ALL',
          'ACTIVITY-EMAIL_CREATE_OWN',
        ],
      },
    ],
  },
  description: "Uploads the document prospect's data",
  summary: "Uploads the document prospect's data",
  consumes: ['multipart/form-data'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'files',
      in: 'formData',
      description: 'The files to upload',
      type: 'file',
      required: true,
    },
  ],
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

// TODO: Frontend call is not working
route.delete(
  '/lsp/{lspId}/document-prospect/{documentProspectId}',
  controller.deleteProspectDocument,
  {
    tags: ['Document'],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'REQUEST_CREATE_OWN',
            'REQUEST_CREATE_COMPANY',
            'TRANSACTION_CREATE_ALL',
            'TRANSACTION_CREATE_OWN',
          ],
        },
      ],
    },
    description: 'Deletes a document prospect',
    summary: 'Deletes a document prospect',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: "The lsp's id",
        type: 'string',
        required: true,
      },
      {
        name: 'documentProspectId',
        in: 'path',
        description: "The documentProspectId's id",
        type: 'string',
        required: true,
      },
    ],
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

route.definition(
  'document-prospect-list',
  defineResponse({
    documents: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-document',
      },
    },
  }),
);

route.definition(
  'document-prospect',
  defineResponse({
    document: {
      $ref: '#/definitions/request-document',
    },
  }),
);

module.exports = route;
