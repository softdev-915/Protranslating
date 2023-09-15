const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = (module.exports = Router.create());
const controller = require('./controller');

const wipoTranslationFeesExtraDataProps = [
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

route.get('/lsp/{lspId}/wipo', controller.list, {
  tags: ['WIPO'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'pctReference',
      in: 'query',
      description: 'The wipo entry pctReference',
      type: 'string',
    },
    {
      name: 'patentPublicationNumber',
      in: 'query',
      description: 'The wipo entry patentPublicationNumber',
      type: 'string',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'Retrieves an existing wipo entry',
  summary: 'Retrieves an existing wipo entry',
  responses: {
    200: {
      description: 'The wipo',
      schema: {
        $ref: '#/definitions/wipo-response',
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
      description: "The wipo doesn't exist",
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/lsp/{lspId}/wipo/countries', controller.listCountries, {
  tags: ['WIPO'],
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
  description: 'lists WIPO countries',
  summary: 'lists WIPO countries',
  responses: {
    200: {
      description: 'WIPO Countries',
      schema: {
        $ref: '#/definitions/wipo-countries-list',
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

route.get('/lsp/{lspId}/wipo/translation-fee', controller.listTranslationFee, {
  tags: ['WIPO'],
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
      name: 'wipoId',
      in: 'query',
      description: 'The wipo patent id',
      type: 'string',
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
      name: 'descriptionWordCount',
      in: 'query',
      description: 'The patent descriptionWordCount',
      type: 'string',
    },
    {
      name: 'claimsWordCount',
      in: 'query',
      description: 'The patent claimsWordCount',
      type: 'string',
    },
    {
      name: 'drawingsWordCount',
      in: 'query',
      description: 'The patent drawingsWordCount',
      type: 'string',
    },
    {
      name: 'abstractWordCount',
      in: 'query',
      description: 'The patent abstractWordCount',
      type: 'string',
    },
    {
      name: 'drawingsPageCount',
      in: 'query',
      description: 'The patent drawingsPageCount',
      type: 'string',
    },
    {
      name: 'numberOfTotalPages',
      in: 'query',
      description: 'The patent numberOfTotalPages',
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
      name: 'numberOfDrawings',
      in: 'query',
      description: 'The patent numberOfDrawings',
      type: 'string',
    },
    {
      name: 'numberOfPriorityApplications',
      in: 'query',
      description: 'The patent numberOfPriorityApplications',
      type: 'string',
    },
    {
      name: 'entities',
      in: 'query',
      description: 'Selected entitySizes for countries',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists WIPO translation fee',
  summary: 'lists WIPO translation fee',
  responses: {
    200: {
      description: 'WIPO translation fee',
      schema: {
        $ref: '#/definitions/wipo-translation-fee-list',
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

route.get('/lsp/{lspId}/wipo/currencies', controller.listCurrencies, {
  tags: ['WIPO'],
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

route.get('/lsp/{lspId}/wipo/disclaimers', controller.listDisclaimers, {
  tags: ['WIPO'],
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

route.post('/lsp/{lspId}/wipo-request', controller.createRequest, {
  tags: ['Request', 'WIPO'],
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
      description: 'Indicates whether it\'s translation only or with filling',
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

route.put('/lsp/{lspId}/wipo-request/{requestId}', controller.updateRequest, {
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
      description: 'request data to update',
      required: true,
      schema: {
        $ref: '#/definitions/request-update-input',
      },
    },
  ],
  responses: {
    200: {
      description: 'Updated request',
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

route.get('/lsp/{lspId}/wipo-template', controller.getTemplate, {
  tags: ['WIPO'],
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
    ...PAGINATION_PARAMS,
  ],
  description: 'Retrieves a wipo template',
  summary: 'Retrieves a wipo template',
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

route.definition('wipo', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    filePath: { type: 'string' },
    sourceLanguage: { type: 'string' },
    numberOfPriorityClaims: { type: 'number' },
    filingDate: { type: 'string' },
    filingDate30: { type: 'string' },
    filingDate45: { type: 'string' },
    filingDate60: { type: 'string' },
    earliestPriorityClaimDate: { type: 'string' },
    thirtyMonthsDeadline: { type: 'string' },
    patentPublicationNumber: { type: 'string' },
    pctReference: { type: 'string' },
    title: { type: 'string' },
    abstractContent: { type: 'string' },
    abstractWordCount: { type: 'number' },
    applicantName: { type: 'string' },
    applicantAddress1: { type: 'string' },
    applicantAddress2: { type: 'string' },
    applicantCity: { type: 'string' },
    applicantState: { type: 'string' },
    applicantPostalCode: { type: 'string' },
    applicantCountryCode: { type: 'string' },
    agentName: { type: 'string' },
    agentAddress1: { type: 'string' },
    agentAddress2: { type: 'string' },
    agentCity: { type: 'string' },
    agentState: { type: 'string' },
    agentPostalCode: { type: 'string' },
    agentCountryCode: { type: 'string' },
    descriptionWordCount: { type: 'number' },
    numberOfClaims: { type: 'number' },
    claimsWordCount: { type: 'number' },
    numberOfDrawings: { type: 'number' },
    numberOfDrawingsPages: { type: 'number' },
    totalWords: { type: 'number' },
    noticePeriodforProspecting: { type: 'string' },
    numberTotalPages: { type: 'number' },
    estTotalPages: { type: 'number' },
    numberOfPagesKindCode: { type: 'string' },
    numberOfClaimsKindCode: { type: 'string' },
  },
});

route.definition('wipo-country', {
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

route.definition('wipo-translation-fee', {
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
    filingLanguageIso: {
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
    agencyFeeCalculated: {
      type: 'string',
    },
    officialFeeCalculated: {
      type: 'string',
    },
    translationFeeCalculated: {
      type: 'string',
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
  'wipo-countries-list',
  customizableList({
    $ref: '#/definitions/wipo-country',
  }),
);

route.definition(
  'wipo-translation-fee-list',
  customizableList(
    { $ref: '#/definitions/wipo-translation-fee' },
    wipoTranslationFeesExtraDataProps,
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

route.definition(
  'wipo-response',
  defineResponse({
    wipo: {
      $ref: '#/definitions/wipo',
    },
  }),
);
