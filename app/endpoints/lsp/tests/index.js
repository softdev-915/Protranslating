const Router = require('../../../components/application/route');
const controller = require('./tests-controller');

const route = Router.create();

route.get('/tests/ap-ar-test-requests', controller.createTestRequestsForApAr, {
  tags: ['Testing'],
  'x-swagger-security': true,
  parameters: [
    {
      name: 'quantity',
      in: 'query',
      description: 'The amount of requests to be created',
      type: 'number',
      required: true,
    },
    {
      name: 'mockBills',
      in: 'query',
      description: 'Sets the mocked property of the created bills',
      type: 'boolean',
    },
    {
      name: 'isE2e',
      in: 'query',
      description: 'If specified different entities will be created',
      type: 'boolean',
    },
    {
      name: 'paymentMethod',
      in: 'query',
      description: 'The index of the payment method that will be used for all vendors: "EFT", "Wire Transfer", "Veem"',
      enum: [0, 1, 2],
      type: 'number',
    },
  ],
  description: 'Creates the specified amount of requests',
  summary: 'Creates the specified amount of requests. On each call new companies and users will also be created',
  responses: {
    200: {
      description: 'HTML containing info about created entities',
    },
    401: {
      description: 'Not authenticated',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/tests/ap-ar-test-requests/delete', controller.purgeTestData, {
  tags: ['Testing'],
  'x-swagger-security': true,
  parameters: [
    {
      name: 'requestNumbers',
      in: 'query',
      description: 'The numbers of requests that should be purged',
      type: 'array',
      items: {
        type: 'string',
      },
      required: true,
    },
  ],
  description: 'Purges all the entities associated with specified requests',
  summary: 'Purges all the entities associated with specified requests',
  responses: {
    200: {
      description: 'Entities were purged successfully',
    },
    401: {
      description: 'Not authenticated',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

module.exports = route;
