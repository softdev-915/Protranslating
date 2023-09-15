const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./cc-payments-controller');
const generate = require('../../../utils/swagger');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = Router.create();
const BASE_URL = '/lsp/{lspId}/cc-payments';
const READ_ROLES = ['CC-PAYMENT_READ_ALL'];
const TAGS = ['Credit Card Payments'];
const ENTITY_NAME = 'credit card payments';

route.get(
  '/lsp/{lspId}/cc-payments/export',
  controller.export,
  generate.exportRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }] }),
);

route.get(BASE_URL, controller.list, {
  tags: ['Credit Card Payments'],
  'x-swagger-security': {
    roles: [{ oneOf: READ_ROLES }],
  },
  description: 'Retrieves adjustments',
  summary: 'List of the account\'s adjustments',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
  responses: {
    200: {
      description: 'The invoice\'s list',
      schema: {
        $ref: '#/definitions/ar-invoice-list',
      },
    },
  },
});

route.post(BASE_URL, controller.create, {
  tags: ['Credit Card Payments'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: ['CC-PAYMENT_READ_ALL', 'INVOICE_READ_OWN'],
      },
    ],
  },
  description: 'Creates new cc payment',
  summary: 'Creates new cc payment',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'New payment data',
      required: true,
      schema: {
        $ref: '#/definitions/cc-payment-data',
      },
    },
  ],
  responses: {
    200: {
      description: 'The invoice\'s list',
      schema: {
        type: 'object',
        properties: {
          transactionId: { type: 'string' },
        },
      },
    },
  },
});

route.get(`${BASE_URL}/transaction-search/{entityNo}`, controller.getPaymentStatus, {
  tags: ['Credit Card Payments'],
  'x-swagger-security': {
    roles: [{ oneOf: ['CC-PAYMENT_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'] }],
  },
  description: 'Retrieves adjustments',
  summary: 'List of the account\'s adjustments',
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'entityNo',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'mock',
      in: 'query',
      description: 'Flag to enable cybersource mock api client',
      type: 'boolean',
    },
    {
      name: 'mockTrSearchNoResponseFromCs',
      in: 'query',
      description: 'Flag to mock no response from Cybersource on transaction search',
      type: 'boolean',
    },
    {
      name: 'mockTrDetailsNoResponseFromCs',
      in: 'query',
      description: 'Flag to mock no response from Cybersource on transaction detail',
      type: 'boolean',
    },
    {
      name: 'mockTrStatus',
      in: 'query',
      description: 'Flag to mock transaction status',
      type: 'string',
      enum: ['CAPTURED', 'FAILED', 'TRANSMITTED'],
    },
    {
      name: 'mockTrSubmitTime',
      in: 'query',
      description: 'Flag to mock transaction submit time, makes no sense without mockTrStatus=TRANSMITTED',
      type: 'string',

    },
  ],
  responses: {
    200: {
      description: 'The invoice\'s list',
      schema: {
        $ref: '#/definitions/ar-invoice-list',
      },
    },
  },
});

route.definition('cc-payment-data', {
  properties: {
    _id: {
      type: 'string',
    },
  },
});

module.exports = route;
