const Router = require('../../../components/application/route');
const controller = require('./payment-gateway-controller');

const route = Router.create();

route.get('/lsp/{lspId}/payment-gateway', controller.list, {
  tags: ['Payment Gateway'],
  'x-swagger-security': {
    roles: ['LSP-SETTINGS_READ_OWN'],
  },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }],
  description: 'Returns payment gateway options',
  summary: 'Returns payment gateway options',
  responses: {
    200: {
      description: 'Payment gateways list',
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

module.exports = route;
