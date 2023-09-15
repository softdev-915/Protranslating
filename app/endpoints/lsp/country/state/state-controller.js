const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const apiResponse = require('../../../../components/api-response');
const StateAPI = require('./state-api');

const { sendResponse } = apiResponse;

module.exports = {
  async stateList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const countryId = _.get(req, 'swagger.params.countryId.value');
    const stateAPI = new StateAPI(req.$logger, { user });
    const states = await stateAPI.stateList(countryId);
    const response = {
      list: states,
      total: states.length,
    };
    return sendResponse(res, 200, response);
  },
};
