const Router = require('../../../components/application/route');

const route = module.exports = Router.create();
const controller = require('./pii-controller');

route.get('/lsp/{lspId}/reveal-pii/{collection}/{entityId}',
  controller.retrieveValue, {
    tags: [
      'Personal Identifiable Information',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Retrieves a PII value from a document in a specified collection',
    summary: 'Retrieves a PII value from a document in a specified collection',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'entityId',
      in: 'path',
      description: 'The entity\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'path',
      in: 'query',
      description: 'The path to the pii field we\'re retrieving the value for',
      type: 'string',
      required: true,
    },
    {
      name: 'collection',
      in: 'path',
      description: 'The collection that contains the pii field',
      type: 'string',
      required: true,
    },
    ],
    responses: {
      200: {
        description: 'The PII value',
        schema: {
          $ref: '#/definitions/reveal-pii-response',
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

route.definition('reveal-pii-response', {
  properties: {
    value: {
      type: 'string',
    },
  },
});
