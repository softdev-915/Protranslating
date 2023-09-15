const Router = require('../../../components/application/route');
const definitions = require('../../../components/application/definitions');
const controller = require('./industry-controller');
const IndustryAPI = require('./industry-api');

const customizableList = definitions.customizableList;
const route = module.exports = Router.create();
const industryList = IndustryAPI.getList();
const allowEmptyIndustryList = [...industryList];
allowEmptyIndustryList.push('');

route.get('/lsp/{lspId}/industry', controller.list, {
  tags: ['Industry'],
  'x-swagger-security': { roles: [] },
  parameters: [{
    name: 'lspId',
    in: 'path',
    description: 'The lsp\'s id',
    type: 'string',
    required: true,
  }],
  description: 'Retrieves all the industries',
  summary: 'Retrieves all the industries',
  responses: {
    200: {
      description: 'The industries',
      schema: { $ref: '#/definitions/industry-list' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.definition('industry-list', customizableList({
  $ref: '#/definitions/industry',
}));

route.definition('industry', {
  type: 'string',
  enum: industryList,
});

route.definition('industry-allow-empty', {
  type: 'string',
  enum: allowEmptyIndustryList,
});
