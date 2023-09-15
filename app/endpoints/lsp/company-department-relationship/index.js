const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./company-department-relationship-controller');

route.get('/lsp/{lspId}/company-department-relationship/export',
  controller.companyDepartmentRelationshipExport, {
    tags: [
      'Company Department Relationship',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-DEPT-RELATIONSHIP_READ_ALL',
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

route.get('/lsp/{lspId}/company-department-relationship/{companyDepartmentRelationshipId}',
  controller.retrieveById, {
    tags: [
      'Company Department Relationship',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-DEPT-RELATIONSHIP_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyDepartmentRelationshipId',
      in: 'path',
      description: 'The companyDepartmentRelationship\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves an existing company department relationship',
    summary: 'Retrieves an existing company department relationship',
    responses: {
      200: {
        description: 'The company department relationship',
        schema: {
          $ref: '#/definitions/company-department-relationship-response',
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
        description: 'The company department relationship doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/company-department-relationship',
  controller.list, {
    tags: [
      'Company Department Relationship',
    ],
    'x-swagger-security': {
      roles: ['COMPANY-DEPT-RELATIONSHIP_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the company department relationship list',
    summary: 'Retrieves the company department relationship list',
    responses: {
      200: {
        description: 'The company department relationship list',
        schema: {
          $ref: '#/definitions/company-department-relationship-list',
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

route.post('/lsp/{lspId}/company-department-relationship',
  controller.create, {
    tags: [
      'Company Department Relationship',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-DEPT-RELATIONSHIP_CREATE_ALL',
      ],
    },
    description: 'Creates a new company department relationship',
    summary: 'Creates a new company department relationship',
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
      description: 'The new company department relationship',
      required: true,
      schema: {
        $ref: '#/definitions/company-department-relationship',
      },
    }],
    responses: {
      200: {
        description: 'The new created company department relationship',
        schema: {
          $ref: '#/definitions/company-department-relationship-response',
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
      409: {
        description: 'The company department relationship already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/company-department-relationship/{companyDepartmentRelationshipId}',
  controller.update, {
    tags: [
      'Company Department Relationship',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-DEPT-RELATIONSHIP_UPDATE_ALL',
      ],
    },
    description: 'Updates an company department relationship',
    summary: 'Updates an company department relationship',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyDepartmentRelationshipId',
      in: 'path',
      description: 'Existing company department relationship id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The company department relationship to update',
      required: true,
      schema: {
        $ref: '#/definitions/company-department-relationship',
      },
    }],
    responses: {
      200: {
        description: 'The updated company department relationship',
        schema: {
          $ref: '#/definitions/company-department-relationship-response',
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
        description: 'The company department relationship doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('company-department-relationship', {
  properties: {
    _id: {
      type: 'string',
    },
    company: {
      type: 'string',
    },
    internalDepartment: {
      type: 'string',
    },
    billCreationDay: {
      type: 'integer',
      minimum: 1,
      maximum: 28,
    },
    acceptInvoicePerPeriod: {
      type: 'boolean',
    },
  },
  required: ['company', 'internalDepartment'],
});

route.definition('company-department-relationship-list', customizableList({
  $ref: '#/definitions/company-department-relationship',
}));

route.definition('company-department-relationship-response', defineResponse({
  'company-department-relationship': {
    $ref: '#/definitions/company-department-relationship',
    properties: {
      company: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          _id: {
            type: 'string',
          },
        },
      },
      internalDepartment: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          _id: {
            type: 'string',
          },
        },
      },
    },
  },
}));
