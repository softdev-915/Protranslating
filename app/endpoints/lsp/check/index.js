const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const customizableList = definitions.customizableList;
const route = module.exports = Router.create();

const controller = require('./check-controller');

route.get('/lsp/{lspId}/check',
  controller.checkList, {
    tags: [
      'Print Checks',
    ],
    'x-swagger-security': {
      roles: ['AP-PAYMENT_READ_ALL'],
    },
    description: 'Retrieves a checks list',
    summary: 'Retrieves a checks list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The check list',
        schema: {
          $ref: '#/definitions/check-list',
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

route.put('/lsp/{lspId}/check/{id}/memo',
  controller.updateMemo, {
    tags: [
      'Print Checks',
    ],
    'x-swagger-security': {
      roles: ['AP-PAYMENT_READ_ALL'],
    },
    description: 'Updates check\'s memo',
    summary: 'Updates check\'s memo',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'The check\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Request body',
      schema: {
        properties: {
          memo: { type: 'string' },
        },
        required: ['memo'],
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'Memo updated successfully',
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

route.post('/lsp/{lspId}/check',
  controller.generateChecksPdf, {
    tags: [
      'Print Checks',
    ],
    'x-swagger-security': {
      roles: ['AP-PAYMENT_READ_ALL'],
    },
    description: 'Generate PDF with checks to be printed',
    summary: 'Generate PDF with checks to be printed',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Checks details',
      schema: {
        $ref: '#/definitions/generate-checks-pdf-body',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'PDF with checks',
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

route.definition('generate-checks-pdf-body', {
  properties: {
    account: {
      type: 'string',
    },
    nextCheckNo: {
      type: 'string',
    },
    selectedChecksIdsArray: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['account', 'nextCheckNo', 'selectedChecksIdsArray'],
});

route.definition('check-list', customizableList({
  properties: {
    _id: {
      type: 'string',
    },
    vendor: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        fullName: { type: 'string' },
      },
    },
    paymentDate: {
      type: 'string',
      format: 'date-time',
    },
    status: {
      type: 'string',
    },
    bankAccountName: {
      type: 'string',
    },
    amount: {
      type: 'number',
    },
    checkNo: {
      type: 'string',
    },
    memo: {
      type: 'string',
    },
  },
}));
