const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./country-controller');

const { customizableList } = definitions;
const route = Router.create();

route.get(
  '/country',
  controller.countryList,

  {
    tags: [
      'Country',
    ],
    'x-swagger-security': {
      roles: [],
    },
    parameters: [],
    description: 'Retrieves all the countries',
    summary: 'Retrieves all the countries',
    responses: {
      200: {
        description: 'The countries',
        schema: {
          $ref: '#/definitions/country-list',
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

route.definition('country-list', customizableList({
  $ref: '#/definitions/country',
}));

route.definition('country', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
});

module.exports = route;
