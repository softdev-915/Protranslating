const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const customizableList = definitions.customizableList;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const defineResponse = definitions.defineResponse;
const route = (module.exports = Router.create());

const controller = require('./request-controller');

route.get('/lsp/{lspId}/request/export', controller.requestExport, {
  tags: ['Request'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: [
          'REQUEST_READ_OWN',
          'REQUEST_READ_ALL',
          'REQUEST_READ_COMPANY',
          'REQUEST_READ_ASSIGNED-TASK',
        ],
      },
    ],
  },
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'csvHeaders',
      in: 'query',
      description: 'Column filter',
      type: 'array',
      items: {
        type: 'string',
      },
      required: false,
    },
    ...PAGINATION_PARAMS,
  ],
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

route.get('/lsp/{lspId}/request',
  controller.requestList, {
    tags: [
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'REQUEST_READ_OWN',
          'REQUEST_READ_ALL',
          'REQUEST_READ_COMPANY',
          'REQUEST_READ_ASSIGNED-TASK',
        ],
        },
      ],
    },
    description: 'Retrieves the translation request list',
    summary: 'Retrieves the translation request list',
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
    responses: {
      200: {
        description: 'The translation request list',
        schema: {
          $ref: '#/definitions/request-list',
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

route.get('/lsp/{lspId}/request/{requestId}', controller.requestDetail, {
  tags: ['Request'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: [
          'REQUEST_READ_OWN',
          'REQUEST_READ_ALL',
          'REQUEST_READ_COMPANY',
          'REQUEST_READ_ASSIGNED-TASK',
        ],
      },
    ],
  },
  description: "Retrieves the translation request's detail",
  summary: "Retrieves the translation request's detail",
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: "The lsp's id",
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request id',
      type: 'string',
      required: true,
    },
    {
      name: 'withCATData',
      in: 'query',
      description: 'Specifies if a request should be decorated with PortalCat info',
      type: 'boolean',
    },
  ],
  responses: {
    200: {
      description: "The translation request's detail",
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

route.post('/lsp/{lspId}/request', controller.requestCreate, {
  tags: ['Request'],
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
  description: 'Creates a new translation request',
  summary: 'Creates a new translation request',
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

route.put(
  '/lsp/{lspId}/request/{requestId}/quote',
  controller.saveQuoteRequestData,
  {
    tags: ['Request quote data'],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'REQUEST_UPDATE_COMPANY',
            'REQUEST_UPDATE_OWN',
            'REQUEST_UPDATE_ALL',
          ],
        },
      ],
    },
    description: 'Edits a translation request\'s quote data',
    summary: 'Edits a translation request\'s quote data',
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
        name: 'requestId',
        in: 'path',
        description: "The request's id",
        type: 'string',
        required: true,
      },
      {
        name: 'data',
        in: 'body',
        description: 'Quote and email template ids',
        required: true,
        schema: {
          $ref: '#/definitions/request-quote-input',
        },
      },
    ],
    responses: {
      200: {
        description: 'The edited translation request',
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
      404: {
        description: 'Request does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put('/lsp/{lspId}/request/{requestId}', controller.requestEdit, {
  tags: ['Request'],
  'x-swagger-security': {
    roles: [
      {
        oneOf: [
          'REQUEST_UPDATE_COMPANY',
          'REQUEST_UPDATE_OWN',
          'TASK_UPDATE_OWN',
          'REQUEST_UPDATE_ALL',
          'TASK_UPDATE_OWN',
          'TASK-FINAL-FILE_UPDATE_OWN',
        ],
      },
    ],
  },
  description: 'Edits a translation request',
  summary: 'Edits a translation request',
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
      name: 'requestId',
      in: 'path',
      description: "The request's id",
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: "The request's details",
      required: true,
      schema: {
        $ref: '#/definitions/request-update-input',
      },
    },
  ],
  responses: {
    200: {
      description: 'The edited translation request',
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
    404: {
      description: 'Request does not exist',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.post('/lsp/{lspId}/request/{requestId}/portalcat/import', controller.importFilesToPCat, {
  tags: ['Request'],
  'x-swagger-security': {
    roles: [
      'PIPELINE-RUN_UPDATE_ALL',
    ],
  },
  description: 'Run import pipeline for specified files',
  summary: 'Run import pipeline for specified files',
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
      name: 'requestId',
      in: 'path',
      description: "The request's id",
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: "The request's details",
      required: true,
      schema: {
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          workflowCreationStrategy: {
            type: 'string',
            enum: ['CREATE_NEW', 'USE_EXISTING'],
          },
        },
        required: ['files', 'workflowCreationStrategy'],
      },
    },
  ],
  responses: {
    200: {
      description: 'The edited translation request',
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
    404: {
      description: 'Request does not exist',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.put(
  '/lsp/{lspId}/request/{requestId}/approve-quote',
  controller.approveQuote,
  {
    tags: ['Quote approval'],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'],
        },
      ],
    },
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: "The lsp's id",
        type: 'string',
        required: true,
      },
      {
        name: 'requestId',
        in: 'path',
        description: 'The request id',
        type: 'string',
        required: true,
      },
    ],
    description: 'Approve a quote',
    summary: 'Approve a quote',
    responses: {
      200: {
        description: 'Quote has been approved sucessfully',
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
route.put(
  '/lsp/{lspId}/request/{requestId}/calculate-patent-fee',
  controller.calculatePatentFee,
  {
    tags: ['Calculate Patent Fee'],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'],
        },
      ],
    },
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: "The lsp's id",
        type: 'string',
        required: true,
      },
      {
        name: 'requestId',
        in: 'path',
        description: 'The request id',
        type: 'string',
        required: true,
      },
      {
        name: 'translationOnly',
        in: 'query',
        description: 'Translation Only',
        type: 'boolean',
      },
      {
        name: 'data',
        in: 'body',
        description: 'The Patent Counts',
        required: true,
        schema: {
          properties: {
            patentApplicationNumber: {
              type: 'string',
            },
            patentPublicationNumber: {
              type: 'string',
            },
            counts: {
              $ref: '#/definitions/ip-patent-counts',
            },
          },
        },
      },
    ],
    description: 'Calculate patent fee',
    summary: 'Calculate patent fee',
    responses: {
      200: {
        description: 'Patent Fee Calculated',
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
route.put(
  '/lsp/{lspId}/request/{requestId}/force-update-patent-fee',
  controller.forceUpdatePatentFee,
  {
    tags: ['Calculate Patent Fee'],
    'x-swagger-security': {
      roles: [
        {
          oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'],
        },
      ],
    },
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: "The lsp's id",
        type: 'string',
        required: true,
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
        description: 'The Country fee',
        required: true,
        schema: {
          $ref: '#/definitions/patent-force-update-schema',
        },
      },
    ],
    description: 'Force update patent fee',
    summary: 'Force update patent fee',
    responses: {
      200: {
        description: 'Patent Fee Updated',
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

// route.definition('patent-count-schema', {
//   properties: {

//   },
//   required: ['_id', 'name'],
// });

route.definition('patent-force-update-schema', {
  properties: {
    patentApplicationNumber: {
      type: 'string',
    },
    patentPublicationNumber: {
      type: 'string',
    },
    countries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          translationFee: {
            type: 'number',
          },
          agencyFee: {
            type: 'number',
          },
          agencyFeeFixed: {
            type: 'number',
          },
          officialFee: {
            type: 'number',
          },
        },
      },
    },
  },
});
route.definition('provider', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
    terminated: {
      type: 'boolean',
    },
  },
  required: ['_id', 'name'],
});

route.definition('request-language', {
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

route.definition('request-contact', {
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
    email: {
      type: 'string',
    },
    addressName: {
      type: 'string',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
  },
});

route.definition('salesRep', {
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
    email: {
      type: 'string',
    },
    lsp: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
    terminated: {
      type: 'boolean',
    },
  },
});

route.definition('request-language-combination', {
  properties: {
    srcLangs: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-language',
      },
    },
    tgtLangs: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-language',
      },
    },
    documents: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-document',
      },
    },
  },
  required: ['srcLangs', 'tgtLangs'],
});

route.definition('request-document', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isReference: {
      type: 'boolean',
    },
    isInternal: {
      type: 'boolean',
    },
    completed: {
      type: 'boolean',
    },
    final: {
      type: 'boolean',
    },
    isNew: {
      type: 'boolean',
    },
    cloudKey: {
      type: 'string',
      'x-nullable': true,
    },
    md5Hash: {
      type: 'string',
      'x-nullable': true,
    },
    mime: {
      type: 'string',
      'x-nullable': true,
    },
    size: {
      type: 'number',
    },
    encoding: {
      type: 'string',
      'x-nullable': true,
    },
    user: {
      type: 'string',
      'x-nullable': true,
    },
    createdBy: {
      type: 'string',
      'x-nullable': true,
    },
    ip: {
      type: 'string',
      'x-nullable': true,
    },
  },
});

route.definition('request-final-document', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isReference: {
      type: 'boolean',
    },
    isInternal: {
      type: 'boolean',
    },
    srcLang: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    tgtLang: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    cloudKey: {
      type: 'string',
    },
    md5Hash: {
      type: 'string',
      'x-nullable': true,
    },
    mime: {
      type: 'string',
      'x-nullable': true,
    },
    encoding: {
      type: 'string',
      'x-nullable': true,
    },
    size: {
      type: 'number',
      'x-nullable': true,
    },
    user: {
      type: 'string',
      'x-nullable': true,
    },
    createdBy: {
      type: 'string',
      'x-nullable': true,
    },
    ip: {
      type: 'string',
      'x-nullable': true,
    },
  },
});

route.definition('request', {
  properties: {
    _id: {
      type: 'string',
    },
    no: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    turnaroundTime: {
      type: 'string',
    },
    projectManagers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    purchaseOrder: {
      type: 'string',
    },
    sourceDocumentsList: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    requestType: {
      type: 'object',
      $ref: '#/definitions/request-type',
    },
    schedulingStatus: {
      type: 'object',
      $ref: '#/definitions/scheduling-status',
    },
    partners: {
      type: 'object',
      $ref: '#/definitions/id-name-companies',
    },
    insuranceCompany: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    internalDepartment: {
      type: 'object',
      format: '#/definitions/internal-department',
    },
    quoteTemplateId: {
      type: 'string',
    },
    emailTemplateId: {
      type: 'string',
    },
    location: {
      type: 'object',
      format: '#/definitions/id-name-location',
    },
    referenceNumber: {
      type: 'string',
    },
    recipient: {
      type: 'string',
    },
    rooms: {
      type: 'number',
    },
    atendees: {
      type: 'number',
    },
    schedulingCompany: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    schedulingContact: {
      type: 'object',
      $ref: '#/definitions/request-contact',
    },
    expectedStartDate: {
      type: 'string',
    },
    actualDeliveryDate: {
      type: 'string',
    },
    actualStartDate: {
      type: 'string',
    },
    expectedDurationTime: {
      type: 'number',
    },
    isQuoteApproved: {
      type: 'boolean',
    },
    assignmentStatus: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    departmentNotes: {
      type: 'string',
    },
    late: {
      type: 'boolean',
    },
    rush: {
      type: 'boolean',
    },
    complaint: {
      type: 'boolean',
    },
    status: {
      type: 'string',
    },
    quoteDueDate: {
      type: 'string',
      format: 'date-time',
    },
    expectedQuoteCloseDate: {
      type: 'string',
      format: 'date-time',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    companyHierarchy: {
      type: 'string',
    },
    salesRep: {
      type: 'object',
      $ref: '#/definitions/salesRep',
    },
    contact: {
      type: 'object',
      $ref: '#/definitions/request-contact',
    },
    contactEmail: {
      type: 'string',
    },
    languageCombinations: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-language-combination',
      },
    },
    finalDocuments: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-final-document',
      },
    },
    comments: {
      type: 'string',
    },
    softwareRequirements: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/generic-entity',
      },
    },
    documentTypes: {
      type: 'array',
      items: {
        type: 'object',
        $ref: '#/definitions/generic-entity',
      },
    },
    workflows: {
      type: 'array',
      items: {
        $ref: '#/definitions/workflow',
      },
    },
    ipPatent: {
      type: 'object',
      $ref: '#/definitions/ip-patent',
    },
  },
});

route.definition('ip-patent-counts', {
  properties: {
    abstractWordCount: {
      type: 'number',
    },
    drawingsWordCount: {
      type: 'number',
    },
    descriptionWordCount: {
      type: 'number',
    },
    numberOfDrawings: {
      type: 'number',
    },
    claimsWordCount: {
      type: 'number',
    },
    drawingsPageCount: {
      type: 'number',
    },
    descriptionPageCount: {
      type: 'number',
    },
    numberOfClaims: {
      type: 'number',
    },
    specificationWordCount: {
      type: 'number',
    },
  },
});
route.definition('ip-patent', {
  properties: {
    title: {
      type: 'string',
    },
    service: {
      type: 'string',
    },
    database: {
      type: 'string',
    },
    patentApplicationNumber: {
      type: 'string',
    },
    patentPublicationNumber: {
      type: 'string',
    },
    thirtyMonthsDeadline: {
      type: 'string',
      format: 'date-time',
    },
    sourceLanguage: {
      type: 'string',
    },
    applicantName: {
      type: 'string',
    },
    abstractWordCount: {
      type: 'number',
    },
    drawingsWordCount: {
      type: 'number',
    },
    descriptionWordCount: {
      type: 'number',
    },
    numberOfDrawings: {
      type: 'number',
    },
    claimsWordCount: {
      type: 'number',
    },
    drawingsPageCount: {
      type: 'number',
    },
    descriptionPageCount: {
      type: 'number',
    },
    numberOfClaims: {
      type: 'number',
    },
    specificationWordCount: {
      type: 'number',
    },
    filingDeadline: {
      type: 'string',
      format: 'date-time',
    },
    isAnnuityQuotationRequired: {
      type: 'boolean',
    },
    countries: {
      type: 'array',
      items: {
        $ref: '#/definitions/ip-patent-countries',
      },
    },
    claimsTranslationFees: {
      type: 'array',
      items: {
        $ref: '#/definitions/ip-patent-claims-translation-fees',
      },
    },
    total: {
      type: 'number',
    },
    claimsTranslationGranted: {
      type: 'boolean',
    },
    requestedDeliveryDateClaimsTranslation: {
      type: 'string',
    },
    otherLanguages: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-language',
      },
    },
    statutoryDeadline: {
      type: 'string',
    },
    numberOfIndependentClaims: {
      type: 'number',
    },
    totalNumberOfPages: {
      type: 'number',
    },
    numberOfPriorityApplications: {
      type: 'number',
    },
    claimPriority: {
      type: 'boolean',
    },
    disclaimers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    kind: {
      type: 'string',
    },
  },
});

route.definition('ip-patent-countries', {
  properties: {
    name: {
      type: 'string',
    },
    sourceLanguage: {
      type: 'string',
    },
    instantQuote: {
      type: 'boolean',
    },
    officialLanguage: {
      type: 'string',
    },
    translationFee: {
      type: 'number',
    },
    activeEntity: {
      type: 'string',
    },
    agencyFeeFixed: {
      type: 'number',
    },
    officialFee: {
      type: 'number',
    },
    total: {
      type: 'number',
    },
    agencyFee: {
      type: 'number',
    },
    memberState: {
      type: 'boolean',
    },
    extensionState: {
      type: 'boolean',
    },
    validationState: {
      type: 'boolean',
    },
  },
});

route.definition('ip-patent-claims-translation-fees', {
  properties: {
    language: {
      type: 'string',
    },
    calculatedFee: {
      type: 'number',
    },
  },
});

route.definition('request-quote', {
  properties: {
    _id: {
      type: 'string',
    },
    externalId: {
      type: 'string',
    },
    no: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    turnaroundTime: {
      type: 'string',
    },
    projectManagers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    purchaseOrder: {
      type: 'string',
    },
    requestType: {
      type: 'object',
      $ref: '#/definitions/request-type',
    },
    schedulingStatus: {
      type: 'object',
      $ref: '#/definitions/scheduling-status',
    },
    partners: {
      type: 'object',
      $ref: '#/definitions/id-name-companies',
    },
    insuranceCompany: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    internalDepartment: {
      type: 'object',
      format: '#/definitions/internal-department',
    },
    location: {
      type: 'object',
      format: '#/definitions/id-name-location',
    },
    referenceNumber: {
      type: 'string',
    },
    recipient: {
      type: 'string',
    },
    rooms: {
      type: 'number',
    },
    atendees: {
      type: 'number',
    },
    schedulingCompany: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    schedulingContact: {
      type: 'object',
      $ref: '#/definitions/request-contact',
    },
    expectedStartDate: {
      type: 'string',
    },
    actualDeliveryDate: {
      type: 'string',
    },
    actualStartDate: {
      type: 'string',
    },
    expectedDurationTime: {
      type: 'number',
    },
    isQuoteApproved: {
      type: 'boolean',
    },
    assignmentStatus: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    departmentNotes: {
      type: 'string',
    },
    late: {
      type: 'boolean',
    },
    rush: {
      type: 'boolean',
    },
    complaint: {
      type: 'boolean',
    },
    status: {
      type: 'string',
    },
    receptionDate: {
      type: 'string',
    },
    deliveryDate: {
      type: 'string',
    },
    quoteDueDate: {
      type: 'string',
      format: 'date-time',
    },
    expectedQuoteCloseDate: {
      type: 'string',
      format: 'date-time',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/company',
    },
    contact: {
      type: 'object',
      $ref: '#/definitions/request-contact',
    },
    contactEmail: {
      type: 'string',
    },
    comments: {
      type: 'string',
    },
    workflows: {
      type: 'array',
      items: {
        $ref: '#/definitions/workflow',
      },
    },
    invoiceTotal: {
      type: 'number',
    },
    projectedCostTotal: {
      type: 'number',
    },
    billGp: {
      type: 'number',
    },
    projectedCostGp: {
      type: 'number',
    },
    billTotal: {
      type: 'number',
    },
  },
});

route.definition('generic-entity', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
});

route.definition('task', {
  properties: {
    ability: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    invoiceDetails: {
      type: 'array',
      items: {
        $ref: '#/definitions/invoice-detail',
      },
    },
    providerTasks: {
      type: 'array',
      items: {
        $ref: '#/definitions/provider-task',
      },
    },
    updatedBy: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
    minCharge: {
      type: 'number',
    },
  },
});

route.definition('task-quantity', {
  properties: {
    amount: {
      type: 'integer',
    },
    units: {
      type: 'string',
    },
  },
});

route.definition('provider-task', {
  properties: {
    provider: {
      type: 'object',
      $ref: '#/definitions/provider',
    },
    taskDueDate: {
      type: 'string',
      format: 'date-time',
    },
    status: {
      type: 'string',
    },
    files: {
      type: 'array',
      items: {},
    },
    notes: {
      type: 'string',
    },
    quantity: {
      type: 'array',
      items: {
        $ref: '#/definitions/task-quantity',
      },
    },
    ability: {
      type: 'string',
    },
    billDetails: {
      type: 'array',
      items: {
        $ref: '#/definitions/bill-detail',
      },
    },
    minCharge: {
      type: 'number',
    },
    segmentEditTime: {
      type: 'number',
    },
    segmentWordsEdited: {
      type: 'number',
    },
    segmentTTE: {
      type: 'number',
    },
  },
});

route.definition('currency', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isoCode: 'string',
  },
});

route.definition('projected-cost', {
  properties: {
    currency: {
      type: 'object',
      $ref: '#/definitions/currency',
    },
    breakdown: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    translationUnit: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    quantity: {
      type: 'number',
    },
    unitPrice: {
      type: 'number',
    },
    total: {
      type: 'number',
    },
  },
});

route.definition('invoice-detail', {
  properties: {
    pdfPrintable: {
      type: 'boolean',
    },
    currency: {
      type: 'object',
      $ref: '#/definitions/currency',
    },
    breakdown: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    translationUnit: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    quantity: {
      type: 'number',
    },
    unitPrice: {
      type: 'number',
    },
    foreignUnitPrice: {
      type: 'number',
    },
    total: {
      type: 'number',
    },
  },
});

route.definition('bill-detail', {
  properties: {
    currency: {
      type: 'object',
      $ref: '#/definitions/currency',
    },
    breakdown: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    translationUnit: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    quantity: {
      type: 'number',
    },
    unitPrice: {
      type: 'number',
    },
    total: {
      type: 'number',
    },
  },
});

route.definition('invoice-detail', {
  properties: {
    invoice: {
      type: 'object',
      $ref: '#/definitions/invoice',
    },
    projectedCost: {
      type: 'object',
      $ref: '#/definitions/projected-cost',
    },
  },
});

route.definition('invoice', {
  properties: {
    pdfPrintable: {
      type: 'boolean',
    },
    currency: {
      type: 'object',
      $ref: '#/definitions/currency',
    },
    breakdown: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    translationUnit: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    quantity: {
      type: 'number',
    },
    unitPrice: {
      type: 'number',
    },
    total: {
      type: 'number',
    },
  },
});

route.definition('workflow', {
  properties: {
    _id: {
      type: 'string',
    },
    srcLang: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    tgtLang: {
      type: 'object',
      $ref: '#/definitions/request-language',
    },
    workflowDueDate: {
      type: 'string',
      format: 'date-time',
    },
    description: {
      type: 'string',
    },
    subtotal: {
      type: 'number',
    },
    discount: {
      type: 'number',
    },
    tasks: {
      type: 'array',
      items: {
        $ref: '#/definitions/task',
      },
    },
  },
});

route.definition('request-quote-input', {
  properties: {
    quoteTemplateId: {
      type: 'string',
    },
    emailTemplateId: {
      type: 'string',
    },
    quoteCustomFields: {
      type: 'object',
    },
    emailCustomFields: {
      type: 'object',
    },
    serviceTypeId: {
      type: 'string',
    },
    deliveryTypeId: {
      type: 'string',
    },
    hiddenFields: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: [
    'quoteTemplateId',
    'emailTemplateId',
  ],
});

route.definition('request-creation-input', {
  properties: {
    opportunityNo: {
      type: 'string',
    },
    salesRep: {
      type: 'object',
      $ref: '#/definitions/salesRep',
    },
    title: {
      type: 'string',
    },
    requireQuotation: {
      type: 'boolean',
    },
    purchaseOrder: {
      type: 'string',
    },
    turnaroundTime: {
      type: 'string',
    },
    requestType: {
      type: 'object',
      $ref: '#/definitions/request-type',
    },
    dataClassification: {
      type: 'string',
    },
    location: {
      type: 'object',
      format: '#/definitions/id-name-location',
    },
    schedulingStatus: {
      type: 'object',
      $ref: '#/definitions/scheduling-status',
    },
    internalDepartment: {
      type: 'object',
      format: '#/definitions/internal-department',
    },
    referenceNumber: {
      type: 'string',
    },
    memo: {
      type: 'string',
    },
    adjuster: {
      type: 'string',
    },
    recipient: {
      type: 'string',
    },
    rooms: {
      type: 'number',
    },
    atendees: {
      type: 'number',
    },
    expectedStartDate: {
      type: 'string',
    },
    actualDeliveryDate: {
      type: 'string',
    },
    actualStartDate: {
      type: 'string',
    },
    languageCombinations: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-language-combination',
      },
    },
    assignmentStatus: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    departmentNotes: {
      type: 'string',
    },
    late: {
      type: 'boolean',
    },
    rush: {
      type: 'boolean',
    },
    complaint: {
      type: 'boolean',
    },
    expectedDurationTime: {
      type: 'number',
    },
    deliveryDate: {
      type: 'string',
    },
    quoteDueDate: {
      type: 'string',
      format: 'date-time',
    },
    expectedQuoteCloseDate: {
      type: 'string',
      format: 'date-time',
    },
    company: {
      type: 'string',
    },
    companyHierarchy: {
      type: 'string',
    },
    projectManagers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    otherContact: {
      type: 'string',
    },
    otherCC: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    comments: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    serviceDeliveryTypeRequired: {
      type: 'boolean',
    },
    serviceTypeId: {
      type: 'string',
    },
    deliveryTypeId: {
      type: 'string',
    },
  },
  required: [
    'title',
    'requireQuotation',
    'deliveryDate',
    'languageCombinations',
  ],
});

route.definition('request-quote-response', {
  properties: {
    request: {
      type: 'object',
      $ref: '#/definitions/request-quote-response',
    },
    template: {
      type: 'string',
    },
  },
});

route.definition('workflow-totals', {
  properties: {
    projectedCost: {
      type: 'number',
    },
    invoice: {
      type: 'number',
    },
  },
});

route.definition('request-update-input', {
  properties: {
    opportunityNo: {
      type: 'string',
    },
    salesRep: {
      type: 'object',
      $ref: '#/definitions/salesRep',
    },
    title: {
      type: 'string',
    },
    requireQuotation: {
      type: 'boolean',
    },
    purchaseOrder: {
      type: 'string',
    },
    turnaroundTime: {
      type: 'string',
    },
    requestType: {
      type: 'object',
      $ref: '#/definitions/request-type',
    },
    dataClassification: {
      type: 'string',
    },
    schedulingStatus: {
      type: 'object',
      $ref: '#/definitions/scheduling-status',
    },
    location: {
      type: 'object',
      format: '#/definitions/id-name-location',
    },
    partners: {
      type: 'object',
      $ref: '#/definitions/id-name-companies',
    },
    insuranceCompany: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    internalDepartment: {
      type: 'object',
      format: '#/definitions/internal-department',
    },
    languageCombinations: {
      type: 'array',
      items: {
        $ref: '#/definitions/request-language-combination',
      },
    },
    memo: {
      type: 'string',
    },
    adjuster: {
      type: 'string',
    },
    referenceNumber: {
      type: 'string',
    },
    schedulingCompany: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    schedulingContact: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    recipient: {
      type: 'string',
    },
    rooms: {
      type: 'number',
    },
    atendees: {
      type: 'number',
    },
    expectedStartDate: {
      type: 'string',
    },
    actualDeliveryDate: {
      type: 'string',
    },
    actualStartDate: {
      type: 'string',
    },
    assignmentStatus: {
      type: 'object',
      $ref: '#/definitions/id-name-entity',
    },
    departmentNotes: {
      type: 'string',
    },
    late: {
      type: 'boolean',
    },
    rush: {
      type: 'boolean',
    },
    complaint: {
      type: 'boolean',
    },
    expectedDurationTime: {
      type: 'number',
    },
    deliveryDate: {
      type: 'string',
    },
    quoteDueDate: {
      type: 'string',
      format: 'date-time',
    },
    expectedQuoteCloseDate: {
      type: 'string',
      format: 'date-time',
    },
    company: {
      type: 'string',
    },
    projectManagers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    otherContact: {
      type: 'string',
    },
    otherCC: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    comments: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    deliveryMethod: {
      type: 'object',
      $ref: '#/definitions/generic-entity',
    },
    softwareRequirements: {
      type: 'array',
      items: {
        $ref: '#/definitions/generic-entity',
      },
    },
    documentTypes: {
      type: 'array',
      items: {
        $ref: '#/definitions/generic-entity',
      },
    },
    workflows: {
      type: 'array',
      items: {
        $ref: '#/definitions/workflow',
      },
    },
    ipPatent: {
      type: 'object',
      $ref: '#/definitions/ip-patent',
    },
    mockPm: {
      type: 'boolean',
    },
    mockApiFailure: {
      type: 'boolean',
    },
    serviceDeliveryTypeRequired: {
      type: 'boolean',
    },
    serviceTypeId: {
      type: 'string',
    },
    deliveryTypeId: {
      type: 'string',
    },
  },
  required: [
    'title',
    'requireQuotation',
    'deliveryDate',
    'languageCombinations',
    'comments',
  ],
});

route.definition(
  'request-list',
  customizableList({
    $ref: '#/definitions/request',
  }),
);

route.definition(
  'request-response',
  defineResponse({
    request: {
      $ref: '#/definitions/request',
    },
    isUserIpAllowed: {
      type: 'boolean',
    },
  }),
);
