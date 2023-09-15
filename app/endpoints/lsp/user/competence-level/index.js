const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./competence-level-controller');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList, defineResponse } = definitions;
const route = module.exports = Router.create();

route.get('/lsp/{lspId}/user/competence/export',
  controller.competenceLevelExport, {
    tags: [
      'Competence Level',
    ],
    'x-swagger-security': {
      roles: [
        'COMPETENCE-LEVEL_READ_ALL',
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

route.get('/lsp/{lspId}/user/competence/{competenceLevelId}',
  controller.competenceLevelList, {
    tags: [
      'Competence Level',
    ],
    'x-swagger-security': {
      roles: [
        'COMPETENCE-LEVEL_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'competenceLevelId',
      in: 'path',
      description: 'The Competence Level\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves the Competence Levels',
    summary: 'Retrieves the Competence Levels',
    responses: {
      200: {
        description: 'The user Competence Level',
        schema: {
          $ref: '#/definitions/competence-level-response',
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

route.get('/lsp/{lspId}/user/competence',
  controller.competenceLevelList, {
    tags: [
      'Competence Level',
    ],
    'x-swagger-security': {
      roles: [
        'COMPETENCE-LEVEL_READ_ALL',
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
    description: 'Retrieves the Competence Levels',
    summary: 'Retrieves the Competence Levels',
    responses: {
      200: {
        description: 'The user Competence Level',
        schema: {
          $ref: '#/definitions/competence-level-list',
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

route.post('/lsp/{lspId}/user/competence',
  controller.competenceLevelCreate, {
    tags: [
      'Competence Level',
    ],
    'x-swagger-security': {
      roles: [
        'USER_CREATE_ALL',
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
      description: 'The new Competence Level',
      required: true,
      schema: {
        $ref: '#/definitions/competence-level',
      },
    }],
    description: 'Creates a new Competence Level',
    summary: 'Creates a new Competence Level',
    responses: {
      200: {
        description: 'The newly created Competence Level',
        schema: {
          $ref: '#/definitions/competence-level-list',
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

route.put('/lsp/{lspId}/user/competence/{competenceLevelId}',
  controller.competenceLevelUpdate, {
    tags: [
      'Competence Level',
    ],
    'x-swagger-security': {
      roles: [
        'USER_CREATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'competenceLevelId',
      in: 'path',
      description: 'The Competence Level\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The Competence Level to upate',
      required: true,
      schema: {
        $ref: '#/definitions/competence-level',
      },
    }],
    description: 'Updates an existing Competence Level',
    summary: 'Updates an existing Competence Level',
    responses: {
      200: {
        description: 'The updated Competence Level',
        schema: {
          $ref: '#/definitions/competence-level-list',
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

route.definition('competence-level-list', customizableList({
  $ref: '#/definitions/competence-level',
}));

route.definition('competence-level-response', defineResponse({
  competenceLevel: {
    $ref: '#/definitions/competence-level',
  },
}));

route.definition('competence-level', {
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
