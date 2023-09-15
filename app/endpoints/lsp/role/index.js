const Router = require('../../../components/application/route');
const defineResponse = require('../../../components/application/definitions').defineResponse;

const route = module.exports = Router.create();

const controller = require('./role-controller');

route.get('/lsp/{lspId}/role',
  controller.list, {
    tags: [
      'Role',
    ],
    'x-swagger-security': {
      roles: [
        'ROLE_READ_ALL',
      ],
    },
    description: 'Retrieves all authentication roles',
    summary: 'Retrieves all authentication roles',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The authentication roles',
        schema: {
          $ref: '#/definitions/role-list',
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

route.definition('role-list', defineResponse({
  groups: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}));
