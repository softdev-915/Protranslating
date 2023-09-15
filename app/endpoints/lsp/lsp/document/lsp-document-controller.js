const _ = require('lodash');
const { sendResponse, RestError } = require('../../../../components/api-response');
const { getUserFromSession } = require('../../../../utils/request');
const PcSettingsApi = require('../../portalcat-settings/portalcat-settings-api');
const configuration = require('../../../../components/configuration');

module.exports = {
  async srList(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    const { descriptors, total } = await pcSettingsApi.list({ type: 'sr' });
    sendResponse(res, 200, { list: descriptors, total });
  },
  async deleteSr(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const resourceIds = _.get(req, 'swagger.params.data.value.resourceIds', []);
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    await pcSettingsApi.deleteResources({ type: 'sr', resourceIds });
    return sendResponse(res, 200);
  },
  async serverSrx(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    const resourceId = _.get(req, 'swagger.params.descriptorId.value');
    await pcSettingsApi.streamResource(res, { type: 'sr', resourceId });
  },
  async serveSrxZip(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const resourceIds = _.get(req, 'swagger.params.data.value.resourceIds', []);
    const pcSettingsApi = new PcSettingsApi({
      user, logger: req.$logger, configuration, sessionID,
    });
    try {
      await pcSettingsApi.streamResourcesZip(res, { resourceIds, type: 'sr' });
    } catch (e) {
      throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
    }
  },
};
