const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./lead-source-controller');

route.get('/lsp/{lspId}/lead-source/export',
  controller.leadSourceExport, {
    tags: [
      'Lead source',
    ],
    'x-swagger-security': {
      roles: [
        'LEAD-SOURCE_READ_ALL',
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

route.get('/lsp/{lspId}/lead-source/{leadSourceId}',
  controller.leadSourceList, {
    tags: [
      'Lead source',
    ],
    'x-swagger-security': {
      roles: [
        'LEAD-SOURCE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'leadSourceId',
      in: 'path',
      description: 'The lead\'s source id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing lead source',
    summary: 'Retrieves an existing lead source',
    responses: {
      200: {
        description: 'The lead source',
        schema: {
          $ref: '#/definitions/lead-source-response',
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
        description: 'The lead source doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get('/lsp/{lspId}/lead-source',
  controller.leadSourceList, {
    tags: [
      'Lead source',
    ],
    'x-swagger-security': {
      roles: ['LEAD-SOURCE_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the lead sources list',
    summary: 'Retrieves the lead sources list',
    responses: {
      200: {
        description: 'The lead sources list',
        schema: {
          $ref: '#/definitions/lead-source-list',
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

route.post('/lsp/{lspId}/lead-source',
  controller.leadSourceCreate, {
    tags: [
      'Lead source',
    ],
    'x-swagger-security': {
      roles: [
        'LEAD-SOURCE_CREATE_ALL',
      ],
    },
    description: 'Creates a new Lead source',
    summary: 'Creates a new Lead source',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new Lead source',
      required: true,
      schema: {
        $ref: '#/definitions/lead-source',
      },
    }],
    responses: {
      200: {
        description: 'The new created Lead source',
        schema: {
          $ref: '#/definitions/lead-source-response',
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
      409: {
        description: 'The lead source already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put('/lsp/{lspId}/lead-source/{leadSourceId}',
  controller.leadSourceUpdate, {
    tags: [
      'Lead source',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['LEAD-SOURCE_UPDATE_ALL', 'LEAD-SOURCE_DELETE_ALL'] },
      ],
    },
    description: 'Updates a Lead source',
    summary: 'Updates a Lead source',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'leadSourceId',
      in: 'path',
      description: 'Existing Lead source id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The Lead Source to update',
      required: true,
      schema: {
        $ref: '#/definitions/lead-source',
      },
    }],
    responses: {
      200: {
        description: 'The updated lead source',
        schema: {
          $ref: '#/definitions/lead-source-response',
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
        description: 'The lead source doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('lead-source', {
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
  },
  required: ['name'],
},
);

route.definition('lead-source-list', customizableList({
  $ref: '#/definitions/lead-source',
}));

route.definition('lead-source-response', defineResponse({
  'lead-source': {
    $ref: '#/definitions/lead-source',
  },
}));
