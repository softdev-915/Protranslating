const _ = require('lodash');
const { RestError, sendResponse } = require('../../../../components/api-response');
const CatConfigAPI = require('./cat-config-api');
const requestUtils = require('../../../../utils/request');

module.exports = {
  async retrieve(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userId = _.get(req, 'swagger.params.userId.value');
    if (userId !== user._id) {
      throw new RestError(403, { message: 'You\'re not allowed to access this resource' });
    }
    const catConfigAPI = new CatConfigAPI(req.$logger, { user });
    const config = await catConfigAPI.retrieve();
    return sendResponse(res, 200, { config });
  },
  async createOrEdit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userId = _.get(req, 'swagger.params.userId.value');
    if (userId !== user._id) {
      throw new RestError(403, { message: 'You\'re not allowed to access this resource' });
    }
    const config = _.get(req, 'swagger.params.data.value');
    const catConfigAPI = new CatConfigAPI(req.$logger, { user });
    const newConfig = await catConfigAPI.createOrEdit(config);
    return sendResponse(res, 200, { config: newConfig });
  },
};
