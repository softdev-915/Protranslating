const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { customizableList } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { defineResponse } = definitions;
const route = Router.create();
const controller = require('./opportunity-controller');

route.get(
  '/lsp/{lspId}/opportunity/export',
  controller.opportunityExport,

  {
    tags: [
      'Opportunity',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'],
      }],
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

route.get(
  '/lsp/{lspId}/opportunity',
  controller.list,

  {
    tags: [
      'Opportunity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the opportunity list',
    summary: 'Retrieves the opportunity list',
    responses: {
      200: {
        description: 'The opportunity list',
        schema: {
          $ref: '#/definitions/opportunity-list',
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

route.get(
  '/lsp/{lspId}/opportunity/{opportunityId}',
  controller.retrieveById,

  {
    tags: [
      'Opportunity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'opportunityId',
      in: 'path',
      description: 'The opportunity id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves an existing opportunity',
    summary: 'Retrieves an existing opportunity',
    responses: {
      200: {
        description: 'The opportunity',
        schema: {
          $ref: '#/definitions/opportunity-response',
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
        description: 'The opportunity doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.post(
  '/lsp/{lspId}/opportunity',
  controller.create,

  {
    tags: [
      'Opportunity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['OPPORTUNITY_CREATE_ALL', 'OPPORTUNITY_CREATE_OWN'] },
      ],
    },
    description: 'Creates a new Opportunity',
    summary: 'Creates a new Opportunity',
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
      description: 'The new Opportunity',
      required: true,
      schema: {
        $ref: '#/definitions/opportunity-input',
      },
    }],
    responses: {
      200: {
        description: 'The new created Opportunity',
        schema: {
          $ref: '#/definitions/opportunity',
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
        description: 'The opportunity already exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put(
  '/lsp/{lspId}/opportunity/{opportunityId}',
  controller.update,

  {
    tags: [
      'Opportunity',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['OPPORTUNITY_UPDATE_ALL', 'OPPORTUNITY_UPDATE_OWN'] },
      ],
    },
    description: 'Updates a Opportunity',
    summary: 'Updates a Opportunity',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'opportunityId',
      in: 'path',
      description: 'Existing opportunity id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The opportunity to update',
      required: true,
      schema: {
        $ref: '#/definitions/opportunity-input',
      },
    }],
    responses: {
      200: {
        description: 'The updated opportunity',
        schema: {
          $ref: '#/definitions/opportunity',
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
        description: 'The opportunity doesn\'t exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.definition('opportunity-list', customizableList({
  $ref: '#/definitions/opportunity',
}));

route.definition('opportunity-response', defineResponse({
  opportunity: {
    $ref: '#/definitions/opportunity',
  },
}));

route.definition('opportunity-contact', {
  properties: {
    _id: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
  },
  required: ['_id'],
});

route.definition('opportunity-document', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isReference: {
      type: 'boolean',
    },
  },
  required: ['_id'],
});

route.definition('opportunity-input', {
  properties: {
    title: {
      type: 'string',
    },
    srcLang: {
      type: 'object',
      $ref: '#/definitions/input-language',
    },
    tgtLangs: {
      type: 'array',
      items: {
        $ref: '#/definitions/input-language',
      },
    },
    expectedCloseDate: {
      type: 'string',
      format: 'date-time',
    },
    notes: {
      type: 'string',
    },
    secondaryContacts: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    documents: {
      type: 'array',
      items: {
        $ref: '#/definitions/opportunity-document',
      },
    },
    lostReason: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    probability: {
      type: 'number',
    },
    estimatedValue: {
      type: 'number',
    },
    company: {
      type: 'string',
    },
    contact: {
      type: 'string',
    },
  },
  required: [
    'title',
    'status',
    'expectedCloseDate',
    'probability',
    'contact',
    'company',
    'estimatedValue',
    'tgtLangs',
    'srcLang',
  ],
});

route.definition('opportunity', {
  properties: {
    title: {
      type: 'string',
    },
    srcLang: {
      type: 'object',
      $ref: '#/definitions/input-language',
    },
    tgtLangs: {
      type: 'array',
      items: {
        $ref: '#/definitions/input-language',
      },
    },
    expectedCloseDate: {
      type: 'string',
      format: 'date-time',
    },
    notes: {
      type: 'string',
    },
    secondaryContacts: {
      type: 'array',
      items: {
        $ref: '#/definitions/opportunity-contact',
      },
    },
    documents: {
      type: 'array',
      items: {
        $ref: '#/definitions/opportunity-document',
      },
    },
    lostReason: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    probability: {
      type: 'number',
    },
    estimatedValue: {
      type: 'number',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    contact: {
      type: 'object',
      $ref: '#/definitions/opportunity-contact',
    },
    salesRep: {
      type: 'string',
    },
  },
});

route.definition('opportunity-list', customizableList({
  $ref: '#/definitions/opportunity-response',
}));

route.definition('opportunity-response', defineResponse({
  opportunity: {
    $ref: '#/definitions/opportunity',
  },
}));

module.exports = route;
