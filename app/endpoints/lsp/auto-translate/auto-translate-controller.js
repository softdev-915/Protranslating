const _ = require('lodash');
const AutoTranslateApi = require('./auto-translate-api');
const {
  sendResponse,
} = require('../../../components/api-response');
const apiResponse = require('../../../components/api-response');
const logger = require('../../../components/log/logger');
const { getUserFromSession } = require('../../../utils/request');

const { RestError } = apiResponse;

module.exports = {
  async runScheduler(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const entity = _.get(req, 'swagger.params.data.value.entity', '');
    const entityId = _.get(req, 'swagger.params.data.value.entityId', '');
    const schedulerName = _.get(req, 'swagger.params.schedulerName.value', '');
    try {
      const user = getUserFromSession(req);
      const api = new AutoTranslateApi(logger, { flags: req.flags, user });
      await api.runScheduler(lspId, { entity, entityId, schedulerName });
    } catch (err) {
      req.$logger.error(`Failed to run scheduler ${schedulerName} on entity ${entity} with id ${entityId}. Error: ${err}`);
      throw new RestError(500, { message: err.toString() });
    }
    return sendResponse(res, 200, 'Successfully executed scheduler.');
  },
};
