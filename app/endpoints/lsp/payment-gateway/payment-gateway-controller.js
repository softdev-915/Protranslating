const { getUserFromSession } = require('../../../utils/request');
const { wrapControllerLogic, sendResponse } = require('../../../components/api-response');
const PaymentGatewayApi = require('./payment-gateway-api');
const configuration = require('../../../components/configuration');

module.exports = {
  async list(req, res) {
    await wrapControllerLogic(async () => {
      const user = getUserFromSession(req);
      const api = new PaymentGatewayApi(req.$logger, { user, configuration });
      const list = await api.list();
      return sendResponse(res, 200, list);
    });
  },
};
