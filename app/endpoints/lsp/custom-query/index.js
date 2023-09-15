const Router = require('../../../components/application/route');
const {
  customizableList,
  defineResponse,
  swaggerPaginationParams,
} = require('../../../components/application/definitions');
const controller = require('./custom-query-controller');
const {
  FIELD_FUNCTIONS,
  FILTER_GROUP_LOGICAL_OPERATORS,
  ORDER_BY_SORT_OPTIONS,
} = require('../../../utils/custom-query');

const route = Router.create();

route.get('/lsp/{lspId}/custom-query/export', controller.export, {
  tags: ['Custom Query'],
  'x-swagger-security': {
    roles: [{ oneOf: ['CUSTOM-QUERY_READ_ALL', 'CUSTOM-QUERY_READ_OWN'] }],
  },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }].concat(swaggerPaginationParams),
  description: 'Returns a dataset in a CSV file',
  summary: 'Returns a CSV file containing data from a custom query',
  produces: ['text/csv'],
  responses: {
    200: {
      description: 'The CSV file containing the data',
      schema: { type: 'file' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.get('/lsp/{lspId}/custom-query', controller.list, {
  tags: ['Custom Query'],
  'x-swagger-security': {
    roles: [
      { oneOf: ['CUSTOM-QUERY_READ_OWN', 'CUSTOM-QUERY_READ_ALL'] },
    ],
  },
  description: 'Retrieves the custom query list',
  summary: 'Retrieves the custom query list',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
  ].concat(swaggerPaginationParams),
  responses: {
    200: {
      description: 'The custom query list',
      schema: { $ref: '#/definitions/custom-query-list' },
    },
    400: {
      description: 'Invalid request',
      schema: { $ref: '#/definitions/error' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.get('/lsp/{lspId}/custom-query/{customQueryId}', controller.get, {
  tags: ['Custom Query'],
  'x-swagger-security': {
    roles: [
      { oneOf: ['CUSTOM-QUERY_READ_OWN', 'CUSTOM-QUERY_READ_ALL'] },
    ],
  },
  description: 'Retrieves an existing custom query',
  summary: 'Retrieves an existing custom query',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'customQueryId',
      in: 'path',
      description: 'The custom query id',
      type: 'string',
      required: true,
    },
  ].concat(swaggerPaginationParams),
  responses: {
    200: {
      description: 'The custom query list',
      schema: { $ref: '#/definitions/custom-query-list' },
    },
    400: {
      description: 'Invalid request',
      schema: { $ref: '#/definitions/error' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    404: {
      description: 'The custom query doesn\'t exist',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.post('/lsp/{lspId}/custom-query', controller.save, {
  tags: ['Custom Query'],
  'x-swagger-security': { roles: ['CUSTOM-QUERY_CREATE_OWN'] },
  description: 'Creates a new Custom Query',
  summary: 'Creates a new Custom Query',
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
    description: 'The new Custom Query',
    required: true,
    schema: { $ref: '#/definitions/custom-query' },
  }],
  responses: {
    200: {
      description: 'The new created Custom Query',
      schema: { $ref: '#/definitions/custom-query-response' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    404: {
      description: 'The custom query to update doesn\'t exist',
      schema: { $ref: '#/definitions/error' },
    },
    409: {
      description: 'The custom query already exist',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.put('/lsp/{lspId}/custom-query/{customQueryId}', controller.save, {
  tags: ['Custom Query'],
  'x-swagger-security': {
    roles: [{ oneOf: ['CUSTOM-QUERY_UPDATE_ALL', 'CUSTOM-QUERY_UPDATE_OWN'] }],
  },
  description: 'Updates a Custom Query',
  summary: 'Updates a Custom Query',
  consumes: ['application/json'],
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'customQueryId',
    in: 'path',
    description: 'The custom query id',
    type: 'string',
    required: true,
  }, {
    name: 'data',
    in: 'body',
    description: 'The custom query to update',
    required: true,
    schema: { $ref: '#/definitions/custom-query' },
  }],
  responses: {
    200: {
      description: 'The updated custom query',
      schema: { $ref: '#/definitions/custom-query-response' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    404: {
      description: 'The custom query doesn\'t exist',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.get(
  '/lsp/{lspId}/custom-query/{customQueryId}/mock-current-date-on-next-run/{currentDateOnNextRun}',
  controller.mock,
  {
    tags: ['Custom Query'],
    'x-swagger-security': {
      roles: [{ oneOf: ['CUSTOM-QUERY_UPDATE_ALL', 'CUSTOM-QUERY_UPDATE_OWN'] }],
    },
    description: 'Sets a mock data for custom query',
    summary: 'Sets a mock data for custom query',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'customQueryId',
      in: 'path',
      description: 'The custom query id',
      type: 'string',
      required: true,
    }, {
      name: 'currentDateOnNextRun',
      in: 'path',
      description: 'Mocked current datetime',
      required: true,
      type: 'integer',
    }],
    responses: {
      200: {
        description: 'The status of mock insertion',
        schema: { type: 'string', example: 'Success' },
      },
      400: {
        description: 'Invalid request',
        schema: { $ref: '#/definitions/error' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
      404: {
        description: 'The custom query doesn\'t exist',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/custom-query/{customQueryId}/last-result', controller.lastResult, {
  tags: ['Custom Query'],
  'x-swagger-security': {
    roles: [{ oneOf: ['CUSTOM-QUERY_READ_ALL', 'CUSTOM-QUERY_READ_OWN'] }],
  },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'customQueryId',
    in: 'path',
    description: 'The custom query id',
    type: 'string',
    required: true,
  }].concat(swaggerPaginationParams),
  description: 'Get the last result of custom query',
  summary: 'Get the last result of custom query',
  produces: ['text/csv'],
  responses: {
    200: {
      description: 'The CSV file containing the result',
      schema: { type: 'file' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.definition('custom-query-field-data', {
  properties: {
    refFrom: { type: 'string' },
    path: { type: 'string' },
  },
  required: ['path'],
});

route.definition('custom-query-field', {
  properties: {
    alias: { type: 'string' },
    field: { $ref: '#/definitions/custom-query-field-data' },
    function: { type: 'string', enum: FIELD_FUNCTIONS },
  },
  required: ['field'],
});

route.definition('custom-query', {
  properties: {
    _id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          refFrom: { type: 'string' },
        },
        required: ['name'],
      },
    },
    fields: {
      type: 'array',
      items: { $ref: '#/definitions/custom-query-field' },
    },
    filter: {
      properties: {
        type: { type: 'string' },
        query: {
          type: 'object',
          properties: {
            logicalOperator: { type: 'string', enum: FILTER_GROUP_LOGICAL_OPERATORS },
            children: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
      },
    },
    groupBy: {
      type: 'array',
      items: { $ref: '#/definitions/custom-query-field-data' },
    },
    orderBy: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fieldData: { $ref: '#/definitions/custom-query-field' },
          sort: { type: 'string', enum: ORDER_BY_SORT_OPTIONS },
        },
        required: ['fieldData', 'sort'],
      },
    },
  },
  required: ['name', 'entities', 'fields'],
});

route.definition('custom-query-list', customizableList({
  $ref: '#/definitions/custom-query',
  type: 'object',
  properties: {
    entitiesText: { type: 'string' },
    fieldsText: { type: 'string' },
    filterText: { type: 'string' },
    groupByText: { type: 'string' },
    orderByText: { type: 'string' },
  },
  required: ['entitiesText', 'fieldsText', 'filterText', 'groupByText', 'orderByText'],
}));

route.definition('custom-query-response', defineResponse({
  customQuery: { $ref: '#/definitions/custom-query' },
}));

module.exports = route;
