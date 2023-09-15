const Router = require('../../components/application/route');
const controller = require('./log-controller');

const route = module.exports = Router.create();

route.post(
  '/log/create',
  controller.createLog,
  {
    description: 'Creates a new log message',
    summary: 'Creates a new log message',
    tags: ['Log'],
    parameters: [
      {
        name: 'data',
        in: 'body',
        required: true,
        schema: {
          $ref: '#/definitions/log-create-input',
        },
      },
    ],
    responses: {
      200: {
        description: 'Request to write a new log message was sent',
      },
    },
  },
);

route.definition('log-create-input', {
  properties: {
    message: {
      type: 'string',
    },
    logLevel: {
      type: 'string',
      enum: [
        'silly',
        'debug',
        'verbose',
        'info',
        'warn',
        'error',
      ],
    },
  },
  required: ['message'],
});
