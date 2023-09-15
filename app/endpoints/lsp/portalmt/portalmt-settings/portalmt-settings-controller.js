const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const apiResponse = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const UserAPI = require('../../user/user-api');

const { sendResponse } = apiResponse;

module.exports = {
  async updatePortalMTSettings(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userPortalMTSettings = _.get(req, 'swagger.params.data.value');
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: _.get(req, 'flags.mock'),
      netsuite: _.get(req, 'flags.ns'),
    });
    const portalMTSettings = await userAPI.userEditPortalMTSettings(userPortalMTSettings);
    user.portalTranslatorSettings = portalMTSettings;
    return sendResponse(res, 200, { portalMTSettings });
  },
  getPortalMTSettings(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const portalMTSettings = _.get(user, 'portalTranslatorSettings', {});
    return sendResponse(res, 200, { portalMTSettings });
  },
};
