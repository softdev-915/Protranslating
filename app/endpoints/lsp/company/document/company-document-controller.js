const _ = require('lodash');
const { getUserFromSession } = require('../../../../utils/request');
const { sendResponse } = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const PcSettingsApi = require('../../portalcat-settings/portalcat-settings-api');
const { RestError } = require('../../../../components/api-response');

module.exports = {
  async pcSettingsResourcesList(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.id.value');
    const type = _.get(req, 'swagger.params.type.value');
    const srcLang = _.get(req, 'swagger.params.srcLang.value');
    const tgtLang = _.get(req, 'swagger.params.tgtLang.value');
    const pcSettingsApi = new PcSettingsApi({
      logger: req.$logger, user, configuration, sessionID,
    });
    const { descriptors, total } = await pcSettingsApi.list({ type, companyId, srcLang, tgtLang });
    const { isUserIpAllowed = true } = res.locals;
    await sendResponse(res, 200, { list: descriptors, total, isUserIpAllowed });
  },
  async deletePcSettingsResources(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const mock = _.get(req.flags, 'mock', false);
    const resourceIds = _.get(req, 'swagger.params.data.value.resourceIds', []);
    const type = _.get(req, 'swagger.params.data.value.type');
    const companyId = _.get(req, 'swagger.params.id.value');
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, mock, sessionID,
    });
    await pcSettingsApi.deleteResources({ type, resourceIds, companyId });
    return sendResponse(res, 200);
  },
  async servePcSettingsResource(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    const resourceId = _.get(req, 'swagger.params.resourceId.value');
    const companyId = _.get(req, 'swagger.params.id.value');
    const type = _.get(req, 'swagger.params.type.value');
    await pcSettingsApi.streamResource(res, { type, resourceId, companyId });
  },
  async servePcSettingsResourcesZip(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const resourceIds = _.get(req, 'swagger.params.data.value.resourceIds', []);
    const type = _.get(req, 'swagger.params.data.value.type');
    const companyId = _.get(req, 'swagger.params.id.value');
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    try {
      await pcSettingsApi.streamResourcesZip(res, { resourceIds, type, companyId });
    } catch (e) {
      throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
    }
  },
  async updatePcSettingsResourceName(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const resourceId = _.get(req, 'swagger.params.resourceId.value');
    const type = _.get(req, 'swagger.params.type.value');
    const name = _.get(req, 'swagger.params.data.value.name');
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    const descriptor = await pcSettingsApi.updateResourceName({ name, type, resourceId });
    return sendResponse(res, 200, { descriptor });
  },
};
