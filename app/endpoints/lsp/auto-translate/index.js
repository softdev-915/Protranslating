const Router = require('../../../components/application/route');
const controller = require('./auto-translate-controller');

const route = module.exports = Router.create();

route.post('/lsp/{lspId}/auto-translate-schedulers/{schedulerName}/runNow',
  controller.runScheduler, {
    tags: [
      'Translate',
    ],
    'x-swagger-security': {
      roles: [
        'SCHEDULER_CREATE_ALL',
        'SCHEDULER_UPDATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'schedulerName',
      in: 'path',
      description: 'Name of the scheduler to run',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Entity data to translate',
      required: true,
      schema: {
        $ref: '#/definitions/entity-translate-data',
      },
    }],
    description: 'Run a scheduler (recognise/translate/delete) on chosen request',
    summary: 'Run a scheduler (recognise/translate/delete) on chosen request',
    responses: {
      200: {
        description: 'Scheduler ran successfully',
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

route.definition('entity-translate-data', {
  properties: {
    entity: { type: 'string' },
    entityId: { type: 'string' },
  },
});
