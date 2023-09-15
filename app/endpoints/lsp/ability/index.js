const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./ability-controller');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/ability/export',
  controller.abilityExport, {
    tags: [
      'Ability',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['USER_READ_ALL', 'ABILITY_READ_ALL'] },
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

route.get('/lsp/{lspId}/ability/{abilityId}',
  controller.abilityList, {
    tags: [
      'Ability',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['USER_READ_ALL', 'ABILITY_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'abilityId',
      in: 'path',
      description: 'The ability\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS,
    ],
    description: 'Retrieves all the user abilities',
    summary: 'Retrieves all the user abilities',
    responses: {
      200: {
        description: 'The user abilities',
        schema: {
          $ref: '#/definitions/ability-response',
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

route.get('/lsp/{lspId}/ability',
  controller.abilityList, {
    tags: [
      'Ability',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'USER_READ_ALL',
          'ABILITY_READ_ALL',
          'WORKFLOW_READ_OWN',
          'CONTACT-WORKFLOW_READ_OWN',
          'CONTACT-WORKFLOW_READ_COMPANY'],
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
    description: 'Retrieves all the user abilities',
    summary: 'Retrieves all the user abilities',
    responses: {
      200: {
        description: 'The user abilities',
        schema: {
          $ref: '#/definitions/ability-list',
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

route.post('/lsp/{lspId}/ability',
  controller.abilityCreate, {
    tags: [
      'Ability',
    ],
    'x-swagger-security': {
      roles: ['USER_CREATE_ALL'],
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
      description: 'The new ability',
      required: true,
      schema: {
        $ref: '#/definitions/ability',
      },
    }],
    description: 'Creates a new ability',
    summary: 'Creates a new abillity',
    responses: {
      200: {
        description: 'The newly created ability',
        schema: {
          $ref: '#/definitions/ability-list',
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

route.put('/lsp/{lspId}/ability/{abilityId}',
  controller.abilityUpdate, {
    tags: [
      'Ability',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['USER_UPDATE_ALL', 'ABILITY_UPDATE_ALL', 'ABILITY-ACCT_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'abilityId',
      in: 'path',
      description: 'The ability\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The ability to update',
      required: true,
      schema: {
        $ref: '#/definitions/ability',
      },
    }],
    description: 'Updates an existing abillity',
    summary: 'Updates an existing abillity',
    responses: {
      200: {
        description: 'The updated ability',
        schema: {
          $ref: '#/definitions/ability-list',
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

route.definition('ability-list', customizableList({
  $ref: '#/definitions/ability',
}));

route.definition('ability-response', defineResponse({
  ability: {
    $ref: '#/definitions/ability',
  },
}));

route.definition('ability', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    glAccountNo: {
      type: 'string',
    },
    language: {
      type: 'boolean',
    },
    catTool: {
      type: 'boolean',
    },
    deleted: {
      type: 'boolean',
    },
  },
});
