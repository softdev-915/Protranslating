const Router = require('../../../../components/application/route');
const controller = require('./portalcat-config-controller');

const router = module.exports = Router.create();

router.put('/lsp/{lspId}/portalcat/config',
  controller.saveConfig,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing data for config identification',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-config-body',
      },
    }],
    description: 'Save PortalCAT task config',
    summary: 'Save PortalCAT task config',
    responses: {
      200: {
        description: 'Config was saved successfuly',
      },
    },
  });

router.put('/lsp/{lspId}/portalcat/config/default',
  controller.saveDefaultConfig,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing config to save as users default',
      required: true,
      schema: {
        properties: {
          config: {
            type: 'object',
          },
        },
        required: ['config'],
      },
    }],
    description: 'Save PortalCAT user default config',
    summary: 'Save PortalCAT user default config',
    responses: {
      200: {
        description: 'Config was saved successfuly',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/config',
  controller.getConfig,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'query',
      description: 'requestId to get a config for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'workflowId to get a config for',
      required: true,
      type: 'string',
    },
    {
      name: 'taskId',
      in: 'query',
      description: 'taskId to get a config for',
      required: true,
      type: 'string',
    }],
    description: 'Retrieve PortalCAT task config',
    summary: 'Retrieve PortalCAT task config',
    responses: {
      200: {
        description: 'PortalCAT task config',
      },
    },
  });

router.definition('portalcat-config-body', {
  properties: {
    requestId: {
      type: 'string',
    },
    workflowId: {
      type: 'string',
    },
    taskId: {
      type: 'string',
    },
    config: {
      type: 'object',
    },
  },
  required: ['requestId', 'workflowId', 'taskId', 'config'],
});
