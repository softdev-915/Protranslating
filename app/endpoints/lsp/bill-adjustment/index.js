const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const customizableList = definitions.customizableList;
const route = module.exports = Router.create();

const controller = require('./bill-adjustment-controller');

route.get('/lsp/{lspId}/bill-adjustment/export',
  controller.billAdjustmentExport, {
    tags: [
      'Bill Adjustment',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: ['BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN'],
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

route.get('/lsp/{lspId}/bill-adjustment',
  controller.billAdjustmentList, {
    tags: [
      'Bill Adjustment',
    ],
    'x-swagger-security': {
      roles: [{
        oneOf: [
          'BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN',
        ],
      }],
    },
    description: 'Retrieves the bill adjustment list ',
    summary: 'Retrieves the bill adjustment list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The bill adjustment list',
        schema: {
          $ref: '#/definitions/bill-adjustment-list',
        },
      },
      400: {
        description: 'Invalid bill adjustment',
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

route.post('/lsp/{lspId}/bill-adjustment',
  controller.billAdjustmentCreate, {
    tags: [
      'Bill Adjustment',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL-ADJUSTMENT_CREATE_OWN',
            'BILL-ADJUSTMENT_CREATE_ALL',
          ],
        },
      ],
    },
    description: 'Creates a new bill adjustment',
    summary: 'Creates a new bill adjustment',
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
      description: 'The new bill adjustment to create',
      required: true,
      schema: {
        $ref: '#/definitions/bill-adjustment-create-input',
      },
    }],
    responses: {
      200: {
        description: 'Bill adjustment created successfully',
        schema: {
          $ref: '#/definitions/bill-adjustment-response',
        },
      },
      400: {
        description: 'Invalid bill adjustment',
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

route.put('/lsp/{lspId}/bill-adjustment/{billAdjustmentId}',
  controller.billAdjustmentEdit, {
    tags: ['Bill Adjustment'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['BILL-ADJUSTMENT_UPDATE_OWN', 'BILL-ADJUSTMENT_UPDATE_ALL'] },
      ],
    },
    description: 'Update bill adjustment',
    summary: 'Update bill adjustment',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId', in: 'path', description: 'The lsp\'s id', type: 'string', required: true,
    }, {
      name: 'billAdjustmentId',
      in: 'path',
      description: 'The bill adjustment id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'The bill adjustment to update',
      required: true,
      schema: { $ref: '#/definitions/bill-adjustment-update-input' },
    }],
    responses: {
      200: {
        description: 'Bill adjustment updated successfully',
        schema: { $ref: '#/definitions/bill-adjustment-response' },
      },
      400: {
        description: 'Invalid bill adjustment',
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
      404: {
        description: 'Not Found',
        schema: { $ref: '#/definitions/error' },
      },
    },
  });

route.get('/lsp/{lspId}/bill-adjustment/{billAdjustmentId}',
  controller.billAdjustmentDetail, {
    tags: [
      'Bill Adjustment',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN'],
        },
      ],
    },
    description: 'Retrieves the bill adjustment details',
    summary: 'Retrieves the bill adjustment details',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billAdjustmentId',
      in: 'path',
      description: 'Bill adjustment id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Bill adjustment detail',
        schema: {
          $ref: '#/definitions/bill-adjustment-response',
        },
      },
      400: {
        description: 'Invalid Bill Adjustment Id',
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

route.get('/lsp/{lspId}/bill-adjustment/{billAdjustmentId}/document/{documentId}',
  controller.serveFile, {
    tags: [
      'Bill Adjustment',
      'Document',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL-ADJUSTMENT_READ_ALL',
            'BILL-ADJUSTMENT_READ_OWN',
          ],
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
      name: 'billAdjustmentId',
      in: 'path',
      description: 'The bill adjustment\'s id',
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
        description: 'Invalid bill adjustment',
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
route.delete('/lsp/{lspId}/bill-adjustment/{billAdjustmentId}/document/{documentId}',
  controller.deleteDocument, {
    tags: ['Document'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN'],
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
      name: 'billAdjustmentId',
      in: 'path',
      description: "The bill adjustment's id",
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
        description: 'Updated bill adjustment',
        schema: {
          $ref: '#/definitions/bill-adjustment-response',
        },
      },
      400: {
        description: 'Invalid bill adjustment',
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
route.get('/lsp/{lspId}/bill-adjustment/{billAdjustmentId}/documents/src/zip',
  controller.serveFilesZip, {
    tags: [
      'Bill Adjustment',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'BILL-ADJUSTMENT_READ_ALL',
            'BILL-ADJUSTMENT_READ_OWN',
          ],
        },
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the bill adjustment\'s files as a zip file',
    summary: 'Serves all the bill adjustment\'s files as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'billAdjustmentId',
      in: 'path',
      description: 'The bill adjustment id',
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
        description: 'The zip file containing all the bill adjustment\'s source files',
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
  });

route.definition('bill-adjustment-response', {
  properties: {
    adjustmentNo: { type: 'string' },
    referenceBillNo: { type: 'string' },
    bill: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        no: { type: 'string' },
      },
    },
    date: { type: 'string' },
    type: {
      type: 'string',
      enum: ['Debit Memo', 'Credit Memo'],
    },
    status: {
      type: 'string',
      enum: ['posted', 'partiallyPaid', 'paid'],
    },
    vendor: {
      type: 'object',
      properties: {
        vendorDetails: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            _id: { type: 'string' },
          },
        },
      },
    },
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
    glPostingDate: { type: 'string' },
    description: { type: 'string' },
    adjustmentBalance: { type: 'number' },
    amountPaid: { type: 'number' },
    adjustmentTotal: { type: 'number' },
    lineItems: {
      type: 'array',
      items: {
        $ref: '#/definitions/bill-adjustment-line-item',
      },
    },
  },
});

route.definition('bill-adjustment-list', customizableList({
  properties: {
    _id: { type: 'string' },
    adjustmentNo: { type: 'string' },
    referenceBillNo: { type: 'string' },
    date: { type: 'string' },
    type: {
      type: 'string',
      enum: ['Debit Memo', 'Credit Memo'],
    },
    status: {
      type: 'string',
      enum: ['posted', 'partiallyPaid', 'paid'],
    },
    vendorName: { type: 'string' },
    vendorID: { type: 'string' },
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
    glPostingDate: { type: 'string' },
    description: { type: 'string' },
    adjustmentBalance: { type: 'string' },
    amountPaid: { type: 'string' },
    adjustmentTotal: { type: 'string' },
  },
}));

route.definition('bill-adjustment-create-input', {
  properties: {
    referenceBillNo: { type: 'string' },
    bill: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        no: { type: 'string' },
      },
    },
    date: { type: 'string' },
    type: {
      type: 'string',
      enum: ['Debit Memo', 'Credit Memo'],
    },
    vendor: {
      type: 'object',
      properties: {
        vendorDetails: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            _id: { type: 'string' },
          },
        },
      },
    },
    glPostingDate: { type: 'string' },
    description: { type: 'string' },
    amountPaid: { type: 'number' },
    adjustmentTotal: { type: 'number' },
    lineItems: {
      type: 'array',
      items: {
        $ref: '#/definitions/bill-adjustment-line-item',
      },
    },
  },
  required: ['type', 'date', 'vendor', 'glPostingDate', 'lineItems'],
});

route.definition('bill-adjustment-update-input', {
  properties: {
    _id: { type: 'string' },
    referenceBillNo: { type: 'string' },
    date: { type: 'string' },
    glPostingDate: { type: 'string' },
    description: { type: 'string' },
    lineItems: {
      type: 'array',
      items: { $ref: '#/definitions/bill-adjustment-line-item' },
    },
  },
  required: ['_id', 'referenceBillNo', 'date', 'glPostingDate', 'lineItems'],
});

route.definition('bill-adjustment-line-item', {
  properties: {
    glAccountNo: {
      type: 'string',
    },
    departmentId: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        accountingDepartmentId: { type: 'string' },
      },
    },
    ability: { type: 'string' },
    amount: { type: 'number' },
    memo: { type: 'string' },
  },
  required: ['glAccountNo', 'departmentId', 'amount', 'memo'],
});
