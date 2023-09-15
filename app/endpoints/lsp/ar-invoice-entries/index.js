const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = module.exports = Router.create();

const controller = require('./ar-invoice-entry-controller');

route.get('/lsp/{lspId}/ar-invoice-entries/export',
  controller.invoiceEntriesExport, {
    tags: [
      'Activity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'INVOICE_READ_OWN',
          'INVOICE_READ_ALL',
        ] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'query',
      description: 'The invoice\'s id',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing data',
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

route.get('/lsp/{lspId}/ar-invoice-entries',
  controller.list, {
    tags: [
      'Ar invoice',
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'INVOICE_READ_OWN',
            'INVOICE_READ_ALL',
            'REQUEST_READ_OWN',
            'REQUEST_READ_COMPANY',
            'REQUEST_READ_ALL',
          ],
        },
      ],
    },
    description: 'Retrieves request invoices',
    summary: 'List of the account\'s request invoices',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The request invoice\'s list',
        schema: {
          $ref: '#/definitions/invoice-entries-list',
        },
      },
      400: {
        description: 'Invalid invoice',
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

route.definition('invoice-entries', {
  properties: {
    no: {
      type: 'string',
    },
    purchaseOrder: {
      type: 'string',
    },
    taskName: {
      type: 'string',
    },
    memo: {
      type: 'string',
    },
    breakdown: {
      type: 'string',
    },
    languageCombination: {
      type: 'string',
    },
    quantity: {
      type: 'string',
    },
    price: {
      type: 'string',
    },
    amount: {
      type: 'string',
    },
    internalDepartment: {
      type: 'string',
    },
    show: {
      type: 'boolean',
    },
  },
});

route.definition('invoice-entries-list', customizableList({
  $ref: '#/definitions/invoice-entries',
}));

