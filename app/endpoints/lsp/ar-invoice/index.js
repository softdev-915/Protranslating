const Router = require('../../../components/application/route');
const { customizableList, defineResponse } = require('../../../components/application/definitions');
const controller = require('./ar-invoice-controller');
const generate = require('../../../utils/swagger');

const route = Router.create();
const CREATE_ROLES = ['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL'];
const READ_ROLES = ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'];
const UPDATE_ROLES = ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'];
const TAGS = ['Ar Invoice'];
const ENTITY_NAME = 'ar invoice';
const REFS = {
  ENTITY: '#/definitions/ar-invoice',
  ENTITY_INPUT: '#/definitions/ar-invoice-input',
  LIST: '#/definitions/ar-invoice-list',
};
const lspIdParam = {
  name: 'lspId',
  in: 'path',
  description: 'The lspId',
  type: 'string',
  required: true,
};

route.get(
  '/lsp/{lspId}/ar-invoice/export',
  controller.export,
  generate.exportRouteDescription({ ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }] }),
);

route.get(
  '/lsp/{lspId}/ar-invoice',
  controller.list,
  generate.listRouteDescription({
    ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS,
  }),
);

route.post(
  '/lsp/{lspId}/ar-invoice',
  controller.create,
  generate.createRouteDescription({
    ENTITY_NAME, TAGS, ROLES: CREATE_ROLES, REFS,
  }),
);

route.get(
  '/lsp/{lspId}/ar-invoice/{id}',
  controller.details,
  generate.detailsRouteDescription({
    ENTITY_NAME, TAGS, ROLES: [{ oneOf: READ_ROLES }], REFS,
  }),
);

route.put(
  '/lsp/{lspId}/ar-invoice/{id}',
  controller.update,
  generate.updateRouteDescription({
    ENTITY_NAME, TAGS, ROLES: [{ oneOf: UPDATE_ROLES }], REFS,
  }),
);

route.get(
  '/lsp/{lspId}/ar-invoice/request-currency-po-lists/{companyId}',
  controller.getFromRequestCurrencyPoLists,

  {
    tags: [
      'Ar Invoice',
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'INVOICE_READ_OWN',
            'INVOICE_READ_ALL',
            'REQUEST_READ_OWN',
            'REQUEST_READ_COMPANY',
            'REQUEST_READ_ALL',
          ],
        },
      ],
    },
    description: 'Retrieve the purchase orders and currencies by company Id',
    summary: 'Retrieve the purchase orders and currencies by company Id',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The request purchase orders and currencies',
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
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

route.get(
  '/lsp/{lspId}/ar-invoice/{id}/activity',
  controller.invoiceActivity,

  {
    tags: ['Ar Invoice', 'Activity'],
    'x-swagger-security': {
      roles: [{ oneOf: ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'] }],
    },
    description: 'Retrieve the invoice\'s detail',
    summary: 'Retrieve the invoice\'s detail',
    parameters: [
      lspIdParam,
      {
        name: 'id',
        in: 'path',
        description: 'The invoice\'s id',
        type: 'string',
        required: true,
      }],
    responses: {
      200: {
        description: 'The invoice\'s detail',
        schema: {
          $ref: '#/definitions/ar-invoice-response',
        },
      },
      400: {
        description: 'Invalid invoice',
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

route.get(
  '/lsp/{lspId}/ar-invoice/{id}/template/{templateId}',
  controller.getInvoiceTemplate,

  {
    tags: [
      'Ar Invoice',
      'Template',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'] }],
    },
    description: 'Retrieve the purchase orders and currencies by company Id',
    summary: 'Retrieve the purchase orders and currencies by company Id',
    parameters: [
      lspIdParam,
      {
        name: 'id',
        in: 'path',
        description: 'The invoice\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'templateId',
        in: 'path',
        description: 'The template\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'customFields',
        in: 'query',
        description: 'Custom fields',
        type: 'string',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'The request purchase orders and currencies',
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
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

route.delete(
  '/lsp/{lspId}/ar-invoice/{entityId}/attachments/{attachmentId}',
  controller.detachFile,
  generate.detachFileDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: UPDATE_ROLES }] }),
);

route.get(
  '/lsp/{lspId}/ar-invoice/{entityId}/attachments/{attachmentId}',
  controller.getFileStream,
  generate.fileStreamRouteDescription({ TAGS, ENTITY_NAME, ROLES: [{ oneOf: READ_ROLES }] }),
);

route.put('/lsp/{lspId}/ar-invoice/{id}/reverse',
  controller.reverseInvoice, {
    tags: [
      'Ar Invoice',
      'Reverse',
    ],
    'x-swagger-security': {
      roles: ['INVOICE-ACCT_READ_ALL', 'INVOICE_UPDATE_ALL'],
    },
    description: 'Reverse the invoice by invoice Id',
    summary: 'Reverse the invoice by invoice Id',
    parameters: [
      lspIdParam,
      {
        name: 'id',
        in: 'path',
        description: 'The invoice\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'data',
        in: 'body',
        description: 'Invoice reversal data',
        required: true,
        schema: {
          $ref: '#/definitions/ar-invoice-reverse-detail',
        },
      },
    ],
    responses: {
      200: {
        description: 'The invoice has been reversed successfully',
        schema: {
          $ref: '#/definitions/ar-invoice',
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

// ***********************DEFINITIONS***************************

route.definition('ar-invoice-input', {
  properties: {
    status: {
      type: 'string',
    },
    company: {
      type: 'string',
    },
    contact: {
      type: 'string',
    },
    purchaseOrder: {
      type: 'string',
    },
    billingTerm: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    date: {
      type: 'string',
    },
    dueDate: {
      type: 'string',
    },
    glPostingDate: {
      type: 'string',
    },
    postOutOfPeriod: {
      type: 'boolean',
    },
    description: {
      type: 'string',
    },
    salesRep: {
      type: 'string',
    },
    accounting: {
      type: 'object',
      $ref: '#/definitions/accounting',
    },
    templates: {
      type: 'object',
      $ref: '#/definitions/templates',
    },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/invoice-entry',
      },
    },
    revenueRecognition: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
        },
        endDate: {
          type: 'string',
        },
      },
    },
  },
});

route.definition('ar-invoice', {
  properties: {
    _id: {
      type: 'string',
    },
    no: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    contact: {
      type: 'object',
      $ref: '#/definitions/contact',
    },
    purchaseOrder: {
      type: 'string',
    },
    billingTerm: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    date: {
      type: 'string',
    },
    dueDate: {
      type: 'string',
    },
    glPostingDate: {
      type: 'string',
    },
    postOutOfPeriod: {
      type: 'boolean',
    },
    description: {
      type: 'string',
    },
    salesRep: {
      type: 'string',
    },
    accounting: {
      type: 'object',
      $ref: '#/definitions/accounting',
    },
    templates: {
      type: 'object',
      $ref: '#/definitions/templates',
    },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/invoice-entry',
      },
    },
  },
});

route.definition('company', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    hierarchy: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
  },
});

route.definition('contact', {
  properties: {
    _id: {
      type: 'string',
    },
    company: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    billingAddress: {
      type: 'object',
      $ref: '#/definitions/address',
    },
  },
});

route.definition('address', {
  properties: {
    line1: {
      type: 'string',
    },
    line2: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    country: {
      type: 'object',
      $ref: '#/definitions/user-country',
    },
    state: {
      type: 'object',
      $ref: '#/definitions/user-state',
    },
    zip: {
      type: 'string',
    },
  },
});

route.definition('user-country', {
  properties: {
    name: {
      type: 'string',
    },
    code: {
      type: 'string',
    },
  },
});

route.definition('user-state', {
  properties: {
    name: {
      type: 'string',
    },
    code: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
  },
  required: ['name', 'code', 'country'],
});

route.definition('templates', {
  properties: {
    invoice: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    email: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
  },
  required: ['invoice', 'email'],
});

route.definition('accounting', {
  properties: {
    amount: {
      type: 'number',
    },
    localAmount: {
      type: 'number',
    },
    balance: {
      type: 'number',
    },
    localBalance: {
      type: 'number',
    },
    currency: {
      properties: {
        applied: {
          type: 'object',
          $ref: '#/definitions/id-name-entity',
        },
        exchangeRate: {
          type: 'number',
        },
        local: {
          type: 'object',
          $ref: '#/definitions/id-name-entity',
        },
      },
    },
    paid: {
      type: 'number',
    },
    localPaid: {
      type: 'number',
    },
  },
});

route.definition('invoice-entry', {
  properties: {
    _id: {
      type: 'string',
    },
    no: {
      type: 'string',
    },
    purchaseOrder: {
      type: 'string',
    },
    taskName: {
      type: 'string',
    },
    memo: {
      type: 'string',
    },
    breakdown: {
      type: 'string',
    },
    languageCombination: {
      type: 'string',
    },
    quantity: {
      type: 'number',
    },
    price: {
      type: 'number',
    },
    amount: {
      type: 'number',
    },
    internalDepartment: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    show: {
      type: 'boolean',
    },
  },
});

route.definition('document', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    mime: {
      type: 'string',
    },
    encoding: {
      type: 'string',
    },
    size: {
      type: 'number',
    },
    url: {
      type: 'string',
    },
    cloudKey: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
    },
  },
});

route.definition('ar-invoice-list', customizableList({
  $ref: '#/definitions/ar-invoice',
}));

route.definition('ar-invoice-response', defineResponse({
  invoice: {
    $ref: '#/definitions/ar-invoice',
  },
}));

route.definition('ar-invoice-reverse-detail', {
  properties: {
    reversedOnDate: {
      type: 'string',
      format: 'date-time',
    },
    memo: {
      type: 'string',
    },
  },
});

module.exports = route;
