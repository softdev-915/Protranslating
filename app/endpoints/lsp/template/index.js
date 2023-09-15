const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { defineResponse } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = Router.create();

const controller = require('./template-controller');

route.get(
  '/lsp/{lspId}/template/export',
  controller.export,

  {
    tags: [
      'Scheduler',
    ],
    'x-swagger-security': {
      roles: [
        'TEMPLATE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing data from a custom query',
    produces: ['text/csv'],
    responses: {
      200: {
        description: 'The CSV file containing the data',
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
  },
);

route.get(
  '/lsp/{lspId}/template/{templateId}',
  controller.retrieveById,

  {
    tags: [
      'Template',
    ],
    'x-swagger-security': {
      roles: [
        'TEMPLATE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'templateId',
      in: 'path',
      description: 'The Template id',
      type: 'string',
      required: true,
    }],
    description: 'Returns a template',
    summary: 'Returns a template',
    responses: {
      200: {
        description: 'Returns a template',
        schema: {
          $ref: '#/definitions/template-response',
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
  },
);

route.get(
  '/lsp/{lspId}/template/name/{templateName}',
  controller.retrieveByName,

  {
    tags: [
      'Template',
    ],
    'x-swagger-security': {
      roles: [
        'TEMPLATE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'templateName',
      in: 'path',
      description: 'The Template name',
      type: 'string',
      required: true,
    }],
    description: 'Returns a template',
    summary: 'Returns a template',
    responses: {
      200: {
        description: 'Returns a template',
        schema: {
          $ref: '#/definitions/template-response',
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
  },
);

route.get(
  '/lsp/{lspId}/template/{companyId}/{internalDepartmentId}',
  controller.retrieveByCompanyInternalDepartmentId,

  {
    tags: [
      'Template',
    ],
    'x-swagger-security': {
      roles: [
        'TEMPLATE_READ_ALL',
      ],
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
      description: 'The company id',
      type: 'string',
      required: true,
    }, {
      name: 'internalDepartmentId',
      in: 'path',
      description: 'The internal department id',
      type: 'string',
      required: true,
    }],
    description: 'Returns a template',
    summary: 'Returns a template',
    responses: {
      200: {
        description: 'Returns a template',
        schema: {
          $ref: '#/definitions/template-response',
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
  },
);

route.get(
  '/lsp/{lspId}/template',
  controller.list,

  {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'TEMPLATE_READ_ALL',
            'INVOICE_READ_OWN',
            'BILL_READ_OWN',
            'BILL_READ_ALL',
          ],
        }],
    },
    description: 'Retrieves all templates',
    summary: 'Retrieves all templates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'types',
      in: 'query',
      description: 'Template types',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The template',
        schema: {
          $ref: '#/definitions/template-response',
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
  },
);

route.post(
  '/lsp/{lspId}/template',
  controller.create,

  {
    tags: [
      'Template',
    ],
    'x-swagger-security': {
      roles: [
        'TEMPLATE_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new template',
      required: true,
      schema: {
        $ref: '#/definitions/template',
      },
    }],
    description: 'Creates a new template',
    summary: 'Creates a new template',
    responses: {
      200: {
        description: 'The newly created template',
        schema: {
          $ref: '#/definitions/template-response',
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
  },
);

route.put(
  '/lsp/{lspId}/template/{templateId}',
  controller.update,

  {
    tags: [
      'Schedule',
    ],
    'x-swagger-security': {
      roles: [
        'TEMPLATE_UPDATE_ALL',
      ],
    },
    description: 'Update a template',
    summary: 'Updates a template',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'templateId',
      in: 'path',
      description: 'Existing template id',
      required: true,
      type: 'string',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new template',
      required: true,
      schema: {
        $ref: '#/definitions/template',
      },
    }],
    responses: {
      200: {
        description: 'The updated template',
        schema: {
          $ref: '#/definitions/template-response',
        },
      },
      400: {
        description: 'Bad request',
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
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.definition('template', {
  properties: {
    name: {
      type: 'string',
    },
    type: {
      type: 'string',
      enum: ['Quote Email', 'Invoice Email', 'Quote', 'Invoice', 'Generic Email', 'Bill'],
    },
    template: {
      type: 'string',
    },
    variables: {
      type: 'object',
    },
  },
  required: ['template'],
});

route.definition('template-response', defineResponse({
  template: {
    $ref: '#/definitions/template',
  },
}));

route.definition('internal-department', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['_id', 'name'],
});

module.exports = route;
