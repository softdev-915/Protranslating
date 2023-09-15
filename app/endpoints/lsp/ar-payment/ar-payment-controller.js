const _ = require('lodash');
const ArPaymentApi = require('./ar-payment-api');
const defaultController = require('../../../utils/default-controller');
const { sendResponse, RestError } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const configuration = require('../../../components/configuration');

const controller = defaultController(ArPaymentApi, 'ar-payment', { enableAttachmentsHandling: true });

controller.retrieveLineItems = async function (req, res) {
  try {
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const currencyId = _.get(req, 'swagger.params.currencyId.value');
    const source = _.get(req, 'swagger.params.source.value');
    const target = _.get(req, 'swagger.params.target.value');
    const api = new ArPaymentApi(req.$logger, { user, configuration, flags: req.flags });
    const lineItems = await api.getPaymentLineItems(companyId, currencyId, source, target);
    return sendResponse(res, 200, { lineItems });
  } catch (err) {
    const message = _.get(err, 'message', err);
    req.$logger.error(`Failed retrieve to invoice payment line items: ${err}`);
    throw new RestError(500, { message });
  }
};

controller.void = async (req, res) => {
  const id = _.get(req, 'swagger.params.id.value');
  const data = _.get(req, 'swagger.params.data.value');
  const user = getUserFromSession(req);
  const api = new ArPaymentApi(req.$logger, { user, configuration, flags: req.flags });
  try {
    const payment = await api.void(id, data);
    return sendResponse(res, 200, { 'ar-payment': payment });
  } catch (e) {
    req.$logger.error(`An error occurred while voiding ar payment ${id}. Error: ${e}`);
    throw new RestError(500, e);
  }
};

module.exports = controller;
