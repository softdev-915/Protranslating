const Router = require('../../components/application/route');
const { defineResponse } = require('../../components/application/definitions');
const controller = require('./auth-controller');

const route = Router.create();

route.get('/auth/me', controller.currentUser, {
  tags: ['Auth'],
  'x-swagger-security': { roles: [] },
  description: 'Returns the current user',
  summary: 'Returns the current user',
  responses: {
    200: {
      description: 'Successful request.',
      schema: {
        $ref: '#/definitions/user-session',
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

route.post('/auth', controller.login, {
  tags: [
    'Auth',
  ],
  description: 'Initializes login',
  summary: 'Initializes the proper login strategy',
  consumes: ['application/json'],
  parameters: [{
    name: 'data',
    in: 'body',
    description: 'The user\'s credentials',
    required: true,
    schema: {
      $ref: '#/definitions/login-post-input',
    },
  }],
  responses: {
    200: {
      description: 'Successful login',
      schema: {
        $ref: '#/definitions/user-session',
      },
    },
    202: {
      description: 'Password accepted',
    },
    400: {
      description: 'Invalid request',
      schema: {
        $ref: '#/definitions/error',
      },
    },
    401: {
      description: 'Invalid email or password',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.post('/auth/hotp', controller.loginWithHOTP, {
  tags: ['Auth'],
  description: 'Second step of login process for users with 2FA enabled',
  summary: 'Second step of login process for users with 2FA enabled',
  consumes: ['application/json'],
  parameters: [{
    name: 'data',
    in: 'body',
    description: 'The user\'s hotp',
    required: false,
    schema: {
      $ref: '#/definitions/login-hotp-input',
    },
  }],
  responses: {
    200: {
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
      description: 'Invalid HOTP code',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.delete('/auth', controller.logout, {
  tags: [
    'Auth',
  ],
  'x-swagger-security': {
    roles: [],
  },
  description: 'Terminates the user session',
  summary: 'Terminates the user\'s session',
  responses: {
    204: {
      description: 'A successful logout',
    },
    403: {
      description: 'Forbidden',
      schema: {
        $ref: '#/definitions/error',
      },
    },
  },
});

route.options('/auth', null, {
  tags: ['Auth'],
});

route.definition('login-post-input', {
  properties: {
    email: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
    lspId: {
      type: 'string',
    },
  },
  required: ['email', 'password', 'lspId'],
});

route.definition('login-hotp-input', {
  properties: {
    hotp: {
      type: 'string',
    },
  },
  required: ['hotp'],
});

route.definition('user-session', defineResponse({
  csrfToken: {
    type: 'string',
  },
  user: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
      firstName: {
        type: 'string',
      },
      lastName: {
        type: 'string',
      },
      lsp: {
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
      company: {
        type: 'object',
        properties: {
          _id: {
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
        },
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
      timeout: {
        type: 'number',
        description: 'Allowed idle minutes until session expiry',
      },
      sessionUUID: {
        type: 'string',
        description: 'Custom unique identifier for the session',
      },
    },
    required: ['id', 'firstName', 'lastName'],
  },
}));

module.exports = route;
