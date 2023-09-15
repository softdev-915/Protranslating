const { swaggerPaginationParams: PAGINATION_PARAMS } = require('../../components/application/definitions');

const lspIdParam = {
  name: 'lspId',
  in: 'path',
  description: 'The lspId',
  type: 'string',
  required: true,
};

const fileStreamRouteDescription = ({ ENTITY_NAME, TAGS, ROLES }) => ({
  tags: TAGS,
  'x-swagger-security': {
    roles: ROLES,
  },
  description: `Generates ${ENTITY_NAME} attachment download link`,
  summary: `Generates ${ENTITY_NAME} attachment download link`,
  parameters: [
    lspIdParam,
    {
      name: 'entityId',
      in: 'path',
      description: `${ENTITY_NAME} entityId`,
      type: 'string',
      required: true,
    },
    {
      name: 'attachmentId',
      in: 'path',
      description: 'Attachments\'s id to download',
      type: 'string',
      required: true,
    },
  ],
  responses: {
    200: {
      description: 'Download link',
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

const exportRouteDescription = ({ ENTITY_NAME, TAGS, ROLES }) => ({
  tags: TAGS,
  'x-swagger-security': { roles: ROLES },
  description: `Exports ${ENTITY_NAME} list as CSV file`,
  summary: `Exports ${ENTITY_NAME} list as CSV file`,
  parameters: [lspIdParam, ...PAGINATION_PARAMS],
  responses: {
    200: {
      description: `CSV file containing ${ENTITY_NAME} list`,
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

const detachFileDescription = ({ ENTITY_NAME, TAGS, ROLES }) => ({
  tags: TAGS,
  'x-swagger-security': { roles: ROLES },
  description: `Deletes the ${ENTITY_NAME} attachment`,
  summary: `Deletes the ${ENTITY_NAME} attachment`,
  consumes: ['multipart/form-data'],
  parameters: [
    lspIdParam,
    {
      name: 'entityId',
      in: 'path',
      description: `${ENTITY_NAME} id`,
      type: 'string',
      required: true,
    }, {
      name: 'attachmentId',
      in: 'path',
      description: `${ENTITY_NAME} attachment id to delete`,
      type: 'string',
      required: true,
    },
  ],
  responses: {
    200: {
      description: 'Status code 200',
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

const listRouteDescription = ({ ENTITY_NAME, TAGS, ROLES, REFS }) => ({
  tags: TAGS,
  'x-swagger-security': { roles: ROLES },
  description: `Retrieves ${ENTITY_NAME} paginated list or a single payment if _id query param passed`,
  summary: `Retrieves ${ENTITY_NAME} paginated list or a single payment if _id query param passed`,
  parameters: [
    lspIdParam,
    {
      name: '_id',
      in: 'query',
      description: `Id of ${ENTITY_NAME}`,
      type: 'string',
    },
    ...PAGINATION_PARAMS,
  ],
  responses: {
    200: {
      description: `The ${ENTITY_NAME} list`,
      schema: {
        $ref: REFS.LIST,
      },
    },
    400: {
      description: 'Invalid request',
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
    500: {
      description: 'internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

const updateRouteDescription = ({ ENTITY_NAME, TAGS, ROLES, REFS }) => ({
  tags: TAGS,
  'x-swagger-security': { roles: ROLES },
  description: `Updates ${ENTITY_NAME}`,
  summary: `Updates ${ENTITY_NAME}`,
  consumes: ['application/json'],
  parameters: [
    lspIdParam,
    {
      name: 'id',
      in: 'path',
      description: `Existing ${ENTITY_NAME} id`,
      required: true,
      type: 'string',
      format: 'uuid',
    },
    {
      name: 'data',
      in: 'body',
      description: `The ${ENTITY_NAME} to update`,
      required: true,
      schema: {
        $ref: REFS.ENTITY_INPUT,
      },
    },
  ],
  responses: {
    200: {
      description: `The newly created ${ENTITY_NAME}`,
      schema: {
        $ref: REFS.ENTITY,
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

const detailsRouteDescription = ({ ENTITY_NAME, TAGS, ROLES, REFS }) => ({
  tags: TAGS,
  'x-swagger-security': { roles: ROLES },
  description: `Retrieves ${ENTITY_NAME} details`,
  summary: `Retrieves ${ENTITY_NAME} details`,
  parameters: [
    lspIdParam,
    {
      name: 'id',
      in: 'path',
      description: `The ${ENTITY_NAME} id`,
      type: 'string',
      required: true,
    },
  ],
  responses: {
    200: {
      description: `The ${ENTITY_NAME} details`,
      schema: {
        $ref: REFS.ENTITY,
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

const createRouteDescription = ({ ENTITY_NAME, TAGS, ROLES, REFS }) => ({
  tags: TAGS,
  'x-swagger-security': { roles: ROLES },
  description: 'Creates new advance',
  summary: 'Creates new advance',
  parameters: [
    lspIdParam,
    {
      name: 'data',
      in: 'body',
      description: `${ENTITY_NAME} data`,
      schema: { $ref: REFS.ENTITY_INPUT },
      required: true,
    },
  ],
  responses: {
    200: {
      description: `New ${ENTITY_NAME}`,
      schema: { $ref: REFS.ENTITY },
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
    500: {
      description: 'Internal server error',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});
module.exports = {
  exportRouteDescription,
  fileStreamRouteDescription,
  detachFileDescription,
  updateRouteDescription,
  listRouteDescription,
  detailsRouteDescription,
  createRouteDescription,
};
