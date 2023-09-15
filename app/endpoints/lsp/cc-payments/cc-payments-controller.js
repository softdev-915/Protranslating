const _ = require('lodash');
const { sendResponse, RestError } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const CcPaymentsApi = require('./cc-payments-api');
const defaultController = require('../../../utils/default-controller');

const ccPaymentController = defaultController(CcPaymentsApi, 'cc-payment');

ccPaymentController.getPaymentStatus = async (req, res) => {
  const entityNo = _.get(req, 'swagger.params.entityNo.value');
  const mock = _.get(req, 'swagger.params.mock.value');
  const mockTrSearchNoResponseFromCs = _.get(req, 'swagger.params.mockTrSearchNoResponseFromCs.value');
  const mockTrDetailsNoResponseFromCs = _.get(req, 'swagger.params.mockTrDetailsNoResponseFromCs.value');
  const mockTrStatus = _.get(req, 'swagger.params.mockTrStatus.value');
  const mockTrSubmitTime = _.get(req, 'swagger.params.mockTrSubmitTime.value');
  const user = getUserFromSession(req);
  const api = new CcPaymentsApi(req.$logger,
    { user, configuration, enableTransactions: true, flags: req.flags });
  const flags = {
    mock,
    mockTrSearchNoResponseFromCs,
    mockTrStatus,
    mockTrDetailsNoResponseFromCs,
    mockTrSubmitTime,
  };
  try {
    const status = await api.getPaymentStatus(entityNo, flags);
    sendResponse(res, 200, { status });
  } catch (e) {
    const message = _.get(e, 'message', e);
    req.$logger.error(`Failed to retrieve payment status for ${entityNo}. Error: ${message}`);
    throw new RestError(500, { message: `Failed to get payment status. Error: ${message}` });
  }
};

module.exports = ccPaymentController;
