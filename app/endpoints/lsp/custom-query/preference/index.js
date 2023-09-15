const Router = require('../../../../components/application/route');
const { swaggerPaginationParams, defineResponse } = require('../../../../components/application/definitions');
const controller = require('./custom-query-preference-controller');

const route = Router.create();

route.get('/lsp/{lspId}/custom-query/{customQueryId}/preference',
  controller.get, {
    tags: ['Custom Query Preference'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CUSTOM-QUERY_READ_OWN', 'CUSTOM-QUERY_READ_ALL'] },
      ],
    },
    description: 'Retrieves an existing custom query preference',
    summary: 'Retrieves an existing custom query preference',
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
        description: 'The custom query preferences for current user',
        schema: { $ref: '#/definitions/custom-query-preference' },
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

route.put('/lsp/{lspId}/custom-query/{customQueryId}/preference',
  controller.save, {
    tags: ['Custom Query Preference'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CUSTOM-QUERY_UPDATE_ALL', 'CUSTOM-QUERY_UPDATE_OWN'] },
      ],
    },
    description: 'Updates a custom query preferences',
    summary: 'Updates a custom query preferences',
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
      description: 'The custom query preferences to update',
      required: true,
      schema: { $ref: '#/definitions/custom-query-preference' },
    }],
    responses: {
      200: {
        description: 'The updated custom query preference',
        schema: { $ref: '#/definitions/custom-query-preference-response' },
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

route.definition('custom-query-preference', {
  properties: {
    customQueryId: { type: 'string', format: 'uuid' },
    scheduledAt: { type: 'string' },
    isRunForced: { type: 'boolean' },
  },
  required: ['customQueryId'],
});

route.definition('custom-query-preference-response', defineResponse({
  customQueryPreference: { $ref: '#/definitions/custom-query-preference' },
}));

module.exports = route;
