const Router = require('../../../components/application/route');
const { customizableList } = require('../../../components/application/definitions');
const controller = require('./schema-controller');

const route = Router.create();

route.get('/lsp/{lspId}/schema',
  controller.list, {
    tags: ['Schema'],
    description: 'Retrieves the list of schemas allowed to user',
    summary: 'Retrieves the list of schemas allowed to user',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The translation request list',
        schema: { $ref: '#/definitions/schema-list' },
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
    },
  });

route.get('/lsp/{lspId}/schema/field-values/{field}', controller.fieldValues, {
  tags: ['Schema'],
  description: 'Retrieves the value options for the passed schema field',
  summary: 'Retrieves the value options for the passed schema field',
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'field',
    in: 'path',
    description: 'schema field',
    type: 'string',
    required: true,
  }],
  responses: {
    200: {
      description: 'List of field values',
      schema: { $ref: '#/definitions/schema-field-values' },
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

route.definition('schema-entity', {
  properties: {
    name: { type: 'string' },
    fields: {
      type: 'array', items: { $ref: '#/definitions/schema-field' },
    },
    type: { type: 'string' },
    ref: { type: 'string' },
  },
  required: ['name', 'fields', 'type', 'ref'],
});

route.definition('schema-field', {
  properties: {
    name: { type: 'string' },
    type: { type: 'string' },
    ref: { type: 'string' },
  },
  required: ['name', 'type', 'ref'],
});

route.definition('schema-list', customizableList({ $ref: '#/definitions/schema-entity' }));
route.definition('schema-field-values', customizableList({ type: 'string' }));

module.exports = route;
