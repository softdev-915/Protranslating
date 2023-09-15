const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const { RestError, sendResponse } = require('../../../components/api-response');
const ExternalResourceAPI = require('./external-resource-api');

module.exports = {
  async retrieve(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const externalResourceAPI = new ExternalResourceAPI(req.$logger, { user });
    const externalResource = await externalResourceAPI.retrieve();
    if (externalResource) {
      return sendResponse(res, 200, { externalResource });
    }
    throw new RestError(404, { message: 'no external resource found' });
  },
  async upsert(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const externalResource = _.get(req, 'swagger.params.data.value');
    const externalResourceAPI = new ExternalResourceAPI(req.$logger, { user });
    const externalResourcesCreated = await externalResourceAPI.upsert(externalResource);
    return sendResponse(res, 200, { externalResource: externalResourcesCreated });
  },
};
