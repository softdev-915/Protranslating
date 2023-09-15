const Router = require('../../../components/application/route');
const defineResponse = require('../../../components/application/definitions').defineResponse;

const route = module.exports = Router.create();

const controller = require('./heartbeat-controller');

route.post('/auth/heartbeat',
  controller.heartbeat, {
    tags: [
      'Auth',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Sends a heartbeat to the server with no info',
    summary: 'Sends a heartbeat to the server with no info',
    responses: {
      200: {
        description: 'Successful request.',
        schema: {
          $ref: '#/definitions/heartbeat-response',
        },
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('heartbeat-response', defineResponse({
  heartbeat: {
    type: 'object',
    properties: {
      expiry: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
}));
