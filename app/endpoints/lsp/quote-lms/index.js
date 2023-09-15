const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { customizableList } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { defineResponse } = definitions;
const route = Router.create();

const controller = require('./quote-lms-controller');

route.get(
  '/lsp/{lspId}/quote-lms/export',
  controller.quoteExport,

  {
    tags: [
      'Quote',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['QUOTE_READ_OWN', 'QUOTE_READ_ALL', 'QUOTE_READ_COMPANY'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'csvHeaders',
      in: 'query',
      description: 'Column filter',
      type: 'array',
      items: {
        type: 'string',
      },
      required: false,
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

route.get(
  '/lsp/{lspId}/quote-lms',
  controller.quoteList,

  {
    tags: [
      'Quote list',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'QUOTE_READ_OWN',
            'QUOTE_READ_ALL',
            'QUOTE_READ_COMPANY',
          ],
        },
      ],
    },
    description: 'Retrieves the quote list',
    summary: 'Retrieves the quote list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The quote list',
        schema: {
          $ref: '#/definitions/quote-list',
        },
      },
      400: {
        description: 'Invalid quote',
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
  '/lsp/{lspId}/quote-lms/{requestId}',
  controller.quoteDetail,

  {
    tags: [
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'QUOTE_READ_OWN',
            'QUOTE_READ_ALL',
            'QUOTE_READ_COMPANY',
          ],
        },
      ],
    },
    description: 'Retrieves the quote\'s detail',
    summary: 'Retrieves the quote\'s detail',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'requestId',
      in: 'path',
      description: 'The requestId id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The quote\'s detail',
        schema: {
          $ref: '#/definitions/quote-response',
        },
      },
      400: {
        description: 'Invalid quote',
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

route.definition('quote', {
  properties: {
    _id: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    no: {
      type: 'string',
    },
    contactName: {
      type: 'string',
    },
    receptionDate: {
      type: 'string',
      format: 'date-time',
    },
    deliveryDate: {
      type: 'string',
      format: 'date-time',
    },
    invoiceTotal: {
      type: 'number',
    },
    status: {
      type: 'string',
    },
  },
});

route.definition('quote-list', customizableList({
  $ref: '#/definitions/quote',
}));

route.definition('quote-response', defineResponse({
  quote: {
    $ref: '#/definitions/quote',
  },
}));

module.exports = route;
