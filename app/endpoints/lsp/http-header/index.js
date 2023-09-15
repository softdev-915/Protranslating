const Router = require('../../../components/application/route');

const route = module.exports = Router.create();

const controller = require('./http-header-controller');

route.get('/lsp/{lspId}/http-header',
  controller.httpHeader, {
    tags: [
      'HttpHeader',
    ],
    'x-swagger-security': {
      roles: ['HTTP-HEADER_READ_ALL'],
    },
    description: 'Retrieves all request and response headers',
    summary: 'Retrieves all request and response headers',
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
        description: 'Returns all request and response headers',
        schema: {
          $ref: '#/definitions/http-header-object',
        },
      },
    },
  });

route.definition('http-header-object', {
  properties: {
  },
});
