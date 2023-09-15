const Router = require('../../../components/application/route');
const controller = require('./provider-pooling-offer-controller');
const definitions = require('../../../components/application/definitions');
const generate = require('../../../utils/swagger');

const TAGS = [
  'Provider Pooling Offer',
  'Provider',
  'Request',
];
const ENTITY_NAME = 'provider pooling offer';
const READ_ROLES = ['OFFER_READ_ALL'];
const CREATE_ROLES = ['OFFER_CREATE_ALL'];
const UPDATE_ROLES = ['OFFER_UPDATE_ALL'];
const REFS = {
  LIST: '#/definitions/provider-pooling-offer-list',
  ENTITY: '#/definitions/provider-pooling-offer',
  ENTITY_INPUT: '#/definitions/provider-pooling-offer-input',
};
const { customizableList, swaggerPaginationParams } = definitions;
const route = Router.create();

route.get('/lsp/{lspId}/provider-pooling-offer/export', controller.export,
  generate.exportRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }] }));

route.get('/lsp/{lspId}/provider-pooling-offer', controller.list,
  generate.listRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS }));

route.post('/lsp/{lspId}/provider-pooling-offer', controller.create,
  generate.createRouteDescription({ TAGS, ENTITY_NAME, ROLES: CREATE_ROLES, REFS }));

route.post('/lsp/{lspId}/provider-pooling-offer/send', controller.sendOffer, {
  tags: TAGS,
  'x-swagger-security': { roles: UPDATE_ROLES },
  description: 'Send offer to selected providers',
  summary: 'Send offer to selected providers',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'Offer to send data (_id property is required)',
      required: true,
      schema: {
        $ref: '#/definitions/provider-pooling-offer',
      },
    },
  ],
  responses: {
    200: {
      description: 'Offer was sent',
      schema: {
        $ref: '#/definitions/provider-offers',
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
      description: 'Offer not found',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/lsp/{lspId}/provider-pooling-offer/provider-offers/{providerId}',
  controller.getProviderOffers, {
    tags: TAGS,
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'providerId',
      in: 'path',
      description: 'The Provider\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves active offers for the provider',
    summary: 'Retrieves active offers for the provider',
    responses: {
      200: {
        description: 'Offers for provider',
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

route.put('/lsp/{lspId}/provider-pooling-offer/accept', controller.acceptOffers, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: ['OFFER_UPDATE_ALL', 'OFFER_UPDATE_OWN'] }] },
  description: 'Accept offers for selected provider',
  summary: 'Accept offers for selected provider',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'Offer ids and provider id',
      required: true,
      schema: {
        $ref: '#/definitions/provider-pooling-offers-accept',
      },
    },
  ],
  responses: {
    200: {
      description: 'Offers are accepted',
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
      description: 'Offer not found',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.put('/lsp/{lspId}/provider-pooling-offer/decline', controller.declineOffers, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: ['OFFER_UPDATE_ALL', 'OFFER_UPDATE_OWN'] }] },
  description: 'Decline offers for selected provider',
  summary: 'Decline offers for selected provider',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'Offer ids and provider id',
      required: true,
      schema: {
        $ref: '#/definitions/provider-pooling-offers-decline',
      },
    },
  ],
  responses: {
    200: {
      description: 'Offer was declined',
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
      description: 'Offer not found',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.put('/lsp/{lspId}/provider-pooling-offer/undo-operation', controller.undoOffersOperation, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: ['OFFER_UPDATE_ALL', 'OFFER_UPDATE_OWN'] }] },
  description: 'Decline offers for selected provider',
  summary: 'Decline offers for selected provider',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'Offers and provider id',
      required: true,
      schema: {
        $ref: '#/definitions/provider-pooling-offers-undo-operation',
      },
    },
  ],
  responses: {
    200: {
      description: 'Offer decline was undone',
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
      description: 'Offer not found',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.post('/lsp/{lspId}/provider-pooling-offer/close', controller.closeOffer, {
  tags: TAGS,
  'x-swagger-security': { roles: UPDATE_ROLES },
  description: 'Closes the offer',
  summary: 'Closes the offer',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'Offer to close data (_id property is required)',
      required: true,
      schema: {
        $ref: '#/definitions/provider-pooling-offer',
      },
    },
  ],
  responses: {
    200: {
      description: 'Offer was closed',
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
      description: 'Offer not found',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/lsp/{lspId}/provider-pooling-offer/get-offer-task',
  controller.getOfferTask, {
    tags: [
      'Provider Pooling Offer',
      'Provider',
      'Request',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['OFFER_CREATE_ALL', 'OFFER_UPDATE_ALL'] }],
    },
    description: 'Retrieve the task data for provider pooling offer creation or update',
    summary: 'Retrieve the task data for provider pooling offer creation or update',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'requestId',
        in: 'query',
        description: 'The request\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'workflowId',
        in: 'query',
        description: 'The worflows\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'taskId',
        in: 'query',
        description: 'The tasks\'s id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Related workflow\'s task',
        schema: {
          $ref: '#/definitions/task',
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
      403: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      404: {
        description: 'Failed to aggregate new offer data due to the miss of some entities',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/provider-pooling-offer/get-new-offer-data',
  controller.getNewOfferData, {
    tags: [
      'Provider Pooling Offer',
      'Provider',
      'Request',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['OFFER_CREATE_ALL', 'OFFER_UPDATE_ALL'] }],
    },
    description: 'Retrieve request data for provider pooling offer creation',
    summary: 'Retrieve request data for provider pooling offer creation',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'requestId',
        in: 'query',
        description: 'The request\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'workflowId',
        in: 'query',
        description: 'The worflows\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'taskId',
        in: 'query',
        description: 'The tasks\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'providerTaskId',
        in: 'query',
        description: 'The provider task\'s id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
    // TODO: IMPLEMENT PROPER RESPONSE TYPES
      200: {
        description: 'List of available providers',
        schema: {
          $ref: '#/definitions/ppo-provider-list',
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
      403: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      404: {
        description: 'Failed to aggregate new offer data due to the miss of some entities',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/provider-pooling-offer/get-providers',
  controller.findProviders, {
    tags: [
      'Provider Pooling Offer',
      'Provider',
      'Request',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['OFFER_CREATE_ALL', 'OFFER_UPDATE_ALL'] }],
    },
    description: 'Retrieve provider list for offer creation',
    summary: 'Retrieve provider list for offer creation',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'requestId',
        in: 'query',
        description: 'The request\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'workflowId',
        in: 'query',
        description: 'The worflows\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'taskId',
        in: 'query',
        description: 'The tasks\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'translationUnitId',
        in: 'query',
        description: 'The offer\'s translation Unit id',
        type: 'string',
        required: true,
      },
      {
        name: 'breakdownId',
        in: 'query',
        description: 'The offer\'s breakdown id',
        type: 'string',
        required: false,
      },
      {
        name: 'offerId',
        in: 'query',
        description: 'The offer\'s id',
        type: 'string',
        required: false,
      },
      {
        name: 'maxRate',
        in: 'query',
        type: 'number',
        required: false,
      },
      {
        name: 'selectedProviders',
        in: 'query',
        type: 'array',
        items: { type: 'string' },
        required: false,
      },
      ...swaggerPaginationParams,
    ],
    responses: {
      200: {
        description: 'List of available providers',
        schema: {
          $ref: '#/definitions/ppo-provider-list',
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
      403: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/provider-pooling-offer/{id}', controller.details,
  generate.detailsRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS }));

route.put('/lsp/{lspId}/provider-pooling-offer/{id}', controller.update,
  generate.updateRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: UPDATE_ROLES }], REFS }));

route.definition('ppo-provider', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    address: {
      type: 'string',
    },
    rate: {
      type: 'string',
    },
    completedTasks: {
      type: 'string',
    },
    tasksInQueue: {
      type: 'string',
    },
  },
});

// TODO implement this after stabilization
route.definition('provider-pooling-offer-input', {
  properties: {

  },
});

route.definition('provider-pooling-offer', {
  properties: {

  },
});

route.definition('provider-offers', {
  properties: {

  },
});

route.definition('provider-pooling-offers-accept', {
  properties: {

  },
});

route.definition('decline-offers', {
  properties: {
    _id: {
      type: 'string',
    },
    updatedAt: {
      type: 'string',
    },
  },
});

route.definition('provider-pooling-offers-decline', {
  properties: {
    providerId: {
      type: 'string',
    },
    decliningReason: {
      type: 'string',
    },
    offers: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/decline-offers',
      },
    },
  },
});

route.definition('provider-pooling-offers-undo-operation', {
  properties: {
    providerId: {
      type: 'string',
    },
    offers: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/decline-offers',
      },
    },
    accepted: {
      type: 'boolean',
    },
  },
});

route.definition(
  'ppo-provider-list',
  customizableList({
    $ref: '#/definitions/ppo-provider',
  }),
);

route.definition(
  'provider-pooling-offer-list',
  customizableList({
    $ref: '#/definitions/provider-pooling-offer',
  }),
);

module.exports = route;
