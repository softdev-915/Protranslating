const Router = require('../../../components/application/route');
const { customizableList } = require('../../../components/application/definitions');
const controller = require('./ar-payment-controller');
const generate = require('../../../utils/swagger');

const route = module.exports = Router.create();
const CREATE_ROLES = ['AR-PAYMENT_CREATE_ALL', 'AR-PAYMENT-ACCT_READ_ALL', 'INVOICE_READ_OWN'];
const READ_ROLES = ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_READ_OWN', 'AR-PAYMENT_READ_COMPANY'];
const UPDATE_ROLES = ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_UPDATE_OWN'];
const ENTITY_NAME = 'ar-payment';
const TAGS = ['Ar Payments'];
const REFS = {
  LIST: '#/definitions/ar-payment-list',
  ENTITY: '#/definitions/ar-payment',
  ENTITY_INPUT: '#/definitions/ar-payment-input',
};

route.get('/lsp/{lspId}/ar-payment/line-items', controller.retrieveLineItems, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: READ_ROLES }] },
  description: 'Retrieves available credit and debit memos for requested currency and company',
  summary: 'Retrieves available credit and debit memos for requested currency and company',
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
      type: 'string',
      description: 'ID of the company',
      required: true,
    },
    {
      name: 'currencyId',
      in: 'query',
      type: 'string',
      description: 'Id of the currency in which to retrieve memos',
      required: true,
    },
    {
      name: 'source',
      in: 'query',
      type: 'string',
      description: 'Source entity type',
    },
    {
      name: 'target',
      in: 'query',
      type: 'string',
      description: 'Target entity type',
    },
  ],
  responses: {
    200: {
      description: 'Object, containing two lists for credit and debit memos',
      schema: {
        $ref: '#/definitions/ar-payment-list',
      },
    },
  },
});

route.put('/lsp/{lspId}/ar-payment/{id}/void', controller.void, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: UPDATE_ROLES }] },
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'id',
      in: 'path',
      description: 'Existing ar payment id',
      required: true,
      type: 'string',
      format: 'uuid',
    },
    {
      name: 'data',
      in: 'body',
      description: 'Void details',
      required: true,
      schema: {
        $ref: '#/definitions/void-details',
      },
    },
  ],
  responses: {
    200: {
      description: 'Updated ar payment',
      schema: {
        $ref: '#/definitions/ar-payment',
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

route.get('/lsp/{lspId}/ar-payment/export', controller.export,
  generate.exportRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }] }));

route.get('/lsp/{lspId}/ar-payment', controller.list,
  generate.listRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS }));

route.get('/lsp/{lspId}/ar-payment/{id}', controller.details,
  generate.detailsRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS }));

route.delete('/lsp/{lspId}/ar-payment/{entityId}/attachments/{attachmentId}', controller.detachFile,
  generate.detachFileDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: UPDATE_ROLES }] }));

route.get('/lsp/{lspId}/ar-payment/{entityId}/attachments/{attachmentId}', controller.getFileStream,
  generate.fileStreamRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }] }));

route.post('/lsp/{lspId}/ar-payment', controller.create,
  generate.createRouteDescription({ TAGS, ENTITY_NAME, ROLES: CREATE_ROLES, REFS }));

route.put('/lsp/{lspId}/ar-payment/{id}', controller.update,
  generate.updateRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: UPDATE_ROLES }], REFS }));

route.definition('void-details', {
  properties: {
    date: { type: 'string' },
    memo: { type: 'string' },
  },
});

route.definition('ar-payment', {
  properties: {
    _id: {
      type: 'string',
    },
  },
});

route.definition('ar-payment-input', {
  properties: {
    bankAccount: {
      type: 'string',
    },
  },
});

route.definition('ar-payment-list', customizableList({ $ref: '#/definitions/ar-payment' }));
