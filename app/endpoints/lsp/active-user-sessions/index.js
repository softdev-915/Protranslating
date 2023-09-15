const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./active-user-sessions-controller');

const { customizableList } = definitions;
const PAGINATION_PARAMS = definitions.swaggerPaginationParams;
const router = Router.create();

router.get('/lsp/{lspId}/active-user-sessions', controller.activeUserSessionsList, {
  tags: ['ActiveUserSessions'],
  'x-swagger-security': { roles: ['ACTIVE-USER-SESSION_READ_ALL'] },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, ...PAGINATION_PARAMS],
  description: 'Retrieves all the active user sessions',
  summary: 'Retrieves all the active user sessions',
  responses: {
    200: {
      description: 'The active user sessions',
      schema: {
        $ref: '#/definitions/active-user-sessions-list',
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

router.definition('active-user-sessions-list', customizableList({
  $ref: '#/definitions/active-user-sessions',
}));

router.definition('active-user-sessions', {
  properties: {
    _id: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    loggedAt: {
      type: 'string',
      format: 'date',
    },
    originIP: {
      type: 'string',
      format: 'date',
    },
    cookie: {
      type: 'string',
    },
    sessionId: {
      type: 'string',
    },
    sessionUpdatedAt: {
      type: 'string',
      format: 'date',
    },
    timeZone: {
      type: 'string',
    },
    userAgent: {
      type: 'string',
    },
  },
});

module.exports = router;
