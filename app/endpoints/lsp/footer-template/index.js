const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./footer-template-controller');

route.get('/lsp/{lspId}/footer-template/{id}',
  controller.details, {
    tags: [
      'Footer Template',
    ],
    'x-swagger-security': {
      roles: [
        'FOOTER-TEMPLATE_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The footer template\'s match id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves an existing footer template',
    summary: 'Retrieves an existing footer template',
    responses: {
      200: {
        description: 'The footer template',
        schema: {
          $ref: '#/definitions/footer-template-response',
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
        description: 'The footer template doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/footer-template',
  controller.list, {
    tags: [
      'Footer Template',
    ],
    'x-swagger-security': {
      roles: ['FOOTER-TEMPLATE_READ_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the footer template list',
    summary: 'Retrieves the footer template list',
    responses: {
      200: {
        description: 'The footer template list',
        schema: {
          $ref: '#/definitions/footer-template-list',
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

route.get('/lsp/{lspId}/footer-template/nameList',
  controller.nameList, {
    tags: [
      'Footer template name list',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['FOOTER-TEMPLATE_READ_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'select',
      in: 'query',
      description: 'Filters results to specific fields',
      type: 'string',
    }, {
      name: 'query',
      in: 'query',
      description: 'Records condition',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the footer templates',
    summary: 'Retrieves the footer templates',
    responses: {
      200: {
        description: 'The footer templates list',
        schema: {
          $ref: '#/definitions/footer-template-list',
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

route.post('/lsp/{lspId}/footer-template',
  controller.create, {
    tags: [
      'Footer Template',
    ],
    'x-swagger-security': {
      roles: [
        'FOOTER-TEMPLATE_CREATE_ALL',
      ],
    },
    description: 'Creates a new footer template',
    summary: 'Creates a new footer template',
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
      description: 'The new footer template',
      required: true,
      schema: {
        $ref: '#/definitions/footer-template',
      },
    }],
    responses: {
      200: {
        description: 'The new created footer template',
        schema: {
          $ref: '#/definitions/footer-template-response',
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
        description: 'The footer template already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/footer-template/{id}',
  controller.update, {
    tags: [
      'Footer Template',
    ],
    'x-swagger-security': {
      roles: [
        'FOOTER-TEMPLATE_UPDATE_ALL',
      ],
    },
    description: 'Updates a footer template',
    summary: 'Updates a footer template',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing footer template id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The footer template to update',
      required: true,
      schema: {
        $ref: '#/definitions/footer-template',
      },
    }],
    responses: {
      200: {
        description: 'The updated footer template',
        schema: {
          $ref: '#/definitions/footer-template-response',
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
        description: 'The footer template doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('footer-template', {
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
    inactive: {
      type: 'boolean',
    },
  },
  required: ['name'],
});

route.definition('footer-template-list', customizableList({
  $ref: '#/definitions/footer-template',
}));

route.definition('footer-template-response', defineResponse({
  footerTemplate: {
    $ref: '#/definitions/footer-template',
  },
}));
