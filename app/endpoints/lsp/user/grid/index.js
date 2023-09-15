const Router = require('../../../../components/application/route');
const { defineResponse } = require('../../../../components/application/definitions');

const route = module.exports = Router.create();

const controller = require('./grid-controller');

route.put(
  '/lsp/{lspId}/user/grid/{name}',
  controller.updateGridConfig,

  {
    tags: [
      'Grid', 'User',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Update or create a grid config for a grid',
    summary: 'Update or create a grid config for a grid',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'name',
      in: 'path',
      description: 'The grid\'s name',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'The new grid\'s config',
      schema: {
        $ref: '#/definitions/grid-config-input',
      },
    }],
    responses: {
      200: {
        description: 'The new or updated grid\'s configuration',
        schema: {
          $ref: '#/definitions/grid-config-input',
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
    },
  },
);

route.get(
  '/lsp/{lspId}/user/grid',
  controller.gridConfigByUser,

  {
    tags: [
      'User', 'Grid',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Retrieves the users\'s grid configurations',
    summary: 'Retrieves the users\'s grid configurations',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The user\'s grid configurations list',
        schema: {
          $ref: '#/definitions/grid-config-list',
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
    },
  },
);

route.delete(
  '/lsp/{lspId}/user/grid/{name}',
  controller.deleteGridConfig,

  {
    tags: [
      'User', 'Grid',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Deletes a users\'s grid configuration',
    summary: 'Deletes a users\'s grid configuration',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'name',
      in: 'path',
      description: 'The grid\'s name',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The user\'s grid configurations list',
        schema: {
          $ref: '#/definitions/one-grid-config',
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
    },
  },
);

route.definition('grid-config-column', {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    prop: {
      type: 'string',
    },
    visible: {
      type: 'boolean',
    },
    width: {
      type: 'number',
    },
  },
});

route.definition('one-grid-config', {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    selected: {
      type: 'boolean',
    },
    columns: {
      type: 'array',
      items: {
        $ref: '#/definitions/grid-config-column',
      },
    },
  },
});

route.definition('grid-config-input', {
  type: 'array',
  items: {
    $ref: '#/definitions/one-grid-config',
  },
});

route.definition('grid-config', {
  type: 'object',
  properties: {
    grid: {
      type: 'string',
    },
    configs: {
      type: 'array',
      items: {
        $ref: '#/definitions/one-grid-config',
      },
    },
  },
});

route.definition('grid-config-list', defineResponse({
  userId: {
    type: 'string',
  },
  userEmail: {
    type: 'string',
  },
  updated: {
    type: 'string',
    format: 'date-time',
  },
  grids: {
    type: 'array',
    items: {
      $ref: '#/definitions/grid-config',
    },
  },
}));
