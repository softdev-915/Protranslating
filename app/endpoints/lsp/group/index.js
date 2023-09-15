const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const defineResponse = definitions.defineResponse;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = module.exports = Router.create();

const controller = require('./group-controller');

route.get('/lsp/{lspId}/group/export',
  controller.groupExport, {
    tags: [
      'Group',
    ],
    'x-swagger-security': {
      roles: [
        'GROUP_READ_ALL',
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
  });

route.get('/lsp/{lspId}/group/{groupId}',
  controller.groupList, {
    tags: [
      'Group',
    ],
    'x-swagger-security': {
      roles: [
        'GROUP_READ_ALL',
      ],
    },
    description: 'Retrieves the authentications groups',
    summary: 'Retrieves the authentications groups',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'groupId',
        in: 'path',
        description: 'The group\'s id',
        type: 'string',
        required: true,
      }, ...PAGINATION_PARAMS,
    ],
    responses: {
      200: {
        description: 'The authentication groups list',
        schema: {
          $ref: '#/definitions/group-response',
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

route.get('/lsp/{lspId}/group',
  controller.groupList, {
    tags: [
      'Group',
    ],
    'x-swagger-security': {
      roles: [
        'GROUP_READ_ALL',
      ],
    },
    description: 'Retrieves the authentications groups',
    summary: 'Retrieves the authentications groups',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The authentication groups list',
        schema: {
          $ref: '#/definitions/group-list',
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

route.post('/lsp/{lspId}/group',
  controller.create, {
    tags: [
      'Group',
    ],
    'x-swagger-security': {
      roles: [
        'GROUP_CREATE_ALL',
      ],
    },
    description: 'Creates a new group',
    summary: 'Creates a new group',
    consumes: ['application/json'],
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
      description: 'The new group',
      schema: {
        $ref: '#/definitions/group',
      },
    }],
    responses: {
      200: {
        description: 'The new created group',
        schema: {
          $ref: '#/definitions/group-response',
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

route.put('/lsp/{lspId}/group/{groupId}',
  controller.update, {
    tags: [
      'Group',
    ],
    'x-swagger-security': {
      roles: [
        'GROUP_UPDATE_ALL',
      ],
    },
    description: 'Updates a an authentication group',
    summary: 'Updates a an authentication group',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'groupId',
      in: 'path',
      description: 'Existing group id',
      required: true,
      type: 'string',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new group',
      required: true,
      schema: {
        $ref: '#/definitions/group',
      },
    }],
    responses: {
      200: {
        description: 'The newly created group',
        schema: {
          $ref: '#/definitions/group-response',
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

route.definition('group', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    roles: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    deleted: {
      type: 'boolean',
    },
  },
  required: ['name', 'roles'],
});

route.definition('group-extended', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    roles: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    deleted: {
      type: 'boolean',
    },
    updatedBy: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
    deletedBy: {
      type: 'string',
    },
    restoredBy: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
      format: 'date',
    },
    updatedAt: {
      type: 'string',
      format: 'date',
    },
    deletedAt: {
      type: 'string',
      format: 'date',
    },
    restoredAt: {
      type: 'string',
      format: 'date',
    },
  },
});

route.definition('group-list', customizableList({
  type: 'array',
  items: {
    $ref: '#/definitions/group-extended',
  },
}));

route.definition('group-response', defineResponse({
  group: {
    $ref: '#/definitions/group',
  },
}));
