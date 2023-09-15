const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');

const { customizableList } = definitions;
const route = Router.create();

const controller = require('./lsp-controller');

route.get(
  '/lsp/{lspId}',
  controller.lspDetail,

  {
    tags: [
      'Lsp',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['LSP-SETTINGS_UPDATE_OWN', 'LSP-SETTINGS_READ_OWN'] },
      ],
    },
    description: 'Retrieves the current lsp',
    summary: 'Retrieves the current lsp',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The lsp',
        schema: {
          $ref: '#/definitions/lsp',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.put(
  '/lsp/selector',
  controller.list,

  {
    tags: [
      'User',
    ],
    description: 'Retrieves the lsp\'s list for user',
    summary: 'Retrieves the lsp\'s list for user',
    parameters: [{
      name: 'data',
      in: 'body',
      description: 'The user\'s email',
      required: false,
      schema: {
        $ref: '#/definitions/lsp-retrieve-input',
      },
    }],
    responses: {
      200: {
        description: 'The lsp\'s list for user\'s email ',
        schema: {
          $ref: '#/definitions/lsp-list',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  },
);

route.get('/lsp-list/{email}',
  controller.getLspListByEmail, {
    tags: [
      'User',
    ],
    description: 'Retrieves the lsp\'s list for user',
    summary: 'Retrieves the lsp\'s list for user with user\'s email',
    parameters: [{
      name: 'email',
      in: 'path',
      description: 'The user\'s email',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'The lsp\'s list for user\'s email ',
        schema: {
          $ref: '#/definitions/lsp-list',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/lsp/{lspId}/update',
  controller.update, {
    tags: [
      'Lsp',
    ],
    'x-swagger-security': {
      roles: [
        'LSP-SETTINGS_UPDATE_OWN',
      ],
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
      description: 'The lsp to update',
      required: true,
      schema: {
        $ref: '#/definitions/lsp',
      },
    }],
    description: 'Updates an existing lsp',
    summary: 'Updates an existing lsp',
    responses: {
      200: {
        description: 'The updated lsp',
        schema: {
          $ref: '#/definitions/lsp',
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

route.definition('lsp-logo-image', {
  properties: {
    base64Image: {
      type: 'string',
    },
    md5: {
      type: 'string',
    },
  },
});

route.definition('lsp', {
  properties: {
    _id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    emailConnectionString: {
      type: 'string',
    },
    addressInformation: {
      $ref: '#/definitions/address',
    },
    currencyExchangeDetails: {
      type: 'array',
      items: {
        $ref: '#/definitions/lsp-currency-exchange-detail',
      },
    },
    logoImage: {
      $ref: '#/definitions/lsp-logo-image',
    },
    lspAccountingPlatformLocation: {
      type: 'string',
    },
    vendorPaymentPeriodStartDate: {
      type: 'string',
    },
    domain: {
      type: 'string',
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
    pcSettings: {
      $ref: '#/definitions/lsp-pc-settings',
    },
    financialEntityPrefix: {
      type: 'string',
    },
    phoneNumber: {
      type: 'string',
    },
    url: {
      type: 'string',
    },
    taxId: {
      type: 'string',
    },
    fax: {
      type: 'string',
    },
    revenueRecognition: {
      properties: {
        startDate: {
          type: 'string',
        },
        endDate: {
          type: 'string',
        },
      },
    },
    paymentGateway: {
      properties: {
        id: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        key: {
          type: 'string',
        },
        secret: {
          type: 'string',
        },
      },
      required: ['name', 'id', 'key', 'secret'],
    },
    timezone: { type: 'string' },
    officialName: { type: 'string' },
  },
  required: ['name', '_id', 'emailConnectionString', 'timezone'],
});

route.definition('lsp-pc-settings', {
  properties: {
    mtEngine: {
      type: 'string',
      format: 'uuid',
    },
    mtThreshold: {
      type: ['number', 'string'],
    },
    supportedFileFormats: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid',
      },
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

route.definition('lsp-list', customizableList({
  $ref: '#/definitions/lsp',
}));

route.definition('lsp-retrieve-input', {
  properties: {
    email: {
      type: 'string',
    },
    recaptcha: {
      type: 'string',
    },
    lspIds: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['recaptcha'],
});

route.definition('lsp-currency-exchange-detail', {
  properties: {
    base: {
      type: 'string',
    },
    quote: {
      type: 'string',
    },
    quotation: {
      type: 'number',
    },
  },
  required: ['base', 'quote', 'quotation'],
});

module.exports = route;
