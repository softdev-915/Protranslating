const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { customizableList } = definitions;
const route = Router.create();

const controller = require('./bill-controller');

route.get(
  '/lsp/{lspId}/bill/export',
  controller.billExport,

  {
    tags: [
      'Bill',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: ['BILL_READ_ALL', 'BILL_READ_OWN'],
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
    summary: 'Returns a CSV file containing data from a custom query',
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

route.get(
  '/lsp/{lspId}/bill',
  controller.billList,

  {
    tags: [
      'Bill',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'BILL_READ_ALL', 'BILL_READ_OWN',
        ],
      }],
    },
    description: 'Retrieves the bill list ',
    summary: 'Retrieves the bill list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The bill list',
        schema: {
          $ref: '#/definitions/bill-list',
        },
      },
      400: {
        description: 'Invalid bill',
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
  '/lsp/{lspId}/bill/{billId}',
  controller.billDetail,

  {
    tags: [
      'Bill',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['BILL_READ_ALL', 'BILL_READ_OWN'],
        },
      ],
    },
    description: 'Retrieves the bill details',
    summary: 'Retrieves the bill details',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billId',
      in: 'path',
      description: 'Bill id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Bill list filtered by bill Id',
        schema: {
          $ref: '#/definitions/bill-detail',
        },
      },
      400: {
        description: 'Invalid Bill Id',
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

route.put(
  '/lsp/{lspId}/bill/{billId}',
  controller.billEdit,

  {
    tags: [
      'Bill',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL_UPDATE_ALL',
            'BILL_UPDATE_OWN',
          ],
        },
      ],
    },
    description: 'Edit a bill',
    summary: 'Edit a bill',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billId',
      in: 'path',
      description: 'The bill\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The bill\'s details',
      required: true,
      schema: {
        $ref: '#/definitions/bill-update-input',
      },
    }],
    responses: {
      200: {
        description: 'The edited bill',
        schema: {
          $ref: '#/definitions/bill-detail',
        },
      },
      400: {
        description: 'Invalid bill',
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
        description: 'Bill does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put(
  '/lsp/{lspId}/bill/{billType}/vendor',
  controller.createBillsForVendor,

  {
    tags: [
      'Bill creation',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL_UPDATE_ALL',
            'BILL_UPDATE_OWN',
          ],
        },
      ],
    },
    description: 'Triggers the bills creation for a given vendor',
    summary: 'Triggers the bills creation for a given vendor',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'vendorId',
      in: 'query',
      description: 'The vendor\'s id',
      type: 'string',
    }, {
      name: 'billType',
      in: 'path',
      description: 'The bill type to be created',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Successfully created bills',
      },
      400: {
        description: 'Invalid vendor or bill type',
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
  '/lsp/{lspId}/bill/{billId}/document/{documentId}',
  controller.serveFile,

  {
    tags: [
      'Bill',
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['BILL_UPDATE_ALL', 'BILL-FILES_UPDATE_OWN'],
        },
      ],
    },
    description: 'Returns the file download url',
    summary: 'Returns the file download url',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billId',
      in: 'path',
      description: 'The bill\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The file\'s url',
        schema: {
          type: 'string',
        },
      },
      400: {
        description: 'Invalid bill',
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
  '/lsp/{lspId}/bill/{billId}/document/{documentId}',
  controller.deleteDocument,

  {
    tags: ['Document'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['BILL_UPDATE_ALL', 'BILL-FILES_UPDATE_OWN'],
      }],
    },
    description: 'Deletes a document',
    summary: 'Deletes a document',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'billId',
      in: 'path',
      description: "The bill's id",
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: "The document's id",
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Updated bill',
        schema: {
          $ref: '#/definitions/bill-detail',
        },
      },
      400: {
        description: 'Invalid bill',
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
  '/lsp/{lspId}/bill/{billId}/documents/src/zip',
  controller.serveFilesZip,

  {
    tags: [
      'Bill',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL_READ_ALL',
            'BILL_READ_OWN',
          ],
        },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the bill\'s  files as a zip file',
    summary: 'Serves all the bill\'s files as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billId',
      in: 'path',
      description: 'The bill id',
      type: 'string',
      required: true,
    }, {
      name: 'ptsCookieValue',
      in: 'query',
      description: 'Will set a cookie named "pts-file-cookie" with this value',
      type: 'string',
    }],
    responses: {
      200: {
        description: 'The zip file containing all the bill\'s source files',
        schema: {
          type: 'file',
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

route.get('/lsp/{lspId}/bill/{billId}/preview/{templateId}',
  controller.getBillPreview, {
    tags: [
      'Bill',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL_READ_ALL',
            'BILL_READ_OWN',
          ],
        },
      ],
    },
    description: 'Retrieves the bill preview',
    summary: 'Retrieves the bill preview',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      }, {
        name: 'billId',
        in: 'path',
        description: 'The bill id',
        type: 'string',
        required: true,
      }, {
        name: 'templateId',
        in: 'path',
        description: 'The template id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'The bill preview',
        schema: {
          $ref: '#/definitions/bill-preview',
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

route.definition('bill-preview', {
  properties: {
    template: {
      type: 'string',
    },
    footerTemplate: {
      type: 'string',
    },
  },
});

route.definition('bill-update-input', {
  properties: {
    bill: {
      type: 'object',
      $ref: '#/definitions/bill',
    },
  },
});

route.definition('bill', {
  properties: {
    no: {
      type: 'string',
    },
    vendor: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string' },
        _id: { type: 'string' },
        firstName: {
          type: 'string',
        },
        middleName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        email: { type: 'string' },
        vendorDetails: {
          type: 'object',
          properties: {
            phone: { type: 'string' },
            billingAddress: { type: 'string' },
            taxId: { type: 'string' },
            vendorCompany: { type: 'string' },
            billBalance: { type: 'string' },
            priorityPay: { type: 'boolean' },
            deleted: { type: 'boolean' },
          },
        },
      },
    },
    billOnHold: {
      type: 'boolean',
    },
    wtFeeWaived: {
      type: 'boolean',
    },
    priorityPayment: {
      type: 'boolean',
    },
    billPaymentNotes: { type: 'string' },
    paymentMethod: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
      },
    },
    billingterms: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
      },
    },
    requestNo: {
      type: 'string',
    },
    date: { type: 'string' },
    dueDate: { type: 'string' },
    paymentScheduleDate: { type: 'string' },
    status: {
      type: 'string',
      enum: ['posted', 'partiallyPaid', 'paid', 'inProgress'],
    },
    glPostingDate: { type: 'string' },
    sync: {
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
        },
      },
    },
    amountPaid: {
      type: 'boolean',
    },
    totalAmount: {
      type: 'number',
    },
    serviceDetails: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
          },
          recipient: {
            type: 'string',
          },
          referenceNumber: {
            type: 'string',
          },
          taskDescription: {
            type: 'string',
          },
        },
      },
    },
    files: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    hasTaxIdForms: { type: 'boolean' },
    has1099EligibleForm: { type: 'boolean' },
  },
});

route.definition('bill-detail', {
  properties: {
    bill: {
      type: 'object',
      $ref: '#/definitions/bill',
    },
  },
  required: ['bill'],
});

route.definition('bill-list', customizableList({
  properties: {
    no: { type: 'string' },
    _id: { type: 'string' },
    vendorName: { type: 'string' },
    vendorID: { type: 'string' },
    requestNo: { type: 'string' },
    date: { type: 'string' },
    dueDate: { type: 'string' },
    paymentScheduleDate: { type: 'string' },
    status: {
      type: 'string',
      enum: ['posted', 'partiallyPaid', 'paid', 'inProgress'],
    },
    glPostingDate: { type: 'string' },
    sync: {
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
        },
      },
    },
    vendorCompany: { type: 'string' },
    vendorBillBalance: { type: 'string' },
    vendorWtFeeWaived: { type: 'boolean' },
    vendorPriorityPay: { type: 'boolean' },
    vendorBillPaymentNotes: { type: 'string' },
    vendorBillingTerms: { type: 'array', items: { type: 'string' } },
    billOnHold: { type: 'boolean' },
    amountPaid: { type: 'string' },
  },
}));

module.exports = route;
