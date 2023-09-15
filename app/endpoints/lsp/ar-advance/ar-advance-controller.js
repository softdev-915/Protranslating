const _ = require('lodash');
const ArAdvanceApi = require('./ar-advance-api');
const configuration = require('../../../components/configuration');
const defaultController = require('../../../utils/default-controller');
const { getUserFromSession } = require('../../../utils/request');
const { sendResponse, RestError } = require('../../../components/api-response');

const controller = defaultController(ArAdvanceApi, 'ar-advance', { enableAttachmentsHandling: true });

controller.void = async (req, res) => {
  const id = _.get(req, 'swagger.params.id.value');
  const data = _.get(req, 'swagger.params.data.value');
  const user = getUserFromSession(req);
  const api = new ArAdvanceApi(req.$logger, { user, configuration, flags: req.flags });
  try {
    const advance = await api.void(id, data);
    return sendResponse(res, 200, { 'ar-advance': advance });
  } catch (e) {
    req.$logger.error(`An error occurred while reverting ar advance ${id}. Error: ${e}`);
    throw new RestError(500, e);
  }
};

module.exports = controller;
