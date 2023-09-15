const Router = require('../../../../components/application/route');

const route = Router.create();

const controller = require('./opportunity-document-controller');

route.get(
  '/lsp/{lspId}/opportunity/{opportunityId}/file-removal-permission',
  controller.checkFileRemovalPermissions,

  {
    tags: [
      'Opportunity',
      'Document',
    ],
    description: 'Returns true if user can delete opportunity documents',
    summary: 'Returns true if user can delete opportunity documents',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'opportunityId',
      in: 'path',
      description: 'The opportunity\'s id',
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
  },
);

route.definition('permission-object', {
  properties: {
    hasPermission: {
      type: 'boolean',
    },
  },
  required: ['hasPermission'],
});

route.get(
  '/lsp/{lspId}/company/{companyId}/opportunity/{opportunityId}/document/{documentId}/filename/{filename}',
  controller.serveFile,

  {
    tags: [
      'Opportunity',
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
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'opportunityId',
      in: 'path',
      description: 'The opportunity\'s id',
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
      description: 'The document\'s filename',
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
        description: 'Invalid opportunity',
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

route.get(
  '/lsp/{lspId}/company/{companyId}/opportunity/{opportunityId}/documents/src/zip',
  controller.serveSourceFilesZip,

  {
    tags: [
      'Opportunity',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'OPPORTUNITY_READ_OWN',
            'OPPORTUNITY_READ_ALL',
          ],
        },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the opportunity\'s source files as a zip file',
    summary: 'Serves all the opportunity\'s source files as a zip file',
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
      name: 'opportunityId',
      in: 'path',
      description: 'The opportunity id',
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
        description: 'The zip file containing all the opportunity\'s source files',
        schema: {
          type: 'file',
        },
      },
      400: {
        description: 'Invalid opportunity',
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

module.exports = route;
