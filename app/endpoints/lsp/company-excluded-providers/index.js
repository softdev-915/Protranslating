const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { customizableList } = definitions;
const { defineResponse } = definitions;
const route = Router.create();

const controller = require('./company-excluded-providers-controller');

route.get(
  '/lsp/{lspId}/company-excluded-providers/company/{companyId}',
  controller.list,

  {
    tags: [
      'Company excluded providers',
    ],
    'x-swagger-security': {
      roles: ['COMPANY_READ_ALL'],
    },
    description: 'Retrieves the list of users (providers/vendors) that have been excluded by the company',
    summary: 'Retrieves the list of users (providers/vendors) that have been excluded by the company',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'Company\'s id for getting excluded providers',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The company\'s excluded providers list',
        schema: {
          $ref: '#/definitions/excluded-providers-list',
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
  },
);
route.definition('excluded-providers-list', customizableList({
  $ref: '#/definitions/excluded-provider',
}));

route.definition('excluded-provider-response', defineResponse({
  ability: {
    $ref: '#/definitions/excluded-provider',
  },
}));

route.definition('excluded-provider', {
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
    notes: {
      type: 'string',
    },
  },
});

module.exports = route;
