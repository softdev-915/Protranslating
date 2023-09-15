const _ = require('lodash');
const { getUserFromSession } = require('../../../utils/request');
const PiiApi = require('./pii-api');
const configuration = require('../../../components/configuration');
const { sendResponse } = require('../../../components/api-response');

module.exports = {
  async retrieveValue(req, res) {
    const user = getUserFromSession(req);
    const entityId = _.get(req, 'swagger.params.entityId.value');
    const path = _.get(req, 'swagger.params.path.value');
    const collection = _.get(req, 'swagger.params.collection.value');
    const api = new PiiApi(req.$logger, { user, configuration });
    const value = await api.retrieveValue({ collection, entityId, path });
    return sendResponse(res, 200, { value });
  },
};
