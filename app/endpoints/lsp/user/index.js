const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { customizableList } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const { defineResponse } = definitions;
const route = Router.create();

module.exports = route;

const controller = require('./user-controller');

route.put(
  '/lsp/{lspId}/user/timezone',
  controller.updateTimezone,

  {
    tags: [
      'Timezone',
    ],
    'x-swagger-security': {
      roles: [],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      description: 'Data to save',
      required: true,
      schema: {
        $ref: '#/definitions/timezone',
      },
    }],
    description: 'Saves the timezone for a current user',
    summary: 'Saves the timezone for a current user',
    responses: {
      200: {
        description: 'Successful update',
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
        description: 'Not Found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put(
  '/lsp/{lspId}/user/{userId}/image',
  controller.updateProfileImage,

  {
    tags: [
      'User image',
    ],
    description: 'Sets the user profile image',
    summary: 'Sets the user profile image',
    consumes: ['application/json'],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'The user\'s profile image in base64 format',
      schema: {
        $ref: '#/definitions/user-image',
      },
      required: true,
    }],
    responses: {
      200: {
        description: 'User profile image was stored',
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
        description: 'User does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      409: {
        description: 'Concurrency conflict.',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get(
  '/lsp/{lspId}/user/average-vendor-rate',
  controller.averageVendorRate,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'WORKFLOW_READ_ALL',
            'TASK-FINANCIAL_READ_ALL',
            'PROJECTED-RATE_READ_ALL',
          ],
        },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'breakdown',
      in: 'query',
      description: 'The breakdown',
      type: 'string',
    },
    {
      name: 'catTool',
      in: 'query',
      description: 'The cat tool',
      type: 'string',
    },
    {
      name: 'internalDepartment',
      in: 'query',
      description: 'The internal department',
      type: 'string',
    },
    {
      name: 'translationUnit',
      in: 'query',
      description: 'The translation unit',
      type: 'string',
    },
    {
      name: 'sourceLanguage',
      in: 'query',
      description: 'The source language',
      type: 'string',
    },
    {
      name: 'targetLanguage',
      in: 'query',
      description: 'The target language',
      type: 'string',
    },
    {
      name: 'ability',
      in: 'query',
      description: 'The ability',
      type: 'string',
    },
    ],
    description: 'Returns the average rate of vendor users that matches a defined criteria',
    summary: 'Returns the average rate of vendor users that matches a defined criteria',
    responses: {
      200: {
        description: 'The average price',
        schema: {
          $ref: '#/definitions/average-vendor-rate-response',
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
  '/lsp/{lspId}/user/export',
  controller.userExport,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [],
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
  },
);

route.get(
  '/lsp/{lspId}/user/provider',
  controller.providerList,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        {
          oneOf: [
            'USER_READ_ALL',
            'WORKFLOW_READ_OWN',
            'WORKFLOW_READ_ALL',
            'TASK_READ_ALL',
            'TASK_READ_OWN',
            'PROVIDER-USER_READ_ALL',
            'PM-USER_READ_ALL',
          ],
        },
      ],
    },
    description: 'Retrieves the account\'s providers',
    summary: 'Retrieves the account\'s providers',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: '_id',
      in: 'query',
      description: 'Provider Id',
      type: 'string',
      required: false,
    }, {
      name: 'excludedProvidersAreExcluded',
      in: 'query',
      description: 'Flag to filter out the excluded providers',
      type: 'boolean',
      required: false,
    }, {
      name: 'name',
      in: 'query',
      description: 'Provider name',
      type: 'string',
      maximum: 50,
      required: false,
    }, {
      name: 'ability',
      in: 'query',
      description: 'Ability name',
      type: 'string',
      required: false,
    }, {
      name: 'language',
      in: 'query',
      description: 'Language combination string',
      type: 'string',
      required: false,
    }, {
      name: 'sourceLanguage',
      in: 'query',
      description: 'Source language id',
      type: 'string',
      required: false,
    }, {
      name: 'targetLanguage',
      in: 'query',
      description: 'Target language id',
      type: 'string',
      required: false,
    }, {
      name: 'company',
      in: 'query',
      description: 'Company filter that only applies to contacts',
      type: 'string',
      required: false,
    }, {
      name: 'schedulingCompany',
      in: 'query',
      description: 'Scheduling company filter that only applies to contacts',
      type: 'string',
      required: false,
    }, {
      name: 'type',
      in: 'query',
      description: 'User type separated by comma, example: "Contact,Vendor,Staff"',
      type: 'string',
      maximum: 20,
      required: false,
    }, {
      name: 'catTool',
      in: 'query',
      description: 'Cat tool name',
      type: 'string',
    }, {
      name: 'competenceLevels',
      in: 'query',
      description: 'Competence levels list separated by comma, example: "id1, id2',
      type: 'string',
    }, {
      name: 'terminated',
      in: 'query',
      description: 'Terminated user',
      type: 'boolean',
    }, {
      name: 'isSynced',
      in: 'query',
      description: 'isSynced user',
      type: 'string',
    }, {
      name: 'deleted',
      in: 'query',
      description: 'Deleted user',
      type: 'boolean',
    }, {
      name: 'limit',
      in: 'query',
      description: 'Max number of results',
      type: 'integer',
      minimum: 1,
      maximum: 20,
    }, {
      name: 'skip',
      in: 'query',
      description: 'Offset of results',
      type: 'integer',
      minimum: 0,
    }],
    responses: {
      200: {
        description: 'Provider List',
        schema: {
          $ref: '#/definitions/provider-list',
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

route.put(
  '/lsp/{lspId}/user/ui-settings',
  controller.userEditUiSettings,

  {
    tags: [
      'User UI settings',
    ],
    description: 'Edits an existing user UI settings',
    summary: 'Edits an existing user UI settings',
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
      description: 'The user\'s UI settings',
      required: true,
      schema: {
        $ref: '#/definitions/user-ui-settings',
      },
    }],
    responses: {
      200: {
        description: 'User UI Settings edited',
        schema: {
          $ref: '#/definitions/user-ui-settings',
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
        description: 'User does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      409: {
        description: 'Concurrency conflict.',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put('/lsp/{lspId}/user/password', controller.changePassword, {
  tags: [
    'User',
  ],
  'x-swagger-security': {
    roles: [],
  },
  description: 'Changes the current user\'s password',
  summary: 'Changes the current user\'s password',
  consumes: ['application/json'],
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  },
  {
    name: 'data',
    in: 'body',
    description: 'The user\'s email',
    required: true,
    schema: {
      $ref: '#/definitions/login-change-password-input',
    },
  }],
  responses: {
    201: {
      description: 'Successful login',
      schema: {
        $ref: '#/definitions/user-session',
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
  },
});

route.definition('user-field-mock', {
  properties: {
    name: {
      type: 'string',
    },
    value: {
      type: 'string',
    },
  },
});

route.definition('login-change-password-input', {
  properties: {
    password: {
      type: 'string',
    },
    newPassword: {
      type: 'string',
    },
    repeatPassword: {
      type: 'string',
    },
  },
  required: ['password', 'newPassword', 'repeatPassword'],
});

route.get(
  '/lsp/{lspId}/user/2fa-data-url',
  controller.retrieve2FADataURL,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [],
    },
    description: 'Retrieves the Qr Code for 2FA',
    summary: 'Generates HMAC-Based One-Time Password and turns it into QR Code',
    consumes: ['application/json'],
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Data url of the Qr Code',
        schema: {
          $ref: '#/definitions/2fa-data-url-response',
        },
      },
      403: {
        description: 'Two-Factor Authentication is not avalable for this user',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.definition('2fa-data-url-response', {
  properties: {
    dataURL: {
      type: 'string',
    },
  },
});

route.post(
  '/lsp/{lspId}/user/2fa-setup',
  controller.toggle2FAState,

  {
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'action',
        in: 'query',
        description: 'Action to be proceeded',
        type: 'string',
        required: true,
        enum: ['enable', 'disable'],
      },
      {
        name: 'credentials',
        in: 'body',
        description: 'Code to verify generated HOTP',
        schema: {
          $ref: '#/definitions/2fa-setup-request-entity',
        },
      },
    ],
    responses: {
      200: {
        description: 'Two-Factor Authetification successfully enabled',
      },
      401: {
        description: 'Verification error',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get(
  '/lsp/{lspId}/user/vendor-dashboard',
  controller.retrieveVendorDashboardData,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['VENDOR-DASHBOARD_READ_OWN', 'VENDOR-DASHBOARD-FILTER_READ_OWN'] },
      ],
    },
    description: 'Retrieves vendor dashboard data',
    summary: 'Retrieves vendor dashboard data',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'dateFilterTotalAmountPosted',
      in: 'query',
      description: 'Date filter for total amount posted',
      type: 'string',
      required: true,
    }, {
      name: 'dateFilterTotalAmountPaid',
      in: 'query',
      description: 'Date filter for total amount paid',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Vendor dashboard data',
        schema: {
          $ref: '#/definitions/vendor-dashboard-data',
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
  '/lsp/{lspId}/user/request-kpi',
  controller.getRequestKpiData,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'] },
      ],
    },
    description: 'Retrieves request KPI data for contact',
    summary: 'Retrieves request KPI data for contact',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Request KPI data for contact',
        schema: {
          $ref: '#/definitions/request-kpi-data',
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
  '/lsp/{lspId}/user/invoice-kpi',
  controller.getInvoiceKpiData,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'] },
      ],
    },
    description: 'Retrieves invoice KPI data for contact',
    summary: 'Retrieves invoice KPI data for contact',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'datePeriod',
        in: 'query',
        description: 'Date period',
        type: 'string',
        required: true,
      },
      {
        name: 'page',
        in: 'query',
        description: 'Page number',
        type: 'integer',
        required: false,
      },
      {
        name: 'limit',
        in: 'query',
        description: 'Amount of results to display per page',
        type: 'integer',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Invoice KPI data for contact',
        schema: {
          $ref: '#/definitions/invoice-kpi-data',
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
  '/lsp/{lspId}/user/language-kpi',
  controller.getLanguageKpiData,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'] },
      ],
    },
    description: 'Retrieves language KPI data for contact',
    summary: 'Retrieves language KPI data for contact',
    parameters: [
      {
        name: 'lspId',
        in: 'path',
        description: 'The lsp\'s id',
        type: 'string',
        required: true,
      },
      {
        name: 'sourceLanguage',
        in: 'query',
        description: 'The source language',
        type: 'string',
        required: true,
      },
      {
        name: 'targetLanguage',
        in: 'query',
        description: 'The target language',
        type: 'string',
        required: true,
      },
      {
        name: 'datePeriod',
        in: 'query',
        description: 'Date period',
        type: 'string',
        required: true,
      },
      {
        name: 'page',
        in: 'query',
        description: 'Page number',
        type: 'integer',
        required: false,
      },
      {
        name: 'limit',
        in: 'query',
        description: 'Amount of results to display per page',
        type: 'integer',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Language KPI data for contact',
        schema: {
          $ref: '#/definitions/language-kpi-data',
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
  '/lsp/{lspId}/user/email/{email}',
  controller.getUserIdByEmail,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['USER_CREATE_ALL', 'USER_UPDATE_ALL'] },
      ],
    },
    description: 'Gets a user ID by user email',
    summary: 'Returns a user ID based on user email',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'email',
      in: 'path',
      description: 'The email to be used for getting the user ID',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'User with email already exists in the database',
        schema: {
          $ref: '#/definitions/user-email-response',
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
        description: 'User Not Found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get(
  '/lsp/{lspId}/user/{userId}',
  controller.userList,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    description: 'Retrieves the account\'s users',
    summary: 'Retrieves the account\'s users',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'type',
      in: 'query',
      description: 'The user type',
      type: 'string',
      enum: ['Contact', 'Staff', 'Vendor'],
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The account\'s user list ',
        schema: {
          $ref: '#/definitions/user-response',
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
  '/lsp/{lspId}/user/{userId}/vendor-rates',
  controller.getVendorRates,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: ['VENDOR-RATES_READ_ALL'],
    },
    description: 'Retrieves the rates of vendor',
    summary: 'Retrieves the rates of a vendor',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'shouldDropDrafts',
      in: 'query',
      description: 'Wether to return only unique rates',
      type: 'boolean',
    }],
    responses: {
      200: {
        description: 'The rates for vendor',
        schema: {
          $ref: '#/definitions/vendor-rates',
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
  '/lsp/{lspId}/user/{userId}/duplicated-vendor-rates',
  controller.getDuplicatedVendorRates,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: ['VENDOR-RATES_READ_ALL'],
    },
    description: 'Retrieves duplicate rates of vendor',
    summary: 'Retrieves duplicate rates of a vendor',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The duplicated rates of vendor',
        schema: {
          $ref: '#/definitions/vendor-rates',
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

route.post(
  '/lsp/{lspId}/user/{userId}/test-rate-is-duplicate',
  controller.testRateIsDuplicate,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: ['VENDOR-RATES_READ_ALL'],
    },
    description: 'Tests rate (not saved yet) with saved vendor rates',
    summary: 'Tests rate (not saved yet) with saved vendor rates to find out if it is a duplicate',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'rate',
      in: 'body',
      description: 'Vendor rate to be tested against saved rates',
      schema: {
        $ref: '#/definitions/user-rate',
      },
    }],
    responses: {
      200: {
        description: 'Where or not the rate is a duplicate',
        schema: {
          $ref: '#/definitions/rate-duplicate-response',
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

route.put(
  '/lsp/{lspId}/user/{userId}/vendor-rate',
  controller.saveVendorRate,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['VENDOR-RATES_CREATE_ALL', 'VENDOR-RATES_UPDATE_ALL'],
      }],
    },
    description: 'Saves new or existing vendor rate',
    summary: 'Saves new or existing vendor rate',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'rate',
      in: 'body',
      description: 'Vendor rate to be created or updated',
      schema: {
        $ref: '#/definitions/user-rate',
      },
    }],
    responses: {
      200: {
        description: 'Saved vendor rate',
        schema: {
          $ref: '#/definitions/user-rate',
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

route.put(
  '/lsp/{lspId}/user/{userId}/draft-vendor-rate',
  controller.draftVendorRate,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['VENDOR-RATES_CREATE_ALL', 'VENDOR-RATES_UPDATE_ALL'],
      }],
    },
    description: 'Drafts new or existing vendor rate',
    summary: 'Drafts new or existing vendor rate',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'rate',
      in: 'body',
      description: 'Vendor rate to be drafted',
      schema: {
        $ref: '#/definitions/user-rate',
      },
    }],
    responses: {
      200: {
        description: 'Drafted vendor rate',
        schema: {
          $ref: '#/definitions/user-rate',
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

route.put(
  '/lsp/{lspId}/user/{userId}/paste-vendor-rates',
  controller.pasteVendorRates,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['VENDOR-RATES_CREATE_ALL', 'VENDOR-RATES_UPDATE_ALL'],
      }],
    },
    description: 'Pastes new rates',
    summary: 'Pastes new rates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'rates',
      in: 'body',
      description: 'Vendor rates to be pasted',
      schema: {
        $ref: '#/definitions/vendor-rates',
      },
    }],
    responses: {
      200: {
        description: 'Vendor rates',
        schema: {
          $ref: '#/definitions/vendor-rates',
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

route.put(
  '/lsp/{lspId}/user/{userId}/delete-vendor-rates',
  controller.deleteVendorRates,

  {
    tags: ['User'],
    'x-swagger-security': {
      roles: [{
        oneOf: ['VENDOR-RATES_UPDATE_ALL'],
      }],
    },
    description: 'Deletes new rates',
    summary: 'Deletes new rates',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'rates',
      in: 'body',
      description: 'Vendor rates\' ids to be deleted',
      schema: {
        $ref: '#/definitions/vendor-rates-ids',
      },
    }],
    responses: {
      200: {
        description: 'Vendor rates',
        schema: {
          $ref: '#/definitions/vendor-rates',
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
  '/lsp/{lspId}/user',
  controller.userList,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['WORKFLOW_READ_OWN', 'USER_READ_ALL'] },
      ],
    },
    description: 'Retrieves the user list',
    summary: 'Retrieves the user list',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'type',
      in: 'query',
      description: 'The user type',
      type: 'string',
      enum: ['Contact', 'Staff', 'Vendor'],
    }, {
      name: 'userId',
      in: 'query',
      description: 'User id',
      type: 'string',
    }, {
      name: 'aggregate',
      in: 'query',
      description: 'Whether to performs aggregate or not',
      type: 'boolean',
    }, {
      name: 'informalType',
      in: 'query',
      description: 'The informal user type. Only works with aggregate false',
      type: 'string',
    }, {
      name: 'withDeleted',
      in: 'query',
      description: 'Whether to query deleted users or not. Only works with aggregate false',
      type: 'boolean',
    }, {
      name: 'attributes',
      in: 'query',
      description: 'The attributes to return from a user. Only works with aggregate false',
      type: 'string',
    }, {
      name: 'columns',
      description: 'Columns to retrieve',
      in: 'query',
      type: 'string',
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The account\'s user list ',
        schema: {
          $ref: '#/definitions/user-list',
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

route.post(
  '/lsp/{lspId}/user',
  controller.userCreate,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['USER_CREATE_ALL', 'CONTACT_CREATE_ALL', 'STAFF_CREATE_ALL'] },
      ],
    },
    description: 'Creates a new user',
    summary: 'Creates a new user',
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
      description: 'The user\'s details',
      required: true,
      schema: {
        $ref: '#/definitions/user',
      },
    }],
    responses: {
      200: {
        description: 'The newly user created',
        schema: {
          $ref: '#/definitions/user-response',
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
      409: {
        description: 'The user already exists',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put(
  '/lsp/{lspId}/user',
  controller.userEdit,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['USER_UPDATE_ALL', 'CONTACT_UPDATE_ALL', 'STAFF_CREATE_ALL', 'USER_UPDATE_COMPANY'] },
      ],
    },
    description: 'Edits an existing user',
    summary: 'Edits an existing user',
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
      description: 'The user\'s details',
      required: true,
      schema: {
        $ref: '#/definitions/user',
      },
    }],
    responses: {
      200: {
        description: 'User edited',
        schema: {
          $ref: '#/definitions/user-response',
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
        description: 'User does not exist',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      409: {
        description: 'The user was properly edited but the password could not be changed.',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get(
  '/lsp/{lspId}/user/{userId}/document/{documentId}/filename/{filename}',
  controller.serveFile,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    description: 'Retrieves the account\'s users',
    summary: 'Retrieves the account\'s users',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'filename',
      in: 'path',
      description: 'The document\'s filename',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The file\'s content',
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
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.post(
  '/lsp/{lspId}/user/{userId}/document/{documentId}/filename/{filename}',
  controller.serveFile,

  {
    tags: [
      'User',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    description: 'Retrieves the account\'s users',
    summary: 'Retrieves the account\'s users',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'userId',
      in: 'path',
      description: 'The user\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'documentId',
      in: 'path',
      description: 'The document\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'filename',
      in: 'path',
      description: 'The document\'s filename',
      type: 'string',
      required: true,
    }, ...PAGINATION_PARAMS],
    responses: {
      200: {
        description: 'The file\'s content',
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

route.get(
  '/lsp/{lspId}/user/{userId}/documents/zip',
  controller.serveFilesZip,

  {
    tags: [
      'Request',
    ],
    'x-swagger-security': {
      roles: [
        'USER_READ_ALL',
      ],
    },
    produces: ['application/zip'],
    description: 'Serves all the user\'s documents as a zip file',
    summary: 'Serves all the user\'s documents as a zip file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    }, {
      name: 'userId',
      in: 'path',
      description: 'The user id',
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
        description: 'The zip file containing all the user\'s documents',
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

route.definition('login-change-password-input', {
  properties: {
    password: {
      type: 'string',
    },
    newPassword: {
      type: 'string',
    },
    repeatPassword: {
      type: 'string',
    },
  },
  required: ['password', 'newPassword', 'repeatPassword'],
});

route.definition('user', {
  properties: {
    mockData: {
      type: 'array',
      items: {
        $ref: '#/definitions/user-field-mock',
      },
    },
    _id: {
      type: 'string',
    },
    oldEmail: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    middleName: {
      type: 'string',
    },
    secondaryEmail: {
      type: 'string',
    },
    inactiveSecondaryEmailNotifications: {
      type: 'boolean',
    },
    lastName: {
      type: 'string',
    },
    company: {
      type: 'string',
    },
    roles: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    groups: {
      type: 'array',
      items: {
        $ref: '#/definitions/group',
      },
    },
    type: {
      type: 'string',
    },
    projectManagers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    abilities: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    languageCombinations: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    catTools: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    deleted: {
      type: 'boolean',
    },
    forcePasswordChange: {
      type: 'boolean',
    },
    securityPolicy: {
      type: 'object',
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
    },
  },
  required: ['firstName', 'lastName', 'roles', 'groups', 'type'],
});

route.definition('user-extended', {
  properties: {
    _id: {
      type: 'string',
    },
    oldEmail: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    middleName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    secondaryEmail: {
      type: 'string',
    },
    inactiveSecondaryEmailNotifications: {
      type: 'boolean',
    },
    company: {
      type: 'string',
    },
    roles: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    groups: {
      type: 'array',
      items: {
        $ref: '#/definitions/group',
      },
    },
    type: {
      type: 'string',
    },
    projectManagers: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    abilities: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    languageCombinations: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    catTools: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    staffDetails: {
      type: 'object',
      properties: {
        outlier: {
          type: 'boolean',
        },
        competenceLevels: {
          type: 'string',
        },
        internalDepartment: {
          type: 'array',
          items: {
            $ref: '#/definitions/internal-department',
          },
        },
        remote: {
          type: 'boolean',
        },
        phoneNumber: {
          type: 'string',
        },
        jobTitle: {
          type: 'string',
        },
        approvalMethod: {
          type: 'string',
        },
        hireDate: {
          type: 'string',
          format: 'date-time',
        },
        ofac: {
          type: 'string',
        },
        comments: {
          type: 'string',
        },
        rates: {
          type: 'array',
          items: {
            $ref: '#/definitions/user-rate',
          },
        },
        hiringDocuments: {
          type: 'array',
          items: {
            $ref: '#/definitions/user-hiring-document',
          },
        },
      },
    },
    vendorDetails: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        outlier: {
          type: 'boolean',
        },
        competenceLevels: {
          type: 'string',
        },
        remote: {
          type: 'boolean',
        },
        phoneNumber: {
          type: 'string',
        },
        jobTitle: {
          type: 'string',
        },
        approvalMethod: {
          type: 'string',
        },
        hireDate: {
          type: 'string',
          format: 'date-time',
        },
        ofac: {
          type: 'string',
        },
        comments: {
          type: 'string',
        },
        rates: {
          type: 'array',
          items: {
            $ref: '#/definitions/user-rate',
          },
        },
        hiringDocuments: {
          type: 'array',
          items: {
            $ref: '#/definitions/user-hiring-document',
          },
        },
      },
    },
    uiSettings: {
      type: 'object',
      $ref: '#/definitions/user-ui-settings',
    },
    contactDetails: {
      type: 'object',
      properties: {
        linkedInUrl: {
          type: 'string',
        },
        salesRep: {
          type: 'string',
          format: 'uuid',
        },
        mainPhoneNumber: {
          $ref: '#/definitions/mainPhoneNumber',
        },
        officePhone: {
          type: 'string',
        },
        mobilePhone: {
          type: 'string',
        },
        homePhone: {
          type: 'string',
        },
        companyTierLevel: {
          type: 'string',
          enum: ['1', '2', '3', 'Lead-No Language Need'],
        },
        jobTitle: {
          type: 'string',
        },
        qualificationStatus: {
          type: 'string',
          enum: ['Contacting', 'Identifying', 'Lost', 'No Current Need', 'Won'],
        },
        leadSource: {
          type: 'string',
          format: 'uuid',
        },
        mailingAddress: {
          $ref: '#/definitions/address',
        },
        billingAddress: {
          $ref: '#/definitions/billing-address',
        },
        billingEmail: {
          type: 'string',
        },
      },
      required: ['billingEmail'],
    },
    inactiveNotifications: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    isLocked: {
      type: 'boolean',
    },
    isApiUser: {
      type: 'boolean',
    },
    terminated: {
      type: 'boolean',
    },
    terminatedBy: {
      type: 'string',
    },
    terminatedAt: {
      type: 'string',
      format: 'date',
    },
    deleted: {
      type: 'boolean',
    },
    updatedBy: {
      type: 'string',
    },
    createdBy: {
      type: 'string',
    },
    deletedBy: {
      type: 'string',
    },
    restoredBy: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
      format: 'date',
    },
    updatedAt: {
      type: 'string',
      format: 'date',
    },
    deletedAt: {
      type: 'string',
      format: 'date',
    },
    restoredAt: {
      type: 'string',
      format: 'date',
    },
    lastLoginAt: {
      type: 'string',
      format: 'date',
    },
    passwordChangeDate: {
      type: 'string',
      format: 'date',
    },
  },
  required: ['firstName', 'lastName', 'roles', 'groups', 'type'],
});

route.definition('mainPhoneNumber', {
  properties: {
    number: {
      type: 'string',
    },
    ext: {
      type: 'string',
    },
  },
});

route.definition('cat-ui-settings', {
  properties: {
    inlineUserTags: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
        },
      },
    },
    inlineSystemTags: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
        },
      },
    },
    qaErrorMessages: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
        },
      },
    },
    qaWarningMessages: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
        },
      },
    },
  },
});

route.definition('user-ui-settings', {
  properties: {
    uiSettings: {
      type: 'object',
      $ref: '#/definitions/cat-ui-settings',
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

route.definition('billing-address', {
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
  required: ['line1', 'city', 'country', 'zip'],
});

route.definition('provider', {
  properties: {
    _id: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    middleName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    abilities: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    languageCombinations: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    catTools: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    deleted: {
      type: 'boolean',
    },
  },
});

route.definition('user-rate', {
  properties: {
    _id: {
      type: 'string',
    },
    sourceLanguage: {
      type: 'object',
      $ref: '#/definitions/rate-language',
    },
    targetLanguage: {
      type: 'object',
      $ref: '#/definitions/rate-language',
    },
    ability: {
      type: 'object',
      $ref: '#/definitions/rate-generic-entity',
    },
    company: {
      type: 'object',
      $ref: '#/definitions/rate-generic-entity',
    },
    catTool: {
      type: 'string',
    },
    isDrafted: {
      type: 'boolean',
    },
    internalDepartment: {
      type: 'object',
      $ref: '#/definitions/rate-generic-entity',
    },
    rateDetails: {
      type: 'array',
      items: {
        $ref: '#/definitions/user-rate-detail',
      },
    },
  },
  required: ['ability', 'rateDetails'],
});

route.definition('user-rate-detail', {
  properties: {
    price: {
      type: 'number',
    },
    breakdown: {
      type: 'object',
      $ref: '#/definitions/rate-generic-entity',
    },
    currency: {
      type: 'object',
      $ref: '#/definitions/rate-generic-entity',
    },
    translationUnit: {
      type: 'object',
      $ref: '#/definitions/rate-generic-entity',
    },
  },
  required: ['currency', 'price'],
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

route.definition('user-hiring-document', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    fileType: {
      type: 'string',
    },
    uploadDate: {
      type: 'string',
      format: 'date-time',
    },
    isNew: {
      type: 'boolean',
    },
  },
  required: ['_id'],
});

route.definition('internal-department', {
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
  },
  required: ['name'],
});

route.definition('provider-list', customizableList({
  $ref: '#/definitions/provider',
}));

route.definition('user-list', customizableList({
  $ref: '#/definitions/user-extended',
}));

route.definition('user-response', defineResponse({
  user: {
    $ref: '#/definitions/user',
  },
}));

route.definition('user-lsp-selected', {
  properties: {
    _id: {
      type: 'string',
    },
    firstName: {
      type: 'string',
    },
    middleName: {
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
    isLocked: {
      type: 'boolean',
    },
    isApiUser: {
      type: 'boolean',
    },
    terminated: {
      type: 'boolean',
    },
    inactiveNotifications: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    type: {
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
  required: ['name', 'code'],
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

route.definition('rate-language', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
  },
});

route.definition('rate-generic-entity', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
});

route.definition('average-vendor-rate-response', {
  properties: {
    averageVendorRate: {
      type: 'number',
    },
  },
});

route.definition('user-image', {
  properties: {
    image: {
      type: 'string',
    },
  },
});

route.definition('2fa-setup-request-entity', {
  properties: {
    hotp: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
  },
  required: ['email'],
});

route.definition('vendor-rates', defineResponse({
  rates: {
    type: 'array',
    items: {
      $ref: '#/definitions/user-rate',
    },
  },
}));

route.definition('vendor-rates-ids', defineResponse({
  rates: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
}));

route.definition('vendor-dashboard-data', {
  properties: {
    currentTasksCount: {
      type: 'number',
    },
    futureTasksCount: {
      type: 'number',
    },
    pendingTasksCount: {
      type: 'number',
    },
    totalTasksCount: {
      type: 'number',
    },
    totalVendorBalance: {
      type: 'number',
    },
    totalAmountPosted: {
      type: 'number',
    },
    totalAmountPaid: {
      type: 'number',
    },
  },
});

route.definition('request-kpi-data', {
  type: 'object',
  properties: {
    requestsToBeProcessed: {
      type: 'number',
    },
    requestsInProgress: {
      type: 'number',
    },
    requestsWaitingForQuote: {
      type: 'number',
    },
    requestsWaitingForApproval: {
      type: 'number',
    },
  },
});

route.definition('invoice-kpi-data', {
  type: 'array',
  items: {
    $ref: '#/definitions/invoices-kpi-row',
  },
});

route.definition('invoices-kpi-row', {
  properties: {
    currency: {
      type: 'string',
    },
    companyHierarchy: {
      type: 'string',
    },
    companyName: {
      type: 'string',
    },
    totalInvoices: {
      type: 'number',
    },
    totalPaidInvoices: {
      type: 'number',
    },
    totalPartiallyPaidInvoices: {
      type: 'number',
    },
    totalBalance: {
      type: 'number',
    },
  },
});

route.definition('language-kpi-data', {
  type: 'array',
  items: {
    $ref: '#/definitions/languages-kpi-row',
  },
});

route.definition('languages-kpi-row', {
  type: 'object',
  properties: {
    companyHierarchy: {
      type: 'string',
    },
    companyName: {
      type: 'string',
    },
    requestNo: {
      type: 'string',
    },
    projectManagers: {
      type: 'string',
    },
    requestInvoiceStatus: {
      type: 'string',
    },
    totalAmountSpentPerLang: {
      type: 'string',
    },
    currency: {
      type: 'string',
    },
  },
});

route.definition('user-email-response', defineResponse({
  userId: {
    type: 'string',
  },
}));

route.definition('rate-duplicate-response', defineResponse({
  isDuplicate: {
    type: 'boolean',
  },
}));

route.definition('timezone', {
  properties: {
    timezone: {
      type: 'string',
    },
  },
});
