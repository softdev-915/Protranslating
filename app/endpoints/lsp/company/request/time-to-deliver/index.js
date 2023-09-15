const Router = require('../../../../../components/application/route');

const route = module.exports = Router.create();

const controller = require('./request-time-to-deliver-controller');

route.get('/lsp/{lspId}/company/{companyId}/request/time-to-deliver',
  controller.getRequestsByTimeToDeliver, {
    tags: ['Request', 'Company'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_COMPANY', 'COMPANY_READ_OWN'] },
      ],
    },
    description: 'Get requests by time to deliver',
    summary: 'Get requests by time to deliver',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: "The company's id",
      type: 'string',
      required: true,
    },
    {
      name: 'timeToDeliver',
      in: 'query',
      description: 'Deleted time to deliver',
      required: true,
      type: 'array',
      items: {
        type: 'string',
      },
    }],
    responses: {
      200: {
        description: 'Requests with deleted time to deliver',
        schema: {
          type: 'array',
          $ref: '#/definitions/requests-by-time-deliver',
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

route.definition('requests-by-time-deliver', {
  properties: {
    _id: {
      type: 'string',
    },
  },
});
