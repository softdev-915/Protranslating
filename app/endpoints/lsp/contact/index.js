const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();

const controller = require('./contact-controller');

route.get('/lsp/{lspId}/contact',
  controller.contactList, {
    tags: [
      'Contact',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CONTACT_READ_COMPANY', 'CONTACT_READ_ALL', 'CONTACT_CC_READ_COMPANY'] },
      ],
    },
    description: 'Retrieves the contact list of users associated to the current user company\'s hierarchy',
    summary: 'Retrieves the contact list of users associated to the current user company\'s hierarchy',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'query',
      description: 'Companies id for the hierarchy filter',
      type: 'string',
      required: false,
    }],
    responses: {
      200: {
        description: 'The company contact\'s list',
        schema: {
          $ref: '#/definitions/contact-list',
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

route.get(
  '/lsp/{lspId}/contact/hierarchy',
  controller.contactHierarchyList,
  {
    tags: ['Contact'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CONTACT_READ_COMPANY', 'CONTACT_READ_ALL', 'CONTACT_CC_READ_COMPANY'] },
      ],
    },
    description: 'Retrieves the contact list of users associated to the current user company\'s reverted hierarchy',
    summary: 'Retrieves the contact list of users associated to the current user company\'s reverted hierarchy',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'companyId',
        in: 'query',
        description: 'Companies id for the reverted hierarchy filter',
        type: 'string',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The company contact\'s list',
        schema: {
          $ref: '#/definitions/contact-list',
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

route.get('/lsp/{lspId}/contact/{contactId}',
  controller.contactSalesRepDetails, {
    tags: [
      'Contact',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CONTACT_READ_ALL', 'REQUEST_READ_ALL', 'REQUEST_READ_COMPANY', 'REQUEST_READ_OWN'] },
      ],
    },
    description: 'Retrieves the contact sales rep',
    summary: 'Retrieves the contact sales rep',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'contactId',
      in: 'path',
      description: 'Contact id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Retrieves the contact sales rep',
        schema: {
          $ref: '#/definitions/contact-list',
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

route.definition('contact', {
  properties: {
    _id: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    middleName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
  },
});

route.definition('contact-list', customizableList({
  $ref: '#/definitions/contact',
}));

route.definition('contact-response', defineResponse({
  contact: {
    $ref: '#/definitions/contact',
  },
}));

