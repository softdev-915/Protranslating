const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./assignment-status-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/assignment-status/export',
  controller.assignmentStatusExport, {
    tags: [
      'Assignment Status',
    ],
    'x-swagger-security': {
      roles: [
        'ASSIGNMENT-STATUS_READ_ALL',
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

route.get('/lsp/{lspId}/assignment-status/{assignmentStatusId}',
  controller.retrieveById, {
    tags: [
      'Assignment Status',
    ],
    'x-swagger-security': {
      roles: [
        'ASSIGNMENT-STATUS_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'assignmentStatusId',
      in: 'path',
      description: 'The Assignment Statu\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns a specific assignment status',
    summary: 'Returns a specific assignment status',
    responses: {
      200: {
        description: 'The assignment status',
        schema: {
          $ref: '#/definitions/assignment-status-response',
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

route.get('/lsp/{lspId}/assignment-status',
  controller.assignmentStatusList, {
    tags: [
      'Assignment Status',
    ],
    'x-swagger-security': {
      roles: [
        'ASSIGNMENT-STATUS_READ_ALL',
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
    description: 'Retrieves the Assignment Statuses',
    summary: 'Retrieves the Assignment Statuses',
    responses: {
      200: {
        description: 'The user Assignment Status',
        schema: {
          $ref: '#/definitions/assignment-status-list',
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

route.post('/lsp/{lspId}/assignment-status',
  controller.assignmentStatusCreate, {
    tags: [
      'Assignment Status',
    ],
    'x-swagger-security': {
      roles: [
        'ASSIGNMENT-STATUS_CREATE_ALL',
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
      description: 'The new Assignment Status',
      required: true,
      schema: {
        $ref: '#/definitions/assignment-status',
      },
    }],
    description: 'Creates a new Assignment Status',
    summary: 'Creates a new Assignment Status',
    responses: {
      200: {
        description: 'The newly created Assignment Status',
        schema: {
          $ref: '#/definitions/assignment-status-list',
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

route.put('/lsp/{lspId}/assignment-status/{assignmentStatusId}',
  controller.assignmentStatusUpdate, {
    tags: [
      'Assignment Status',
    ],
    'x-swagger-security': {
      roles: [
        'ASSIGNMENT-STATUS_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'assignmentStatusId',
      in: 'path',
      description: 'The Assignment Status id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The Assignment Status to upate',
      required: true,
      schema: {
        $ref: '#/definitions/assignment-status',
      },
    }],
    description: 'Updates an existing Assignment Status',
    summary: 'Updates an existing Assignment Status',
    responses: {
      200: {
        description: 'The updated Assignment Status',
        schema: {
          $ref: '#/definitions/assignment-status-list',
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

route.definition('assignment-status-list', customizableList({
  $ref: '#/definitions/assignment-status',
}));

route.definition('assignment-status-response', defineResponse({
  assignmentStatus: {
    $ref: '#/definitions/assignment-status',
  },
}));

route.definition('assignment-status', {
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
    extensions: {
      type: 'string',
    },
  },
  required: ['name'],
});
