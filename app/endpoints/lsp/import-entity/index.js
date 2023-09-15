const Router = require('../../../components/application/route');
const { MIMETYPE_XLSX } = require('../../../utils/file');
const controller = require('./import-entity-controller');

const route = module.exports = Router.create();
const CREATE_ROLES = ['ENTITIES-IMPORT_CREATE_ALL'];
const TAGS = ['Import Entities'];
const REFS = { IMPORT_INPUT: '#/definitions/import-entity-input', ERROR: '#/definitions/error' };

route.post('/lsp/{lspId}/import-entity/import', controller.import, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: CREATE_ROLES }] },
  description: 'Import entities via xlsx file',
  summary: 'Import entities via xlsx file',
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }, {
    name: 'file',
    in: 'formData',
    description: 'The file to upload',
    type: 'file',
    required: true,
  }],
  consumes: ['multipart/form-data'],
  responses: {
    200: {
      description: 'The file download uri',
      schema: { type: 'string' },
    },
    400: {
      description: 'Invalid request',
      schema: { $ref: REFS.ERROR },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: REFS.ERROR },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: REFS.ERROR },
    },
    404: {
      description: 'Not found',
      schema: { $ref: REFS.ERROR },
    },
  },
});

route.get('/lsp/{lspId}/import-entity/export', controller.export, {
  tags: TAGS,
  'x-swagger-security': { roles: [{ oneOf: CREATE_ROLES }] },
  description: 'Export entities via xlsx file',
  summary: 'Export entities via xlsx file',
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }],
  produces: [MIMETYPE_XLSX],
  responses: {
    200: {
      description: 'The XLXS file containing the data',
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

route.definition('import-entity-input', {
  properties: {
    file: { type: 'string' },
  },
});
