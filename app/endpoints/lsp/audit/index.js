const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./audit-controller');

const { customizableList } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = Router.create();

route.get('/lsp/{lspId}/audit/export',
  controller.auditExport, {
    tags: [
      'Audit',
    ],
    'x-swagger-security': {
      roles: [
        'AUDIT_READ_ALL',
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
  });

route.get('/lsp/{lspId}/audit',
  controller.auditList, {
    tags: [
      'Audit',
    ],
    'x-swagger-security': {
      roles: [
        'AUDIT_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves all the audit trails',
    summary: 'Retrieves all the audit trails',
    responses: {
      200: {
        description: 'The audit trails',
        schema: {
          $ref: '#/definitions/audit-list',
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

route.definition('audit-list', customizableList({
  $ref: '#/definitions/audit',
}));

route.definition('audit', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    language: {
      type: 'number',
    },
    catTool: {
      type: 'number',
    },
    deleted: {
      type: 'boolean',
    },
  },
});

module.exports = route;
