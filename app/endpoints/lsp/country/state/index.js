const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');
const controller = require('./state-controller');

const { customizableList } = definitions;
const route = Router.create();

route.get(
  '/country/{countryId}/state',
  controller.stateList,

  {
    tags: [
      'State',
    ],
    'x-swagger-security': {
      roles: [],
    },
    parameters: [{
      name: 'countryId',
      in: 'path',
      description: 'The country to retrieve states from',
      type: 'string',
      required: true,
    }],
    description: 'Retrieves all the states belonging to a country',
    summary: 'Retrieves all the states belonging to a country',
    responses: {
      200: {
        description: 'The states belonging to a country',
        schema: {
          $ref: '#/definitions/state-list',
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

route.definition('state-list', customizableList({
  $ref: '#/definitions/state',
}));

route.definition('state', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
  },
});

module.exports = route;
