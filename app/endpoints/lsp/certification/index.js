const Router = require('../../../components/application/route');
const {
  customizableList,
  swaggerPaginationParams,
  defineResponse,
} = require('../../../components/application/definitions');
const controller = require('./certification-controller');

const route = module.exports = Router.create();

route.get('/lsp/{lspId}/certification/export',
  controller.certificationExport, {
    tags: [
      'Certification',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...swaggerPaginationParams],
    description: 'Returns a dataset file containing data from a custom query',
    summary: 'Returns a dataset file containing data from a custom query',
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

route.get('/lsp/{lspId}/certification/',
  controller.certificationList, {
    tags: [
      'Certification',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...swaggerPaginationParams],
    description: 'Returns all certifications',
    summary: 'Returns all certifications',
    responses: {
      200: {
        description: 'The certification list',
        schema: {
          $ref: '#/definitions/certification-list',
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

route.get('/lsp/{lspId}/certification/{certificationId}',
  controller.certificationDetails, {
    tags: [
      'Certification',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'certificationId',
      in: 'path',
      description: 'Certification\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns a single certification',
    summary: 'Returns a single certification',
    responses: {
      200: {
        description: 'The certification',
        schema: {
          $ref: '#/definitions/certification-response',
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

route.post('/lsp/{lspId}/certification/',
  controller.certificationCreate, {
    tags: [
      'Certification',
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
      description: 'The new certification',
      required: true,
      schema: {
        $ref: '#/definitions/certification',
      },
    }],
    description: 'Creates a new certification',
    summary: 'Creates a new certification',
    responses: {
      200: {
        description: 'The newly created certification',
        schema: {
          $ref: '#/definitions/certification-response',
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

route.put('/lsp/{lspId}/certification/{certificationId}',
  controller.certificationUpdate, {
    tags: [
      'Certification',
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
      name: 'certificationId',
      in: 'path',
      description: 'The certification\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The certification to update',
      required: true,
      schema: {
        $ref: '#/definitions/certification',
      },
    }],
    description: 'Updates an existing certification',
    summary: 'Updates an existing certification',
    responses: {
      200: {
        description: 'The updated certification',
        schema: {
          $ref: '#/definitions/certification-response',
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

route.definition('certification-response', defineResponse({
  certification: {
    $ref: '#/definitions/certification',
  },
}));

route.definition('certification-list', customizableList({
  $ref: '#/definitions/certification',
}));

route.definition('certification', {
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
