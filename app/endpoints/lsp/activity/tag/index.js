const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./activity-tag-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/activity/tag/export',
  controller.activityTagExport, {
    tags: [
      'Activity Tag',
    ],
    'x-swagger-security': {
      roles: [
        'ACTIVITY-TAG_READ_ALL',
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

route.get('/lsp/{lspId}/activity/tag/{activityTagId}',
  controller.activityTagList, {
    tags: [
      'Activity Tag',
    ],
    'x-swagger-security': {
      roles: [
        'ACTIVITY-TAG_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'activityTagId',
      in: 'path',
      description: 'The Activity Tag\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves the Activity Tags',
    summary: 'Retrieves the Activity Tags',
    responses: {
      200: {
        description: 'The user Activity Tag',
        schema: {
          $ref: '#/definitions/activity-tag-response',
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

route.get('/lsp/{lspId}/activity/tag',
  controller.activityTagList, {
    tags: [
      'Activity Tag',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'ACTIVITY-TAG_READ_ALL',
        ] },
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
    description: 'Retrieves the Activity Tags',
    summary: 'Retrieves the Activity Tags',
    responses: {
      200: {
        description: 'The user Activity Tag',
        schema: {
          $ref: '#/definitions/activity-tag-list',
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

route.post('/lsp/{lspId}/activity/tag',
  controller.activityTagCreate, {
    tags: [
      'Activity Tag',
    ],
    'x-swagger-security': {
      roles: [
        'ACTIVITY-TAG_CREATE_ALL',
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
      description: 'The new Activity Tag',
      required: true,
      schema: {
        $ref: '#/definitions/activity-tag',
      },
    }],
    description: 'Creates a new Activity Tag',
    summary: 'Creates a new Activity Tag',
    responses: {
      200: {
        description: 'The newly created Activity Tag',
        schema: {
          $ref: '#/definitions/activity-tag-list',
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

route.put('/lsp/{lspId}/activity/tag/{activityTagId}',
  controller.activityTagUpdate, {
    tags: [
      'Activity Tag',
    ],
    'x-swagger-security': {
      roles: [
        'ACTIVITY-TAG_UPDATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'activityTagId',
      in: 'path',
      description: 'The Activity Tag\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The Activity Tag to upate',
      required: true,
      schema: {
        $ref: '#/definitions/activity-tag',
      },
    }],
    description: 'Updates an existing Activity Tag',
    summary: 'Updates an existing Activity Tag',
    responses: {
      200: {
        description: 'The updated Activity Tag',
        schema: {
          $ref: '#/definitions/activity-tag-list',
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

route.definition('activity-tag-list', customizableList({
  $ref: '#/definitions/activity-tag',
}));

route.definition('activity-tag-response', defineResponse({
  activityTag: {
    $ref: '#/definitions/activity-tag',
  },
}));

route.definition('activity-tag', {
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
});
