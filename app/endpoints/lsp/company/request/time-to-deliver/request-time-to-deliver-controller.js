const RequestAPI = require('../../../request/request-api');
const requestUtils = require('../../../../../utils/request');
const _ = require('lodash');
const configuration = require('../../../../../components/configuration');
const { sendResponse, RestError } = require('../../../../../components/api-response');

module.exports = {
  async getRequestsByTimeToDeliver(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const timeToDeliver = _.get(req, 'swagger.params.timeToDeliver.value');
    try {
      const requestApi = new RequestAPI({
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      });
      const requests = await requestApi.requestsByCompanyTimeToDeliver(companyId, timeToDeliver);
      return sendResponse(res, 200, requests);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
};
