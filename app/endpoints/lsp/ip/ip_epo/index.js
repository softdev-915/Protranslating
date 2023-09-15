const Router = require('../../../../components/application/route');
const definitions = require('../../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = (module.exports = Router.create());
const controller = require('./controller');

const epoTranslationFeeExtraDataProps = [
  {
    propName: 'defaultQuoteCurrencyCode',
    schema: { type: 'string', default: 'DefaultCode' },
    required: true,
  },
  {
    propName: 'ipInstructionsDeadline',
    schema: { type: 'string' },
    required: true,
  },
];

route.get('/lsp/{lspId}/epo', controller.findByPatentNumber, {
  tags: ['EPO'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'epoPatentNumber',
      in: 'query',
      description: 'The epo entry publication or application number',
      type: 'string',
      required: true,
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'Retrieves an existing epo entry',
  summary: 'Retrieves an existing epo entry',
  responses: {
    200: {
      description: 'The epo',
      schema: {
        $ref: '#/definitions/epo-response',
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
      description: "The epo doesn't exist",
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.get('/lsp/{lspId}/epo/template', controller.getTemplate, {
  tags: ['EPO'],
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
  description: 'Retrieves an epo template',
  summary: 'Retrieves an epo template',
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

route.get('/lsp/{lspId}/epo/countries', controller.listCountries, {
  tags: ['EPO'],
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
  description: 'lists EPO countries',
  summary: 'lists EPO countries',
  responses: {
    200: {
      description: 'EPO Countries',
      schema: {
        $ref: '#/definitions/epo-countries-list',
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

route.get('/lsp/{lspId}/epo/currencies', controller.listCurrencies, {
  tags: ['EPO'],
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
route.get('/lsp/{lspId}/epo/translation-fee', controller.listTranslationFee, {
  tags: ['EPO'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'epoId',
      in: 'query',
      description: 'The epo patent id',
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
      name: 'claimWordCount',
      in: 'query',
      description: 'The patent claimWordCount',
      type: 'string',
    },
    {
      name: 'drawingsWordCount',
      in: 'query',
      description: 'The patent drawingsWordCount',
      type: 'string',
    },
    {
      name: 'drawingsPageCount',
      in: 'query',
      description: 'The patent drawingsPageCount',
      type: 'string',
    },
    {
      name: 'descriptionPageCount',
      in: 'query',
      description: 'The patent descriptionPageCount',
      type: 'string',
    },
    {
      name: 'claimsPageCount',
      in: 'query',
      description: 'The patent claims page count',
      type: 'string',
    },
    {
      name: 'numberOfClaims',
      in: 'query',
      description: 'The patent numberOfClaims',
      type: 'string',
    },
    {
      name: 'applicantCount',
      in: 'query',
      description: 'The patent applicantCount',
      type: 'number',
    },
    {
      name: 'translationOnly',
      in: 'query',
      description: 'Operation translation only or with filling',
      type: 'boolean',
    },
    {
      name: 'hasClaimsTranslationOccurred',
      in: 'query',
      description: 'Has ep granted claims translation occurred',
      type: 'boolean',
    },
    {
      name: 'claimsTranslationFeesTotal',
      in: 'query',
      description: 'Total for ep granted claims translation',
      type: 'number',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists EPO translation fee',
  summary: 'lists EPO translation fee',
  responses: {
    200: {
      description: 'EPO translation fee',
      schema: {
        $ref: '#/definitions/epo-translation-fee-list',
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
route.get('/lsp/{lspId}/epo/claims-translation-fee', controller.listClaimsTranslationFee, {
  tags: ['EPO'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'epoId',
      in: 'query',
      description: 'The epo patent id',
      type: 'string',
    },
    {
      name: 'claimsWordCount',
      in: 'query',
      description: 'The patent claims word count',
      type: 'string',
    },
    {
      name: 'otherLanguages',
      in: 'query',
      description: 'Other languages for a quote to be translated',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists EPO claims translation fees',
  summary: 'lists EPO claims translation fees',
  responses: {
    200: {
      description: 'EPO translation fees',
      schema: {
        $ref: '#/definitions/epo-claims-translation-fee-list',
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
route.get('/lsp/{lspId}/epo/disclaimer', controller.listDisclaimer, {
  tags: ['EPO'],
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
      name: 'translationOnly',
      in: 'query',
      description: 'Get disclaimers for only translation',
      type: 'boolean',
    },
    ...PAGINATION_PARAMS,
  ],
  description: 'lists EPO disclaimer',
  summary: 'lists EPO discalimer',
  responses: {
    200: {
      description: 'EPO disclaimer',
      schema: {
        $ref: '#/definitions/epo-disclaimer-list',
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

route.post('/lsp/{lspId}/epo/request', controller.createRequest, {
  tags: ['Request', 'Epo'],
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

route.put('/lsp/{lspId}/epo/{requestId}', controller.updateRequest, {
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
      description: 'Request to update',
      required: true,
      schema: {
        $ref: '#/definitions/request-update-input',
      },
    },
  ],
  responses: {
    200: {
      description: 'The updated request',
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

route.definition('epo', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    sourceLanguage: { type: 'string' },
    patentPublicationDate: { type: 'string' },
    patentPublicationNumber: { type: 'string' },
    kind: { type: 'string' },
    descriptionWordCount: { type: 'number' },
    numberOfClaims: { type: 'number' },
    claimWordCount: { type: 'number' },
    title: { type: 'string' },
    validationDeadline: { type: 'string' },
    communicationOfIntentionDate: { type: 'string' },
    statutoryDeadline: { type: 'string' },
    descriptionPageCount: { type: 'number' },
    claimsPageCount: { type: 'number' },
    drawingsPageCount: { type: 'number' },
    applicantName: { type: 'string' },
  },
});

route.definition('epo-country', {
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

route.definition(
  'epo-countries-list',
  customizableList({
    $ref: '#/definitions/epo-country',
  }),
);
route.definition('epo-translation-fee', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    country: {
      type: 'string',
    },
    officialFilingLanguage: {
      type: 'string',
    },
    officialFilingLanguageIsoCode: {
      type: 'string',
    },
    translationRate: {
      type: 'string',
    },
    translationRateFr: {
      type: 'string',
    },
    translationRateDe: {
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
    calculatedFee: {
      type: 'string',
    },
  },
});
route.definition('epo-claims-translation-fee', {
  properties: {
    language: {
      type: 'string',
    },
    calculatedFee: {
      type: 'string',
    },
    officialFee: {
      type: 'string',
    },
    agencyFeeFixed: {
      type: 'string',
    },
    agencyFeeFormula: {
      type: 'string',
    },
  },
});
route.definition(
  'epo-translation-fee-list',
  customizableList(
    { $ref: '#/definitions/epo-translation-fee' },
    epoTranslationFeeExtraDataProps,
  ),
);
route.definition(
  'epo-claims-translation-fee-list',
  customizableList(
    { $ref: '#/definitions/epo-claims-translation-fee' },
    epoTranslationFeeExtraDataProps,
  ),
);
route.definition('epo-disclaimer', {
  properties: {
    _id: {
      type: 'string',
      format: 'uuid',
    },
    country: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    countries: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    codes: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    filingLanguage: {
      type: 'string',
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
  'epo-disclaimer-list',
  customizableList({
    $ref: '#/definitions/epo-disclaimer',
  }),
);
route.definition(
  'ip-currency-list',
  customizableList({
    $ref: '#/definitions/ip-currency',
  }),
);
route.definition(
  'epo-response',
  defineResponse({
    epo: {
      $ref: '#/definitions/epo',
    },
  }),
);
