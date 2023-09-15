const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const generate = require('../../../utils/swagger');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const customizableList = definitions.customizableList;
const route = module.exports = Router.create();

const controller = require('./ap-payment-controller');

const TAGS = ['Ap Payment'];
const ENTITY_NAME = 'ap-payment';

route.get('/lsp/{lspId}/ap-payment/export',
  controller.export, {
    tags: [
      'Ap Payment',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
      }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing the ap payment list',
    produces: ['text/csv'],
    responses: {
      200: {
        description: 'The CSV file containing the data',
        schema: {
          type: 'file',
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
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get('/lsp/{lspId}/ap-payment',
  controller.list, {
    tags: [
      'Ap Payment',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN',
        ],
      }],
    },
    description: 'Retrieves the ap payment list ',
    summary: 'Retrieves the ap payment list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The ap payment list',
        schema: {
          $ref: '#/definitions/ap-payment-list',
        },
      },
      400: {
        description: 'Invalid ap payment',
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

route.get('/lsp/{lspId}/ap-payment/account-payable',
  controller.accountPayableList, {
    tags: ['Account Payable'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
      }],
    },
    description: 'Retrieves the account payable list ',
    summary: 'Retrieves the account payable list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The account payable list',
        schema: { $ref: '#/definitions/account-payable-list' },
      },
      400: {
        description: 'Invalid account payable',
        schema: { $ref: '#/definitions/error' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/ap-payment/account-payable/export',
  controller.accountPayableExport, {
    tags: ['Account Payable'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
      }],
    },
    description: 'Returns a dataset in a CSV file',
    summary: 'Returns a CSV file containing the account payable list for a particular payment',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The account payable list',
        schema: { $ref: '#/definitions/account-payable-list' },
      },
      500: {
        description: 'Internal error',
        schema: { $ref: '#/definitions/error' },
      },
      401: {
        description: 'Invalid credentials',
        schema: { $ref: '#/definitions/error' },
      },
      403: {
        description: 'Forbidden',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/ap-payment/{id}',
  controller.details, {
    tags: [
      'Ap Payment',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
        },
      ],
    },
    description: 'Retrieves the ap payment details',
    summary: 'Retrieves the ap payment details',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Ap payment id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: { description: 'Ap payment detail' },
      400: {
        description: 'Invalid ap payment Id',
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

route.post('/lsp/{lspId}/ap-payment',
  controller.create, {
    tags: [
      'Ap Payment creation',
    ],
    'x-swagger-security': {
      roles: ['AP-PAYMENT_CREATE_ALL'],
    },
    description: 'Creates a ap payment',
    summary: 'Crates a ap payment',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The ap payment details',
      required: true,
      schema: {
        $ref: '#/definitions/ap-payment-input',
      },
    }],
    responses: {
      200: {
        description: 'The edited ap payment',
        schema: {
          $ref: '#/definitions/ap-payment-detail',
        },
      },
      400: {
        description: 'Invalid ap payment',
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
      404: {
        description: 'Ap payment does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/ap-payment/{id}',
  controller.update, {
    tags: [
      'Ap Payment edition',
    ],
    'x-swagger-security': {
      roles: ['AP-PAYMENT_UPDATE_ALL'],
    },
    description: 'Updates an ap payment',
    summary: 'Updates am ap payment',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'id',
      in: 'path',
      description: 'Ap payment id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'The ap payment details',
      required: true,
      schema: {
        $ref: '#/definitions/ap-payment-edit-input',
      },
    }],
    responses: {
      200: {
        description: 'The edited ap payment',
        schema: {
          $ref: '#/definitions/ap-payment-detail',
        },
      },
      400: {
        description: 'Invalid ap payment',
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
      404: {
        description: 'Ap payment does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/ap-payment/{id}/void', controller.void, {
  tags: ['Ap Payment void'],
  'x-swagger-security': { roles: ['AP-PAYMENT_UPDATE_ALL'] },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'id',
    in: 'path',
    description: 'Existing ap payment id',
    required: true,
    type: 'string',
    format: 'uuid',
  }, {
    name: 'data',
    in: 'body',
    description: 'Void details',
    required: true,
    schema: { $ref: '#/definitions/void-details' },
  }],
  responses: {
    200: {
      description: 'Updated ap payment',
      schema: { $ref: '#/definitions/ap-payment-detail' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Internal server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.delete('/lsp/{lspId}/ap-payment/{entityId}/attachments/{attachmentId}', controller.detachFile,
  generate.detachFileDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: ['AP-PAYMENT_UPDATE_ALL', 'AP-PAYMENT-FILES_UPDATE_OWN'] }] }));

route.get('/lsp/{lspId}/ap-payment/{entityId}/attachments/{attachmentId}', controller.getFileStream,
  generate.fileStreamRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: ['AP-PAYMENT_UPDATE_ALL', 'AP-PAYMENT-FILES_UPDATE_OWN'] }] }));

route.definition('void-details', {
  properties: {
    date: { type: 'string' },
    memo: { type: 'string' },
  },
  required: ['date', 'memo'],
});

route.definition('ap-payment-input', {
  properties: {
    apPayment: {
      type: 'object',
      properties: {
        bankAccount: {
          type: 'string',
        },
        paymentDate: {
          type: 'string',
          format: 'date-time',
        },
        paymentMethod: {
          type: 'string',
        },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountPayableId: { type: 'string' },
              creditsToApply: { type: 'number' },
              paymentAmount: { type: 'number' },
            },
            required: ['accountPayableId', 'creditsToApply', 'paymentAmount'],
          },
        },
      },
      required: ['paymentDate', 'details'],
    },
  },
});

route.definition('ap-payment-edit-input', {
  properties: {
    apPayment: {
      type: 'object',
      properties: {
        bankAccount: {
          type: 'string',
        },
        paymentDate: {
          type: 'string',
          format: 'date-time',
        },
        paymentMethod: {
          type: 'string',
        },
      },
      required: ['paymentDate', 'bankAccount', 'paymentMethod'],
    },
  },
});

route.definition('ap-payment-detail', {
  properties: {
    apPayment: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
        },
        bankAccount: {
          type: 'string',
        },
        vendor: {
          type: 'object',
          properties: {
            vendorDetails: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                _id: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                billingAddress: { type: 'string' },
                taxId: { type: 'string' },
                vendorCompany: { type: 'string' },
                paymentMethod: { type: 'string' },
                billPaymentNotes: { type: 'string' },
                billBalance: { type: 'string' },
                wtFeeWaived: { type: 'boolean' },
                priorityPay: { type: 'boolean' },
                deleted: { type: 'boolean' },
                billingTerms: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
        paymentDate: {
          type: 'string',
          format: 'date-time',
        },
        paymentMethod: {
          type: 'string',
        },
        siConnector: {
          type: 'object',
          properties: {
            synced: {
              type: 'boolean',
            },
            error: {
              type: 'string',
            },
            lastSyncDate: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        amountPaid: {
          type: 'number',
        },
        budgetAmount: {
          type: 'number',
        },
      },
    },
  },
  required: ['apPayment'],
});

route.definition('ap-payment-list', customizableList({
  properties: {
    _id: { type: 'string' },
    vendorName: { type: 'string' },
    paymentDate: {
      type: 'string',
      format: 'date-time',
    },
    status: {
      type: 'string',
    },
    bankAccount: {
      type: 'string',
    },
    siConnector: {
      type: 'object',
      properties: {
        synced: {
          type: 'boolean',
        },
        error: {
          type: 'string',
        },
        lastSyncDate: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
    vendorEmail: { type: 'string' },
    vendorBillingAddress: { type: 'string' },
    vendorTaxId: { type: 'string' },
    vendorCompany: { type: 'string' },
    vendorPaymentMethod: { type: 'string' },
    vendorBillBalance: { type: 'string' },
    vendorWtFeeWaived: { type: 'boolean' },
    vendorPriorityPay: { type: 'boolean' },
    vendorBillPaymentNotes: { type: 'string' },
    vendorBillingTerms: { type: 'array', items: { type: 'string' } },
    budgetAmount: { type: 'number' },
    amountPaid: { type: 'string' },
  },
}));

route.definition('account-payable-list', customizableList({
  properties: {
    _id: { type: 'string' },
    no: { type: 'string' },
    billNo: { type: 'string' },
    vendorId: { type: 'string' },
    vendorName: { type: 'string' },
    status: { type: 'string' },
    creditsAvailable: { type: 'number' },
    billBalance: { type: 'number' },
    createdAt: { type: 'string' },
  },
}));
