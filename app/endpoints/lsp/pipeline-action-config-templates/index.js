const Router = require('../../../components/application/route');
const controller = require('./pipeline-action-config-templates-controller');
const { customizableList } = require('../../../components/application/definitions');

const router = module.exports = Router.create();

router.get('/lsp/{lspId}/company/{companyId}/pl-action-config-templates',
  controller.list,
  {
    tags: [
      'Company',
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'action',
      in: 'query',
      description: 'The action name to filter by',
      type: 'string',
    }, {
      name: 'term',
      in: 'query',
      description: 'The term for searching by template name',
      type: 'string',
    }],
    description: 'Retrieve list of pipeline action config templates',
    summary: 'Retrieve list of pipeline action config templates',
    responses: {
      200: {
        description: 'List of pipeline action config templates',
        schema: {
          $ref: '#/definitions/pl-action-config-template-list',
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

router.post('/lsp/{lspId}/company/{companyId}/pl-action-config-templates',
  controller.create,
  {
    tags: [
      'Company',
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_CREATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'JSON containing new template data',
      required: true,
      schema: {
        properties: {
          name: {
            type: 'string',
          },
          actionName: {
            type: 'string',
          },
          configYaml: {
            type: 'string',
          },
        },
        required: ['name', 'actionName', 'configYaml'],
      },
    }],
    description: 'Create new pipeline action config template',
    summary: 'Create new pipeline action config template',
    responses: {
      201: {
        description: 'New pipeline action config template',
        schema: {
          $ref: '#/definitions/pl-action-config-template',
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

router.get('/lsp/{lspId}/company/{companyId}/pl-action-config-templates/name/{name}',
  controller.getByName,
  {
    tags: [
      'Company',
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_READ_ALL'],
    },
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'companyId',
        in: 'path',
        description: 'The company\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'name',
        in: 'path',
        description: 'The name of the template',
        type: 'string',
        required: true,
      },
      {
        name: 'action',
        in: 'query',
        description: 'The action name to filter by',
        type: 'string',
        required: true,
      },
    ],
    description: 'Retrieve a pipeline action config by it\'s name',
    summary: 'Retrieve a pipeline action config by it\'s name',
    responses: {
      200: {
        description: 'An object of pipeline action config template',
        schema: {
          $ref: '#/definitions/pl-action-config-template',
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
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

router.put('/lsp/{lspId}/company/{companyId}/pl-action-config-templates/{templateId}',
  controller.update,
  {
    tags: [
      'Company',
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'templateId',
      in: 'path',
      description: 'The template\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'JSON containing new template data',
      required: true,
      schema: {
        properties: {
          configYaml: {
            type: 'string',
          },
        },
        required: ['configYaml'],
      },
    }],
    description: 'Update pipeline action config template',
    summary: 'Update pipeline action config template',
    responses: {
      200: {
        description: 'Updated pipeline action config template',
        schema: {
          $ref: '#/definitions/pl-action-config-template',
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
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

router.delete('/lsp/{lspId}/company/{companyId}/pl-action-config-templates',
  controller.deleteAll,
  {
    tags: [
      'Company',
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Delete all pipeline action config templates',
    summary: 'Delete all pipeline action config templates. This is available only in the test environment',
    responses: {
      204: {
        description: 'Deleted successfully',
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
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

router.delete('/lsp/{lspId}/company/{companyId}/pl-action-config-templates/{templateId}',
  controller.hide,
  {
    tags: [
      'Company',
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'templateId',
      in: 'path',
      description: 'The template\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Hide pipeline action config template',
    summary: 'Hide pipeline action config template',
    responses: {
      204: {
        description: 'Successful hiding',
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
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

router.definition('pl-action-config-template', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    configYaml: {
      type: 'string',
    },
    actionName: {
      type: 'string',
    },
    isHidden: {
      type: 'boolean',
    },
  },
  required: ['_id', 'name', 'configYaml', 'actionName'],
});

router.definition('pl-action-config-template-list', customizableList({
  $ref: '#/definitions/pl-action-config-template',
}));
