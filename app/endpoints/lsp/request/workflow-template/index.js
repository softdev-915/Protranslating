const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./workflow-template-controller');

const route = Router.create();
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const WORKFLOW_TEMPLATE_READ_ROLE = 'WORKFLOW-TEMPLATE_READ_ALL';
const WORKFLOW_TEMPLATE_CREATE_ROLE = 'WORKFLOW-TEMPLATE_CREATE_ALL';
const WORKFLOW_TEMPLATE_UPDATE_ROLE = 'WORKFLOW-TEMPLATE_UPDATE_ALL';

route.post('/lsp/{lspId}/workflow-template', controller.createTemplate, {
  tags: ['Workflow Template'],
  'x-swagger-security': {
    roles: [WORKFLOW_TEMPLATE_CREATE_ROLE],
  },
  description: 'Create template from request workflows',
  summary: 'Create template from request workflows',
  consumes: ['application/json'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'overwrite',
      in: 'query',
      description: 'If true and there is existing template with the same name it will be overwritten',
      type: 'boolean',
      default: false,
    },
    {
      name: 'data',
      in: 'body',
      description: "The template's details",
      required: true,
      schema: {
        properties: {
          workflow: {
            $ref: '#/definitions/workflow',
          },
        },
      },
    },
  ],
  responses: {
    200: {
      description: 'Request data',
      schema: {
        $ref: '#/definitions/request-response',
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.post('/lsp/{lspId}/workflow-template/{templateId}/apply', controller.applyTemplate, {
  tags: ['Workflow Template'],
  'x-swagger-security': {
    roles: [WORKFLOW_TEMPLATE_READ_ROLE],
  },
  description: 'Apply template to a given request',
  summary: 'Apply template to a given request',
  consumes: ['application/json'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'templateId',
      in: 'path',
      description: 'The template\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: "The template's details",
      required: true,
      schema: {
        properties: {
          workflow: {
            $ref: '#/definitions/workflow',
          },
        },
      },
    },
  ],
  responses: {
    200: {
      description: 'Request data',
      schema: {
        $ref: '#/definitions/request-response',
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/lsp/{lspId}/workflow-template', controller.list, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [WORKFLOW_TEMPLATE_READ_ROLE],
  },
  description: 'Get the list of request workflows',
  summary: 'Get the list of request workflows',
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
      in: 'query',
      description: 'The request id',
      type: 'string',
      required: false,
    },
    {
      name: 'languageCombinations',
      in: 'query',
      description: 'Template\'s language combinations',
      type: 'array',
      items: { type: 'string' },
      required: false,
    },
    ...PAGINATION_PARAMS,
  ],
  responses: {
    200: {
      description: 'The workflow template list',
      schema: {
        $ref: '#/definitions/workflow-template-list',
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.delete('/lsp/{lspId}/workflow-template/{templateId}', controller.updateTemplateState, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [WORKFLOW_TEMPLATE_UPDATE_ROLE],
  },
  description: 'Delete or restore workflow template',
  summary: 'Delete or restore workflow template',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'templateId',
      in: 'path',
      description: 'The template\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'deleted',
      in: 'query',
      description: 'True to delete, false to restore',
      required: true,
      type: 'boolean',
    },

  ],
  responses: {
    200: {
      description: 'Template was successfully deleted/resored',
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.definition('workflow-template', {
  properties: {
    name: {
      type: 'string',
    },
    languageCombinations: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    company: {
      type: 'string',
      format: 'uuid',
    },
    workflows: {
      type: 'array',
      items: {
        $ref: '#/definitions/workflow',
      },
    },
  },
});

route.definition('workflow-template-list', definitions.customizableList({ $ref: '#/definitions/workflow-template' }));

module.exports = route;
