const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const route = (module.exports = Router.create());
const controller = require('./controller');

const nodbTranslationFeeExtraDataProps = [
  {
    propName: 'defaultQuoteCurrencyCode',
    schema: { type: 'string', default: 'DefaultCode' },
    required: true,
  },
  {
    propName: 'ipInstructionDeadline',
    schema: { type: 'string' },
    required: true,
  },
];

route.get('/lsp/{lspId}/nodb/countries', controller.listCountries, {
  tags: ['NODB'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists NODB countries',
  summary: 'lists NODB countries',
  responses: {
    200: {
      description: 'NODB Countries',
      schema: {
        $ref: '#/definitions/nodb-countries-list',
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

route.get('/lsp/{lspId}/nodb/currencies', controller.listCurrencies, {
  tags: ['NODB'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'database',
      in: 'query',
      description: 'Database filter parameter for currencies',
      type: 'string',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists IP currencies',
  summary: 'lists IP currencies',
  responses: {
    200: {
      description: 'IP currencies',
      schema: {
        $ref: '#/definitions/ip-currency-list',
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

route.get('/lsp/{lspId}/nodb/translation-fee', controller.listTranslationFee, {
  tags: ['NODB'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'countries',
      in: 'query',
      description: 'Selected quote countries',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    {
      name: 'specificationWordCount',
      in: 'query',
      description: 'The nodb patent specificationWordCount',
      type: 'string',
    },
    {
      name: 'drawingsWordCount',
      in: 'query',
      description: 'The patent drawingsWordCount',
      type: 'string',
    },
    {
      name: 'numberOfDrawings',
      in: 'query',
      description: 'The patent numberOfDrawings',
      type: 'string',
    },
    {
      name: 'drawingsPageCount',
      in: 'query',
      description: 'The patent drawingsPageCount',
      type: 'string',
    },
    {
      name: 'companyId',
      in: 'query',
      description: 'The id of existing quote',
      type: 'string',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists NODB translation fee',
  summary: 'lists NODB translation fee',
  responses: {
    200: {
      description: 'NODB translation fee',
      schema: {
        $ref: '#/definitions/nodb-translation-fee-list',
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

route.get('/lsp/{lspId}/nodb/translation-fee-filing', controller.listTranslationFeeFiling, {
  tags: ['NODB'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'countries',
      in: 'query',
      description: 'Selected quote countries',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    {
      name: 'entities',
      in: 'query',
      description: 'Selected quote entities for countries',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    {
      name: 'specificationWordCount',
      in: 'query',
      description: 'The nodb patent specificationWordCount',
      type: 'string',
    },
    {
      name: 'drawingsWordCount',
      in: 'query',
      description: 'The patent drawingsWordCount',
      type: 'string',
    },
    {
      name: 'numberOfDrawings',
      in: 'query',
      description: 'The patent numberOfDrawings',
      type: 'string',
    },
    {
      name: 'numberOfClaims',
      in: 'query',
      description: 'The patent numberOfClaims',
      type: 'string',
    },
    {
      name: 'numberOfIndependentClaims',
      in: 'query',
      description: 'The patent numberOfIndependentClaims',
      type: 'string',
    },
    {
      name: 'totalNumberOfPages',
      in: 'query',
      description: 'The patent totalNumberOfPages',
      type: 'string',
    },
    {
      name: 'applicantsLength',
      in: 'query',
      description: 'The patent applicantsLength',
      type: 'number',
    },
    {
      name: 'companyId',
      in: 'query',
      description: 'The id of existing quote',
      type: 'string',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists NODB translation fee',
  summary: 'lists NODB translation fee',
  responses: {
    200: {
      description: 'NODB translation fee',
      schema: {
        $ref: '#/definitions/nodb-translation-fee-list',
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

route.get('/lsp/{lspId}/nodb/template', controller.getTemplate, {
  tags: ['NODB'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'translationOnly',
      in: 'query',
      description: 'Operation translation only or with filling',
      type: 'boolean',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'Retrieves a nodb template',
  summary: 'Retrieves a nodb template',
  responses: {
    200: {
      description: 'The template',
      schema: {
        $ref: '#/definitions/template-response',
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
      description: "The template doesn't exist",
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/lsp/{lspId}/nodb/disclaimers', controller.listDisclaimers, {
  tags: ['NODB'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists IP disclaimers',
  summary: 'lists IP disclaimers',
  responses: {
    200: {
      description: 'IP disclaimers',
      schema: {
        $ref: '#/definitions/ip-disclaimer-list',
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

route.post('/lsp/{lspId}/nodb-request', controller.createRequest, {
  tags: ['Request', 'Nodb'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: [
          'REQUEST_CREATE_OWN',
          'REQUEST_CREATE_COMPANY',
          'REQUEST_CREATE_ALL',
        ],
      },
    ],
  },
  description: 'Creates a new translation request with ip details',
  summary: 'Creates a new translation request ip details',
  consumes: ['application/json'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'translationOnly',
      in: 'query',
      description: 'Is the EPO for only translation or a filling',
      type: 'boolean',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The new request to create',
      required: true,
      schema: {
        $ref: '#/definitions/request-update-input',
      },
    },
  ],
  responses: {
    200: {
      description: 'The newly translation request created',
      schema: {
        $ref: '#/definitions/request-response',
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

route.put('/lsp/{lspId}/nodb-request/{requestId}', controller.updateRequest, {
  tags: ['Request', 'WIPO'],
  'x-swagger-security': {
    roles: ['IP-QUOTE_UPDATE_OWN'],
  },
  description: 'Update ip details  of request',
  summary: 'Update ip details of request',
  consumes: ['application/json'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'translationOnly',
      in: 'query',
      description: 'Indicates whether it\'s translation only or with filling',
      type: 'boolean',
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'The request to update',
      required: true,
      schema: {
        $ref: '#/definitions/request-update-input',
      },
    },
  ],
  responses: {
    200: {
      description: 'Updated translation request',
      schema: {
        $ref: '#/definitions/request-response',
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

route.definition('nodb-country', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    name: {
      type: 'string',
    },
    code: {
      type: 'string',
    },
    iq: {
      type: 'boolean',
    },
    entity: {
      type: 'boolean',
    },
    entitySizes: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
});

route.definition('ip-currency', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    isoCode: {
      type: 'string',
    },
    database: {
      type: 'string',
    },
    default: {
      type: 'string',
    },
  },
});

route.definition('nodb-translation-fee', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    country: {
      type: 'string',
    },
    filingLanguage: {
      type: 'string',
    },
    translationRate: {
      type: 'string',
    },
    translationFormula: {
      type: 'string',
    },
    agencyFeeFlat: {
      type: 'string',
    },
    agencyFeeFormula: {
      type: 'string',
    },
    officialFeeFormula: {
      type: 'string',
    },
    officialFeeAlsoWrittenAs: {
      type: 'string',
    },
    translationFeeCalculated: {
      type: 'string',
    },
  },
});

route.definition('ip-disclaimer', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    country: {
      type: 'string',
    },
    codes: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    sameTranslation: {
      type: 'boolean',
    },
    disclaimer: {
      type: 'string',
    },
    rule: {
      type: 'string',
    },
    translationOnly: {
      type: 'boolean',
    },
    translationAndFilling: {
      type: 'boolean',
    },
  },
});

route.definition(
  'nodb-countries-list',
  customizableList({
    $ref: '#/definitions/nodb-country',
  }),
);

route.definition(
  'nodb-translation-fee-list',
  customizableList(
    { $ref: '#/definitions/nodb-translation-fee' },
    nodbTranslationFeeExtraDataProps,
  ),
);

route.definition(
  'ip-currency-list',
  customizableList({
    $ref: '#/definitions/ip-currency',
  }),
);

route.definition(
  'ip-disclaimer-list',
  customizableList({
    $ref: '#/definitions/ip-disclaimer',
  }),
);
