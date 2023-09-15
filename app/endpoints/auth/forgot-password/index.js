const Router = require('../../../components/application/route');
const defineResponse = require('../../../components/application/definitions').defineResponse;

const route = module.exports = Router.create();

const controller = require('./forgot-password-controller');

route.post('/auth/forgot-password',
  controller.create, {
    tags: [
      'Auth',
    ],
    description: 'Initializes the forgot password mechanism',
    summary: 'Initializes the forgot password mechanism',
    consumes: ['application/json'],
    parameters: [{
      name: 'data',
      in: 'body',
      description: 'The user\'s email and lsp',
      required: true,
      schema: {
        $ref: '#/definitions/forgot-password-input',
      },
    }],
    responses: {
      200: {
        description: 'Successful forgot password',
        schema: {
          $ref: '#/definitions/forgot-password-response',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      401: {
        description: 'Invalid username or password',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.put('/auth/forgot-password/{code}',
  controller.update, {
    tags: [
      'Auth',
    ],
    description: 'Resets the user\'s password',
    summary: 'Resets the user\'s password',
    consumes: ['application/json'],
    parameters: [{
      name: 'code',
      in: 'path',
      description: 'The unique code generated',
      required: true,
      type: 'string',
    }, {
      name: 'data',
      in: 'body',
      description: 'The user\'s new password',
      required: true,
      schema: {
        $ref: '#/definitions/forgot-password-new-password-input',
      },
    }],
    responses: {
      200: {
        description: 'Successful forgot password',
        schema: {
          $ref: '#/definitions/forgot-password-response',
        },
      },
      400: {
        description: 'Invalid request',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      401: {
        description: 'Invalid username or password',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('forgot-password-input', {
  properties: {
    email: {
      type: 'string',
    },
    lspId: {
      type: 'string',
    },
    recaptcha: {
      type: 'string',
    },
  },
  required: ['email', 'lspId', 'recaptcha'],
});

route.definition('forgot-password-new-password-input', {
  properties: {
    password: {
      type: 'string',
    },
    recaptcha: {
      type: 'string',
    },
  },
  required: ['password', 'recaptcha'],
});

route.definition('forgot-password-response', defineResponse({
  message: {
    type: 'string',
  },
}));
