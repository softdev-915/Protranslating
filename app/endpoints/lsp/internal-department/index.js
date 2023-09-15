const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./internal-department-controller');

route.get('/lsp/{lspId}/internal-department/export',
  controller.internalDepartmentExport, {
    tags: [
      'Internal Department',
    ],
    'x-swagger-security': {
      roles: [
        'INTERNAL-DEPARTMENT_READ_ALL',
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

route.get('/lsp/{lspId}/internal-department/{internalDepartmentId}',
  controller.list, {
    tags: [
      'Internal Department',
    ],
    'x-swagger-security': {
      roles: [
        'INTERNAL-DEPARTMENT_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'internalDepartmentId',
      in: 'path',
      description: 'The internal department\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing internal department',
    summary: 'Retrieves an existing internal department',
    responses: {
      200: {
        description: 'The internal department',
        schema: {
          $ref: '#/definitions/internal-department-response',
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

route.get('/lsp/{lspId}/internal-department',
  controller.list, {
    tags: [
      'Internal Department',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf:
          [
            'INTERNAL-DEPARTMENT_READ_ALL',
            'INTERNAL-DEPARTMENT_READ_OWN',
            'COMPANY-BILLING_READ_OWN',
          ],
        },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the internal departments list',
    summary: 'Retrieves the internal departments list',
    responses: {
      200: {
        description: 'The internal departments list',
        schema: {
          $ref: '#/definitions/internal-department-list',
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

route.post('/lsp/{lspId}/internal-department',
  controller.create, {
    tags: [
      'Internal Department',
    ],
    'x-swagger-security': {
      roles: [
        'INTERNAL-DEPARTMENT_CREATE_ALL',
      ],
    },
    description: 'Creates a new Internal Department',
    summary: 'Creates a new internal Department',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The new Payment',
      required: true,
      schema: {
        $ref: '#/definitions/internal-department',
      },
    }],
    responses: {
      200: {
        description: 'The new created Payment',
        schema: {
          $ref: '#/definitions/internal-department-response',
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

route.put('/lsp/{lspId}/internal-department/{internalDepartmentId}',
  controller.update, {
    tags: [
      'Internal Department',
    ],
    'x-swagger-security': {
      roles: [
        'INTERNAL-DEPARTMENT_UPDATE_ALL',
      ],
    },
    description: 'Updates an Internal department',
    summary: 'Updates an internal departments',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'internalDepartmentId',
      in: 'path',
      description: 'Existing Payment id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new Payment',
      required: true,
      schema: {
        $ref: '#/definitions/internal-department',
      },
    }],
    responses: {
      200: {
        description: 'The newly created Payment',
        schema: {
          $ref: '#/definitions/internal-department-response',
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
  });

route.definition('internal-department', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    accountingDepartmentId: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['name'],
});

route.definition('internal-department-list', customizableList({
  $ref: '#/definitions/internal-department',
}));

route.definition('internal-department-response', defineResponse({
  'internal-department': {
    $ref: '#/definitions/internal-department',
  },
}));
