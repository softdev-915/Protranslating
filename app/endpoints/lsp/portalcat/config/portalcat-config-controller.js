const _ = require('lodash');
const { getUserFromSession } = require('../../../../utils/request');
const { sendResponse } = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const PortalCatConfigApi = require('./portalcat-config-api');

module.exports = {
  async saveConfig(req, res) {
    const user = getUserFromSession(req);
    const data = _.get(req, 'swagger.params.data.value');
    const portalCatConfigApi = new PortalCatConfigApi(req.$logger, { user, configuration });
    const { config } = await portalCatConfigApi.saveConfig(data);
    return sendResponse(res, 200, { config });
  },

  async saveDefaultConfig(req, res) {
    const user = getUserFromSession(req);
    const data = _.get(req, 'swagger.params.data.value');
    const portalCatConfigApi = new PortalCatConfigApi(req.$logger, { user, configuration });
    const config = await portalCatConfigApi.saveDefaultConfig(data);
    user.portalCatDefaultConfig = config;
    return sendResponse(res, 200, { config });
  },

  async getConfig(req, res) {
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const taskId = _.get(req, 'swagger.params.taskId.value');
    const portalCatConfigApi = new PortalCatConfigApi(req.$logger, { user, configuration });
    const config = await portalCatConfigApi.getConfig({ requestId, workflowId, taskId });
    return sendResponse(res, 200, { config });
  },
};
