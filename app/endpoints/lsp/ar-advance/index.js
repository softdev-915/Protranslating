const Router = require('../../../components/application/route');
const { customizableList } = require('../../../components/application/definitions');
const controller = require('./ar-advance-controller');
const generate = require('../../../utils/swagger');

const ENTITY_NAME = 'ar advance';
const TAGS = ['Ar Advances'];
const READ_ROLES = ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_READ_COMPANY', 'AR-PAYMENT_READ_OWN'];
const CREATE_ROLES = ['AR-PAYMENT_CREATE_ALL', 'AR-PAYMENT-ACCT_READ_ALL'];
const UPDATE_ROLES = ['AR-PAYMENT_UPDATE_ALL', 'AR-PAYMENT_UPDATE_OWN', 'AR-PAYMENT_UPDATE_OWN'];
const REFS = {
  LIST: '#/definitions/ar-advance-list',
  ENTITY: '#/definitions/ar-advance',
  ENTITY_INPUT: '#/definitions/ar-advance-input',
};
const route = module.exports = Router.create();

route.get(
  '/lsp/{lspId}/ar-advance/export',
  controller.export,
  generate.exportRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }] }),
);

route.put(
  '/lsp/{lspId}/ar-advance/{id}',
  controller.update,
  generate.updateRouteDescription({
    ENTITY_NAME, TAGS, ROLES: [{ oneOf: UPDATE_ROLES }], REFS,
  }),
);

route.get(
  '/lsp/{lspId}/ar-advance',
  controller.list,
  generate.listRouteDescription({
    TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }], REFS,
  }),
);

route.get(
  '/lsp/{lspId}/ar-advance/{id}',
  controller.details,
  generate.detailsRouteDescription({
    TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }], REFS,
  }),
);

route.post(
  '/lsp/{lspId}/ar-advance',
  controller.create,
  generate.createRouteDescription({
    TAGS, ENTITY_NAME, ROLES: CREATE_ROLES, REFS,
  }),
);

route.delete(
  '/lsp/{lspId}/ar-advance/{entityId}/attachments/{attachmentId}',
  controller.detachFile,
  generate.detachFileDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: UPDATE_ROLES }] }),
);

route.get(
  '/lsp/{lspId}/ar-advance/{entityId}/attachments/{attachmentId}',
  controller.getFileStream,
  generate.fileStreamRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }] }),
);

route.put('/lsp/{lspId}/ar-advance/{id}/void', controller.void, {
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
      description: 'Existing ar advance id',
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
      description: 'Updated ar advance',
      schema: {
        $ref: '#/definitions/ar-advance',
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

route.definition('void-details', {
  properties: {
    date: { type: 'string' },
    memo: { type: 'string' },
  },
});

route.definition('ar-advance', {
  // properties: {
  //   company: {
  //     type: 'string',
  //     format: 'uuid',
  //   },
  //   paymentMethod: {
  //     type: 'string',
  //     format: 'uuid',
  //   },
  //   bankAccount: {
  //     type: 'string',
  //     format: 'uuid',
  //   },
  //   paymentDate: {
  //     type: 'string',
  //   },
  //   receiptDate: {
  //     type: 'string',
  //   },
  //   docNo: {
  //     type: 'string',
  //   },
  //   description: {
  //     type: 'string',
  //   },
  //   accounting: {
  //     type: 'object',
  //     properties: {
  //       amount: {
  //         type: 'number',
  //       },
  //       currencyId: {
  //         type: 'string',
  //         format: 'uuid',
  //       },
  //     },
  //     // required: ['amount, currencyId'],
  //   },
  // },
  // required: ['company', 'paymentMethod', 'bankAccount', 'receiptDate'],
});

route.definition('ar-advance-input', {
  properties: {
    company: {
      type: 'string',
      format: 'uuid',
    },
    paymentMethod: {
      type: 'string',
      format: 'uuid',
    },
    bankAccount: {
      type: 'string',
      format: 'uuid',
    },
    date: {
      type: 'string',
    },
    receiptDate: {
      type: 'string',
    },
    docNo: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    accounting: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
        },
        currencyId: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
  },
});

route.definition('ar-advance-list', customizableList({ $ref: '#/definitions/ar-advance' }));
