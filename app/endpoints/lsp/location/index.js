const controller = require('./location-controller');
const Router = require('../../../components/application/route');
const {
  defineResponse,
  customizableList,
  swaggerPaginationParams,
} = require('../../../components/application/definitions');

const route = Router.create();

route.get(
  '/lsp/{lspId}/location/export',
  controller.locationExport,

  {
    tags: [
      'Location',
    ],
    'x-swagger-security': {
      roles: ['LOCATION_READ_ALL'],
    },
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      }, ...swaggerPaginationParams],
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing data from a custom query',
    consumes: ['application/json'],
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
  '/lsp/{lspId}/location',
  controller.locationList,

  {
    tags: [
      'Location',
    ],
    'x-swagger-security': {
      roles: [
        'LOCATION_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...swaggerPaginationParams],
    description: 'Returns location list',
    summary: 'Returns location list',
    responses: {
      200: {
        description: 'The location list',
        schema: {
          $ref: '#/definitions/location-list',
        },
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      403: {
        description: '`Forbidden`',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get(
  '/lsp/{lspId}/location/{locationId}',
  controller.locationDetails,

  {
    tags: [
      'Location',
    ],
    'x-swagger-security': {
      roles: [
        'LOCATION_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'locationId',
      in: 'path',
      description: 'The location\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns an existing location',
    summary: 'Returns an existing location',
    responses: {
      200: {
        description: 'The location',
        schema: {
          $ref: '#/definitions/location-response',
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
        description: 'Not Found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.post(
  '/lsp/{lspId}/location',
  controller.locationCreate,

  {
    tags: [
      'Location',
    ],
    'x-swagger-security': {
      roles: ['LOCATION_CREATE_ALL'],
    },
    description: 'Creates a Location',
    summary: 'Creates a Location',
    consumes: ['application/json'],
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      }, {
        name: 'data',
        in: 'body',
        description: 'Location data',
        required: true,
        schema: {
          $ref: '#/definitions/location',
        },
      },
    ],
    responses: {
      200: {
        description: 'The updated location',
        schema: {
          $ref: '#/definitions/location',
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

route.put(
  '/lsp/{lspId}/location/{locationId}',
  controller.locationUpdate,

  {
    tags: [
      'Location',
    ],
    'x-swagger-security': {
      roles: ['LOCATION_UPDATE_ALL'],
    },
    description: 'Updates a Location',
    summary: 'Updates a Location',
    consumes: ['application/json'],
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      }, {
        name: 'locationId',
        in: 'path',
        description: 'Location id',
        required: true,
        type: 'string',
        format: 'uuid',
      }, {
        name: 'data',
        in: 'body',
        description: 'Location data',
        required: true,
        schema: {
          $ref: '#/definitions/location',
        },
      },
    ],
    responses: {
      200: {
        description: 'The updated location',
        schema: {
          $ref: '#/definitions/location',
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
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.definition('id-name-location', {
  properties: {
    _id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
  },
  required: ['_id'],
});

route.definition('location', {
  properties: {
    _id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    line1: { type: 'string' },
    line2: { type: 'string' },
    city: { type: 'string' },
    country: {
      type: 'object',
      properties: {
        _id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
      },
    },
    state: {
      type: 'object',
      properties: {
        _id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
      },
    },
    zip: { type: 'string' },
    phone: { type: 'string' },
    deleted: { type: 'boolean' },
  },
  required: ['name'],
});

route.definition('location-list', customizableList({
  $ref: '#/definitions/location',
}));

route.definition('location-response', defineResponse({
  location: {
    $ref: '#/definitions/location',
  },
}));

module.exports = route;
