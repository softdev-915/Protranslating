const Router = require('../../components/application/route');
const controller = require('./version-controller');

const route = Router.create();

route.get('/version', controller.version, {
  tags: ['Version'],
  description: 'Retrieves app version',
  summary: 'Retrieves app version',
  responses: {
    200: {
      description: 'Version object',
      schema: {
        $ref: '#/definitions/version-object',
      },
    },
  },
});

route.get('/pc-version', controller.pcVersion, {
  tags: ['Version'],
  description: 'Retrieves PortalCAT version',
  summary: 'Retrieves PortalCAT version',
  responses: {
    200: {
      description: 'Version object',
      schema: {
        $ref: '#/definitions/version-object',
      },
    },
  },
});

route.definition('version-object', {
  properties: {
    v: {
      type: 'string',
    },
  },
  required: ['v'],
});

module.exports = route;
