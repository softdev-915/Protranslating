const Router = require('../../../../components/application/route');
const { customizableList } = require('../../../../components/application/definitions');
const workFlowDefinitions = require('./workflow-definitions.js');
const controller = require('./workflow-controller');

const route = Router.create();
route.definitions(workFlowDefinitions);

const WORKFLOW_UPDATE_ROLES = [
  'REQUEST_UPDATE_OWN',
  'TASK_UPDATE_OWN',
  'REQUEST_UPDATE_ALL',
  'TASK_UPDATE_OWN',
  'TASK-FINAL-FILE_UPDATE_OWN',
];

const WORKFLOW_RESPONSE = {
  200: {
    description: 'The edited translation request',
    schema: {
      $ref: '#/definitions/request-response',
    },
  },
  400: {
    description: 'Invalid request',
    schema: {
      $ref: '#/definitions/error',
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
    description: 'Request does not exist',
    schema: {
      $ref: '#/definitions/error',
    },
  },
};

route.post('/lsp/{lspId}/request/{requestId}/workflow', controller.create, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: WORKFLOW_UPDATE_ROLES,
      },
    ],
  },
  description: 'Add new workflows to request',
  summary: 'Add new workflows to request',
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
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if workflows must be decorated with PortalCat info',
      type: 'boolean',
    },
    {
      name: 'data',
      in: 'body',
      description: "The workflow's details",
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
  responses: WORKFLOW_RESPONSE,
});

route.put('/lsp/{lspId}/request/{requestId}/workflow-paste', controller.paste, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: WORKFLOW_UPDATE_ROLES,
      },
    ],
  },
  description: 'Add new workflows to request',
  summary: 'Add new workflows to request',
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
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if workflows must be decorated with PortalCat info',
      type: 'boolean',
    },
    {
      name: 'data',
      in: 'body',
      description: "The workflows' details to be pasted",
      required: true,
      schema: {
        properties: {
          sourceRequestId: {
            type: 'string',
            format: 'uuid',
          },
          workflows: {
            type: 'array',
            items: {
              $ref: '#/definitions/workflow-with-read-date',
            },
          },
        },
      },
    },
  ],
  responses: WORKFLOW_RESPONSE,
});

route.put('/lsp/{lspId}/request/{requestId}/set-workflow-order', controller.setOrder, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: WORKFLOW_UPDATE_ROLES,
      },
    ],
  },
  description: 'Set the order of workflows',
  summary: 'Set the order of workflows',
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
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if workflows must be decorated with PortalCat info',
      type: 'boolean',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The workflow id List',
      required: true,
      schema: {
        properties: {
          workflowIds: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
      },
    },
  ],
  responses: WORKFLOW_RESPONSE,
});

route.put('/lsp/{lspId}/request/{requestId}/workflow/{workflowId}', controller.edit, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: WORKFLOW_UPDATE_ROLES,
      },
    ],
  },
  description: 'Update a workflow of a request',
  summary: 'Update a workflow of a request',
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
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow id',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if workflows must be decorated with PortalCat info',
      type: 'boolean',
    },
    {
      name: 'data',
      in: 'body',
      description: "The workflow's details",
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
  responses: WORKFLOW_RESPONSE,
});

route.delete('/lsp/{lspId}/request/{requestId}/workflow', controller.delete, {
  tags: ['Workflow'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: WORKFLOW_UPDATE_ROLES,
      },
    ],
  },
  description: 'Delete workflows of a request',
  summary: 'Delete workflows of a request',
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
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if workflows must be decorated with PortalCat info',
      type: 'boolean',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The workflow id List',
      required: true,
      schema: {
        properties: {
          workflows: {
            type: 'array',
            items: {
              $ref: '#/definitions/workflow-with-read-date',
            },
          },
        },
      },
    },
  ],
  responses: WORKFLOW_RESPONSE,
});

route.get('/lsp/{lspId}/request/{requestId}/workflow', controller.list, {
  tags: ['Workflow'],
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
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'workflowIds',
      in: 'query',
      description: 'The workflow ids for filtering',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if workflows must be decorated with PortalCat info',
      type: 'boolean',
    },
  ],
  responses: {
    ...WORKFLOW_RESPONSE,
    200: {
      description: 'The workflows list',
      schema: {
        $ref: '#/definitions/workflow-list',
      },
    },
  },
});

route.definition(
  'workflow-list',
  customizableList({
    $ref: '#/definitions/workflow',
  }),
);

route.definition(
  'workflow-with-read-date',
  {
    properties: {
      _id: {
        type: 'string',
        format: 'uuid',
      },
      readDate: {
        type: 'string',
        format: 'date-time',
      },
    },
    required: ['_id', 'readDate'],
  },
);

module.exports = route;
