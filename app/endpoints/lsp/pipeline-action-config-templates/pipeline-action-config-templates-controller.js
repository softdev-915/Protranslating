const _ = require('lodash');
const { getUserFromSession } = require('../../../utils/request');
const { sendResponse, sendErrorResponse } = require('../../../components/api-response');
const PipelineActionConfigTemplatesApi = require('./pipeline-action-config-templates-api');
const { environment } = require('../../../components/configuration');

module.exports = {
  async list(req, res) {
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const action = _.get(req, 'swagger.params.action.value');
    const term = _.get(req, 'swagger.params.term.value');
    const api = new PipelineActionConfigTemplatesApi({ logger: req.$logger, user });
    const { templates: list, total } = await api.list(companyId, { action, term });
    sendResponse(res, 200, { list, total });
  },
  async create(req, res) {
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const data = _.get(req, 'swagger.params.data.value');
    const api = new PipelineActionConfigTemplatesApi({ logger: req.$logger, user });
    const template = await api.create(companyId, data);
    sendResponse(res, 200, template);
  },

  async getByName(req, res) {
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const name = _.get(req, 'swagger.params.name.value');
    const action = _.get(req, 'swagger.params.action.value');
    const api = new PipelineActionConfigTemplatesApi({ logger: req.$logger, user });
    const template = await api.getByName({ companyId, action, name });
    return sendResponse(res, 200, template);
  },

  async update(req, res) {
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const templateId = _.get(req, 'swagger.params.templateId.value');
    const data = _.get(req, 'swagger.params.data.value');
    const api = new PipelineActionConfigTemplatesApi({ logger: req.$logger, user });
    const template = await api.update(companyId, templateId, data);
    return sendResponse(res, 200, template);
  },
  async hide(req, res) {
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const templateId = _.get(req, 'swagger.params.templateId.value');
    const api = new PipelineActionConfigTemplatesApi({ logger: req.$logger, user });
    await api.hide(companyId, templateId);
    return sendResponse(res, 204);
  },
  async deleteAll(req, res) {
    const { IS_PROD } = environment;
    const mock = _.get(req.flags, 'mock', false);
    const isTestEnvironment = !IS_PROD;
    if (isTestEnvironment && mock) {
      const user = getUserFromSession(req);
      const companyId = _.get(req, 'swagger.params.companyId.value');
      const api = new PipelineActionConfigTemplatesApi({ logger: req.$logger, user });
      await api.deleteAll(companyId);
      return sendResponse(res, 204);
    }
    return sendErrorResponse(res, 404, { message: 'Path not found' });
  },
};
