const _ = require('lodash');

const PAGINATION_PARAMS = [{
  name: 'q',
  in: 'query',
  description: 'String to filter',
  type: 'string',
  required: false,
}, {
  name: 'page',
  in: 'query',
  description: 'Page number',
  type: 'integer',
  required: false,
}, {
  name: 'filter',
  in: 'query',
  description: 'Column filter',
  type: 'string',
  required: false,
}, {
  name: 'limit',
  in: 'query',
  description: 'Amount of results to display per page',
  type: 'integer',
  required: false,
}, {
  name: 'sort',
  in: 'query',
  description: 'Sort list by a property',
  type: 'string',
  required: false,
}];

const STANDARD_ERROR_DICT = {
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
};

const apiResponse = {
  properties: {
    status: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
        code: {
          type: 'integer',
        },
        error: {
          type: 'boolean',
        },
        version: {
          type: 'string',
        },
        data: {
          type: 'object',
        },
      },
      required: ['message', 'code', 'error'],
    },
  },
  required: ['status'],
};

const error = {
  allOf: [{
    $ref: '#/definitions/apiResponse',
  }],
};

const defineResponse = (properties, required) => {
  const definition = {
    allOf: [{
      $ref: '#/definitions/apiResponse',
    }],
    properties: {
      data: {
        type: 'object',
        properties,
      },
    },
  };

  if (required) {
    definition.properties.data.required = required;
  }
  return definition;
};

const customizableList = (items, extraDataProps) => {
  const definition = {
    allOf: [{
      $ref: '#/definitions/apiResponse',
    }],
    properties: {
      data: {
        type: 'object',
        properties: {
          pages: {
            type: 'number',
          },
          total: {
            type: 'number',
          },
          list: {
            type: 'array',
            items,
          },
          isUserIpAllowed: {
            type: 'boolean',
          },
        },
        required: ['pages', 'total', 'list'],
      },
    },
  };
  if (!_.isEmpty(extraDataProps)) {
    extraDataProps.forEach((dataProp) => {
      definition.properties.data.properties[dataProp.propName] = dataProp.schema;
      if (dataProp.required) {
        definition.properties.data.required.push(dataProp.propName);
      }
    });
  }
  return definition;
};
const swaggerPaginationParams = PAGINATION_PARAMS;
const swaggerStandardErrorDictionary = STANDARD_ERROR_DICT;

module.exports = {
  apiResponse,
  error,
  defineResponse,
  customizableList,
  swaggerPaginationParams,
  swaggerStandardErrorDictionary,
};
