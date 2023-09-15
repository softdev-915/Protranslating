const Router = require('../../../components/application/route');
const {
  customizableList,
  swaggerPaginationParams,
  defineResponse,
} = require('../../../components/application/definitions');
const controller = require('./connector-controller');

const route = module.exports = Router.create();

route.get('/lsp/{lspId}/connector/export',
  controller.export, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_READ_ALL',
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

route.get('/lsp/{lspId}/connector/',
  controller.list, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...swaggerPaginationParams],
    description: 'Returns all connectors',
    summary: 'Returns all connectors',
    responses: {
      200: {
        description: 'The connector list',
        schema: {
          $ref: '#/definitions/connector-list',
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

route.get('/lsp/{lspId}/connector/{connectorId}/download/{payloadName}',
  controller.downloadPayload, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'connectorId',
      in: 'path',
      description: 'Connector\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'payloadName',
      in: 'path',
      description: 'Payload\'s name',
      type: 'string',
      required: true,
    }],
    description: 'Returns payload file',
    summary: 'Returns payload file',
    responses: {
      200: {
        description: 'Payload file',
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

route.get('/lsp/{lspId}/connector/test',
  controller.testConnectivity, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Test connector connecivity',
    summary: 'Test connector connecivity',
    responses: {
      200: {
        description: 'Connectivity test successfull',
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
      400: {
        description: 'Connectivity test fail',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/connector/payload',
  controller.getPayloadForEntity, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'entityId',
      in: 'query',
      description: 'Entity id for payload retrieval',
      type: 'string',
    }, {
      name: 'entityName',
      in: 'query',
      description: 'Entity name for payload retrieval',
      type: 'string',
    }],
    description: 'Returns a payload of single entity without sync',
    summary: 'Returns a payload of single entity without sync',
    responses: {
      200: {
        description: 'The payload of entity',
        schema: {
          $ref: '#/definitions/payload-response',
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

route.post('/lsp/{lspId}/connector/sync-entity',
  controller.syncEntity, {
    tags: [
      'Connector',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Entity data to sync',
      required: true,
      schema: {
        $ref: '#/definitions/entity-sync-data',
      },
    }],
    description: 'Sync entity via si-connector',
    summary: 'Sync entity via si-connector',
    responses: {
      200: {
        description: 'Entity successfully synced',
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

route.post('/lsp/{lspId}/connector/sync-all-entities',
  controller.syncAllRecordsFromEntity, {
    tags: [
      'Connector',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Entity data to sync',
      required: true,
      schema: {
        $ref: '#/definitions/entity-sync-data',
      },
    }],
    description: 'Sync entity via si-connector',
    summary: 'Sync entity via si-connector',
    responses: {
      200: {
        description: 'Entity successfully synced',
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

route.get('/lsp/{lspId}/connector/{connectorId}',
  controller.details, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_READ_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'connectorId',
      in: 'path',
      description: 'Connector\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'shouldMockSiAuthFail',
      in: 'query',
      description: 'Flag, representing when auth error should be mocked',
      type: 'boolean',
    }, {
      name: 'siMockSyncFrom',
      in: 'query',
      description: 'Flag, representing the mocked sync from date',
      type: 'string',
    }],
    description: 'Returns a single connector',
    summary: 'Returns a single connector',
    responses: {
      200: {
        description: 'The connector',
        schema: {
          $ref: '#/definitions/connector-response',
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

route.put('/lsp/{lspId}/connector/{connectorId}',
  controller.update, {
    tags: [
      'Connector',
    ],
    'x-swagger-security': {
      roles: [
        'CONNECTOR_UPDATE_ALL',
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'connectorId',
      in: 'path',
      description: 'The connector\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The connector to update',
      required: true,
      schema: {
        $ref: '#/definitions/connector',
      },
    }],
    description: 'Updates an existing connector',
    summary: 'Updates an existing connector',
    responses: {
      200: {
        description: 'The updated connector',
        schema: {
          $ref: '#/definitions/connector-response',
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

route.definition('connector-response', defineResponse({
  connector: {
    $ref: '#/definitions/connector',
  },
}));

route.definition('connector-list', customizableList({
  $ref: '#/definitions/connector',
}));

route.definition('entity-sync-data', {
  properties: {
    entity: { type: 'string' },
    entityId: { type: 'string' },
  },
});

route.definition('connector', {
  properties: {
    _id: { type: 'string' },
    connector: { type: 'string' },
    username: { type: 'string' },
    notes: { type: 'string' },
    remoteUrl: { type: 'string' },
    deleted: { type: 'boolean' },
  },
});

route.definition('payload-response', {
  properties: {
    payload: {
      type: 'string',
    },
  },
});
