const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./software-requirement-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/software-requirement/export',
  controller.softwareRequirementExport, {
    tags: [
      'Software Requirement',
    ],
    'x-swagger-security': {
      roles: [
        'SOFTWARE-REQUIREMENT_READ_ALL',
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

route.get('/lsp/{lspId}/software-requirement/{softwareRequirementId}',
  controller.retrieveById, {
    tags: [
      'Software Requirement',
    ],
    'x-swagger-security': {
      roles: [
        'SOFTWARE-REQUIREMENT_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'softwareRequirementId',
      in: 'path',
      description: 'The Software Requirement\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves an specific Software Requirement',
    summary: 'Retrieves an specific Software Requirement',
    responses: {
      200: {
        description: 'The Software Requirement',
        schema: {
          $ref: '#/definitions/software-requirement-response',
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

route.get('/lsp/{lspId}/software-requirement',
  controller.softwareRequirementList, {
    tags: [
      'Software Requirement',
    ],
    'x-swagger-security': {
      roles: [
        'SOFTWARE-REQUIREMENT_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves the Software Requirements',
    summary: 'Retrieves the Software Requirements',
    responses: {
      200: {
        description: 'The user Software Requirement',
        schema: {
          $ref: '#/definitions/software-requirement-list',
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

route.post('/lsp/{lspId}/software-requirement',
  controller.softwareRequirementCreate, {
    tags: [
      'Software Requirement',
    ],
    'x-swagger-security': {
      roles: [
        'SOFTWARE-REQUIREMENT_CREATE_ALL',
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
      description: 'The new Software Requirement',
      required: true,
      schema: {
        $ref: '#/definitions/software-requirement',
      },
    }],
    description: 'Creates a new Software Requirement',
    summary: 'Creates a new Software Requirement',
    responses: {
      200: {
        description: 'The newly created Software Requirement',
        schema: {
          $ref: '#/definitions/software-requirement-list',
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

route.put('/lsp/{lspId}/software-requirement/{softwareRequirementId}',
  controller.softwareRequirementUpdate, {
    tags: [
      'Software Requirement',
    ],
    'x-swagger-security': {
      roles: [
        'SOFTWARE-REQUIREMENT_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'softwareRequirementId',
      in: 'path',
      description: 'The Software Requirement\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The Software Requirement to upate',
      required: true,
      schema: {
        $ref: '#/definitions/software-requirement',
      },
    }],
    description: 'Updates an existing Software Requirement',
    summary: 'Updates an existing Software Requirement',
    responses: {
      200: {
        description: 'The updated Software Requirement',
        schema: {
          $ref: '#/definitions/software-requirement-list',
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

route.definition('software-requirement-list', customizableList({
  $ref: '#/definitions/software-requirement',
}));

route.definition('software-requirement-response', defineResponse({
  softwareRequirement: {
    $ref: '#/definitions/software-requirement',
  },
}));

route.definition('software-requirement', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['name'],
});
