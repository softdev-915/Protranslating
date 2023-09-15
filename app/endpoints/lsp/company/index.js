const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = module.exports = Router.create();
const controller = require('./company-controller');

route.get('/lsp/{lspId}/company/export',
  controller.companyExport, {
    tags: [
      'Company',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_COMPANY', 'COMPANY_READ_OWN'] },
      ],
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
    },
  });

route.get('/lsp/{lspId}/company/nameList',
  controller.nameList, {
    tags: [
      'Company name list',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_COMPANY', 'COMPANY_READ_OWN'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'select',
      in: 'query',
      description: 'Filters results to specific fields',
      type: 'string',
    }, {
      name: 'query',
      in: 'query',
      description: 'Records condition',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the companies',
    summary: 'Retrieves the companies',
    responses: {
      200: {
        description: 'The companies list',
        schema: {
          $ref: '#/definitions/abbr-company-list',
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

route.get('/lsp/{lspId}/company',
  controller.list, {
    tags: [
      'Company',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_COMPANY', 'COMPANY_READ_OWN'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'select',
      in: 'query',
      description: 'Filters results to specific fields',
      type: 'string',
    }, {
      name: 'query',
      in: 'query',
      description: 'Records condition',
      type: 'string',
    }, {
      name: 'ids',
      in: 'query',
      description: 'The company\'s id',
      type: 'string',
    }, {
      name: 'columns',
      in: 'query',
      description: 'Columns to return',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    description: 'Retrieves the companies',
    summary: 'Retrieves the companies',
    responses: {
      200: {
        description: 'The companies list',
        schema: {
          $ref: '#/definitions/company-list',
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

route.get('/lsp/{lspId}/company/{id}/allowedUploadingForIp',
  controller.isUploadingAllowedForIp, {
    tags: [
      'Company',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'COMPANY_READ_ALL',
            'COMPANY_READ_COMPANY',
            'COMPANY_READ_OWN',
            'TASK_UPDATE_OWN',
          ],
        },
      ],
    },
    description: 'Returns true/false whether the company allows file uploading based on CIDR',
    summary: 'Returns true/false whether the company allows file uploading based on CIDR',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'True if uploading is allowed, false if not',
      },
      400: {
        description: 'Invalid ObjectId',
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

route.get('/lsp/{lspId}/company/{id}',
  controller.getPopulated, {
    tags: [
      'Company',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_COMPANY', 'COMPANY_READ_OWN'],
        },
      ],
    },
    description: 'Retrieves the company\'s details',
    summary: 'Retrieves the company\'s details',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'select',
      in: 'query',
      description: 'Fields projection',
      required: false,
      type: 'string',
    }],
    responses: {
      200: {
        description: 'The company\'s detail',
        schema: {
          $ref: '#/definitions/company-response',
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

route.get('/lsp/{lspId}/company/{id}/publicInfo',
  controller.getPublicInfo, {
    tags: [
      'Company',
    ],
    description: 'Retrieves the company\'s public info',
    summary: 'Retrieves the company\'s public info',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'The company\'s public info',
        schema: {
          $ref: '#/definitions/company-public-response',
        },
      },
      401: {
        description: 'Invalid credentials',
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
  });

route.get('/lsp/{lspId}/company/{id}/industry', controller.getIndustry, {
  tags: ['Company'],
  description: 'Retrieves company\'s industry',
  summary: 'Retrieves company\'s industry',
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'id',
    in: 'path',
    description: 'Company\'s id',
    required: true,
    type: 'string',
    format: 'uuid',
  }],
  responses: {
    200: {
      description: 'The company\'s industry',
      schema: {
        $ref: '#/definitions/company-industry-response',
      },
    },
    401: {
      description: 'Invalid credentials',
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
});

route.get('/lsp/{lspId}/company/{id}/rates',
  controller.getCompanyRates, {
    tags: [
      'Company rates',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'COMPANY-BILLING_READ_OWN',
            'COMPANY_READ_ALL',
            'QUOTE_READ_COMPANY',
            'QUOTE_READ_OWN',
          ],
        },
      ],
    },
    description: 'Retrieves the company\'s rates',
    summary: 'Retrieves the company\'s rates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'The company\'s rates',
        schema: {
          $ref: '#/definitions/company-rates',
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

route.get('/lsp/{lspId}/company/{id}/sso-settings',
  controller.getCompanySsoSettings, {
    tags: [
      'Company sso settings',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'COMPANY_READ_OWN',
            'COMPANY_READ_ALL',
            'COMPANY_READ_COMPANY',
          ],
        },
      ],
    },
    description: 'Retrieves the company\'s sso settings',
    summary: 'Retrieves the company\'s sso settings',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'The company\'s sso settings',
        schema: {
          $ref: '#/definitions/company-sso-settings',
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

route.get('/lsp/{lspId}/company/{id}/ip-rates/reset/{entity}/{language}',
  controller.resetIpRates, {
    tags: [
      'Company Ip Rates',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'COMPANY-IP-RATES_UPDATE_ALL',
            'COMPANY_READ_ALL',
          ],
        },
      ],
    },
    description: 'Resets the company\'s ip rates',
    summary: 'Resets the company\'s ip rates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'entity',
      in: 'path',
      description: 'Ip Entity translation fees to reset',
      required: true,
      type: 'string',
    }, {
      name: 'language',
      in: 'path',
      description: 'Ip Entity language to retrieve',
      required: true,
      type: 'string',
    }],
    responses: {
      200: {
        description: 'The company\'s resetted ip rates',
        schema: {
          $ref: '#/definitions/ip-rates',
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

route.get('/lsp/{lspId}/company/{id}/ip-rates/{entity}/{language}',
  controller.getIpRates, {
    tags: [
      'Company Ip Rates',
    ],
    'x-swagger-security': {
      roles: ['COMPANY-IP-RATES_UPDATE_ALL', 'COMPANY_READ_ALL'],
    },
    description: 'Retrieves the company\'s ip rates',
    summary: 'Retrieves the company\'s ip rates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'entity',
      in: 'path',
      description: 'Ip Entity translation fees to retrieve',
      required: true,
      type: 'string',
    }, {
      name: 'language',
      in: 'path',
      description: 'Ip Entity language for translation fees',
      required: true,
      type: 'string',
    }],
    responses: {
      200: {
        description: 'The company\'s ip rates',
        schema: {
          $ref: '#/definitions/ip-rates',
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

route.put('/lsp/{lspId}/company/{id}/ip-rates/{entity}/{language}/{defaultCompanyCurrencyCode}',
  controller.updateIpRates, {
    tags: [
      'Company Ip Rates',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY-IP-RATES_UPDATE_ALL',
        'COMPANY_READ_ALL',
      ],
    },
    description: 'Update the company\'s ip rates',
    summary: 'Update the company\'s ip rates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'entity',
      in: 'path',
      description: 'Ip Entity translation fees to reset',
      required: true,
      type: 'string',
    }, {
      name: 'language',
      in: 'path',
      description: 'Ip Entity language to retrieve',
      required: true,
      type: 'string',
    }, {
      name: 'defaultCompanyCurrencyCode',
      in: 'path',
      description: 'Default currency code of ip rates  ',
      required: true,
      type: 'string',
    }, {
      name: 'data',
      in: 'body',
      description: 'The new rates',
      required: true,
      schema: {
        $ref: '#/definitions/ip-rates-updated',
      },
    }],
    responses: {
      200: {
        description: 'The company\'s update ip rates',
        schema: {
          $ref: '#/definitions/ip-rates',
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

route.post('/lsp/{lspId}/company',
  controller.create, {
    tags: [
      'Company',
    ],
    'x-swagger-security': {
      roles: [
        'COMPANY_CREATE_ALL',
      ],
    },
    description: 'Creates a new company',
    summary: 'Creates a new company',
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
      description: 'The new company',
      required: true,
      schema: {
        $ref: '#/definitions/company',
      },
    }],
    responses: {
      200: {
        description: 'The new created company',
        schema: {
          $ref: '#/definitions/company-response',
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

route.put('/lsp/{lspId}/company/{id}',
  controller.update, {
    tags: [
      'Company',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_UPDATE_ALL', 'COMPANY-BILLING_UPDATE_ALL', 'COMPANY-BILLING_UPDATE_OWN', 'COMPANY_UPDATE_OWN'] },
      ],
    },
    description: 'Updates a company',
    summary: 'Updates a company',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      description: 'The company to update',
      required: true,
      schema: {
        $ref: '#/definitions/company',
      },
    }],
    responses: {
      200: {
        description: 'The newly created company',
        schema: {
          $ref: '#/definitions/company-response',
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
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      500: {
        description: 'Update error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/company/{id}/salesRep',
  controller.getCompanySalesRep, {
    tags: [
      'Company sales rep',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_OWN'] },
      ],
    },
    description: 'Retrieves the company\'s sales rep',
    summary: 'Retrieves the company\'s sales rep',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'The company\'s sales rep',
        schema: {
          $ref: '#/definitions/sales-rep',
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

route.get('/lsp/{lspId}/company/{id}/balance',
  controller.getCompanyBalance, {
    tags: ['Company Balance'],
    'x-swagger-security': {
      roles: ['COMPANY-BILLING_READ_OWN'],
    },
    description: 'Retrieves the company\'s balance',
    summary: 'Retrieves the company\'s balance',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'The company\'s balance',
        schema: {
          $ref: '#/definitions/sales-rep',
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

route.get('/lsp/{lspId}/company/{id}/availableTimeToDeliver',
  controller.getCompanyAvailableTimeToDeliver, {
    tags: [
      'Company available time to deliver',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['COMPANY_READ_ALL', 'COMPANY_READ_OWN'] },
      ],
    },
    description: 'Retrieves the company\'s available time to deliver',
    summary: 'Retrieves the company\'s available time to deliver',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }],
    responses: {
      200: {
        description: 'The company\'s sales rep',
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
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
route.definition('company-billing-information', {
  properties: {
    onHold: {
      type: 'boolean',
    },
    onHoldReason: {
      type: 'string',
    },
    purchaseOrderRequired: {
      type: 'boolean',
    },
    quoteCurrency: {
      type: 'object',
      $ref: '#/definitions/currency',
    },
    paymentMethod: {
      type: 'string',
    },
    billingTerm: {
      type: 'string',
    },
    grossProfit: {
      type: 'integer',
    },
  },
});

route.definition('company-cidr', {
  properties: {
    ip: {
      type: 'string',
    },
    subnet: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
  required: ['ip', 'description'],
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
      type: 'string',
      format: 'uuid',
    },
    state: {
      type: 'string',
      format: 'uuid',
    },
    zip: {
      type: 'string',
    },
  },
});

route.definition('company-rate', {
  properties: {
    _id: {
      type: 'string',
    },
    sourceLanguage: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    targetLanguage: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    ability: {
      type: 'string',
    },
    rateDetails: {
      type: 'array',
      items: {
        $ref: '#/definitions/company-rate-detail',
      },
    },
  },
  required: ['sourceLanguage', 'targetLanguage', 'ability', 'rateDetails'],
});

route.definition('company-rate-detail', {
  properties: {
    price: {
      type: 'number',
    },
    internalDepartment: {
      type: 'string',
    },
    breakdown: {
      type: 'string',
    },
    currency: {
      type: 'string',
    },
    translationUnit: {
      type: 'string',
    },
  },
  required: ['internalDepartment', 'currency'],
});

route.definition('ip-rate-currencies', {
  properties: {
    USD: { type: 'string' },
    AUD: { type: 'string' },
    CAD: { type: 'string' },
    GBP: { type: 'string' },
    EUR: { type: 'string' },
  },
});

route.definition('ip-rate-detail', {
  properties: {
    country: {
      type: 'string',
    },
    translationRate: {
      type: 'object',
      $ref: '#/definitions/ip-rate-currencies',
    },
    translationRateDefault: {
      type: 'string',
    },
    agencyFee: {
      type: 'object',
      $ref: '#/definitions/ip-rate-currencies',
    },
    agencyFeeDefault: {
      type: 'string',
    },
    currencyCode: {
      type: 'string',
    },
    deDirectIq: {
      type: 'boolean',
    },
    frDirectIq: {
      type: 'boolean',
    },
  },
});

route.definition('ip-rate-detail-updated', {
  properties: {
    country: {
      type: 'string',
    },
    agencyFee: {
      type: 'string',
    },
    translationRate: {
      type: 'string',
    },
  },
});

route.definition('rate-language', {
  properties: {
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
  },
  required: ['isoCode'],
});

route.definition('mt-settings-language-combination', {
  properties: {
    srcLang: {
      type: 'string',
    },
    tgtLang: {
      type: 'string',
    },
    text: {
      type: 'string',
    },
    mtEngine: {
      type: 'string',
    },
    isPortalMt: {
      type: 'boolean',
      default: false,
    },
  },
  required: ['srcLang', 'tgtLang', 'text', 'mtEngine'],
});

route.definition('mt-settings', {
  properties: {
    useMt: {
      type: 'boolean',
    },
    languageCombinations: {
      type: 'array',
      items: {
        $ref: '#/definitions/mt-settings-language-combination',
      },
    },
    isoCode: {
      type: 'string',
    },
  },
  required: ['isoCode'],
});

route.definition('pc-settings', {
  properties: {
    mtThreshold: {
      type: ['number', 'string'],
    },
    lockedSegments: {
      type: 'object',
      properties: {
        segmentsToLock: {
          type: 'array',
          items: {
            type: 'string',
            format: 'uuid',
          },
        },
        newConfirmedBy: {
          type: 'string',
        },
      },
    },
  },
});

route.definition('company', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
    },
    parentCompany: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        hierarchy: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        status: {
          type: 'string',
        },
        securityPolicy: {
          $ref: '#/definitions/security-policy',
        },
        parentCompany: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            hierarchy: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            status: {
              type: 'string',
            },
            securityPolicy: {
              $ref: '#/definitions/security-policy',
            },
            parentCompany: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                },
                hierarchy: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                status: {
                  type: 'string',
                },
                securityPolicy: {
                  $ref: '#/definitions/security-policy',
                },
              },
            },
          },
        },
      },
    },
    cidr: {
      $ref: '#/definitions/company-cidr',
    },
    billingInformation: {
      $ref: '#/definitions/company-billing-information',
    },
    salesRep: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    pursuitActive: {
      type: 'boolean',
    },
    industry: {
      $ref: '#/definitions/industry',
    },
    customerTierLevel: {
      type: 'string',
    },
    website: {
      type: 'string',
    },
    primaryPhoneNumber: {
      type: 'string',
    },
    notes: {
      type: 'string',
    },
    mailingAddress: {
      $ref: '#/definitions/address',
    },
    billingAddress: {
      $ref: '#/definitions/address',
    },
    billingEmail: {
      type: 'string',
    },
    rates: {
      type: 'array',
      items: {
        $ref: '#/definitions/company-rate',
      },
    },
    isOverwritten: {
      type: 'boolean',
    },
    allowCopyPasteInPortalCat: {
      type: 'boolean',
    },
    securityPolicy: {
      $ref: '#/definitions/security-policy',
    },
    areSsoSettingsOverwritten: {
      type: 'boolean',
    },
    ssoSettings: {
      $ref: '#/definitions/company-sso-settings',
    },
    mtSettings: {
      $ref: '#/definitions/mt-settings',
    },
    pcSettings: {
      $ref: '#/definitions/pc-settings',
    },
  },
  required: ['name', 'status', 'industry', 'customerTierLevel'],
});

route.definition('company-public', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
    },
    allowCopyPasteInPortalCat: {
      type: 'boolean',
    },
  },
});

route.definition('security-policy', {
  properties: {
    passwordExpirationDays: {
      type: 'number',
    },
    numberOfPasswordsToKeep: {
      type: 'number',
    },
    minPasswordLength: {
      type: 'number',
    },
    maxInvalidLoginAttempts: {
      type: 'number',
    },
    lockEffectivePeriod: {
      type: 'number',
    },
    timeoutInactivity: {
      type: 'number',
    },
    passwordComplexity: {
      type: 'object',
      properties: {
        lowerCaseLetters: {
          type: 'boolean',
        },
        upperCaseLetters: {
          type: 'boolean',
        },
        specialCharacters: {
          type: 'boolean',
        },
        hasDigitsIncluded: {
          type: 'boolean',
        },
      },
    },
  },
});
route.definition('abbr-company', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
    },
    hierarchy: {
      type: 'string',
    },
    mandatoryRequestContact: {
      type: 'boolean',
    },
    quoteCurrency: {
      type: 'object',
      $ref: '#/definitions/currency',
    },
    securityPolicy: {
      $ref: '#/definitions/security-policy',
    },
    status: {
      type: 'boolean',
    },
    allowCopyPasteInPortalCat: {
      type: 'boolean',
    },
  },
});

route.definition('abbr-company-list', customizableList({
  $ref: '#/definitions/abbr-company',
}));

route.definition('company-list', customizableList({
  $ref: '#/definitions/company',
}));

route.definition('company-response', defineResponse({
  company: {
    $ref: '#/definitions/company',
  },
  isUserIpAllowed: {
    type: 'boolean',
  },
}));

route.definition('company-public-response', defineResponse({
  company: {
    $ref: '#/definitions/company-public',
  },
}));

route.definition('id-name-entity', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['_id'],
});

route.definition('id-name-companies', {
  type: 'array',
  items: {
    $ref: '#/definitions/id-name-entity',
  },
});

route.definition('sales-rep', {
  properties: {
    _id: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    terminated: {
      type: 'boolean',
    },
  },
});

route.definition('company-rates', defineResponse({
  rates: {
    type: 'array',
    items: {
      $ref: '#/definitions/company-rate-detail',
    },
  },
}));

route.definition('company-sso-settings', defineResponse({
  ssoSettings: {
    type: 'object',
    properties: {
      isSSOEnabled: {
        type: 'boolean',
      },
      certificate: {
        type: 'string',
      },
      issuerMetadata: {
        type: 'string',
      },
      entryPoint: {
        type: 'string',
      },
    },
  },
}));

route.definition('ip-rates', defineResponse({
  defaultCompanyCurrencyCode: {
    type: 'string',
  },
  entityIpRates: {
    type: 'array',
    items: {
      $ref: '#/definitions/ip-rate-detail',
    },
  },
}));

route.definition('ip-rates-updated', {
  properties: {
    payload: {
      type: 'array',
      items: {
        $ref: '#/definitions/ip-rate-detail-updated',
      },
    },
  },
});

route.definition('currency', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
  },
  required: ['name', 'isoCode', '_id'],
});

route.definition('company-balance', defineResponse({
  rates: {
    type: 'array',
    items: {
      $ref: '#/definitions/company-balance-row',
    },
  },
}));

route.definition('company-balance-row', {
  properties: {
    currency: {
      type: 'string',
    },
    invoice: {
      $ref: '#/definitions/company-balance-item',
    },
    credit: {
      $ref: '#/definitions/company-balance-item',
    },
    debit: {
      $ref: '#/definitions/company-balance-item',
    },
    advance: {
      $ref: '#/definitions/company-balance-item',
    },
    balance: {
      type: 'number',
    },
    balanceCondolidated: {
      type: 'number',
    },
  },
});

route.definition('company-balance-item', {
  properties: {
    own: {
      type: 'number',
    },
    consolidated: {
      type: 'number',
    },
  },
});

route.definition('company-industry-response', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    industry: {
      $ref: '#/definitions/industry',
    },
  },
});
