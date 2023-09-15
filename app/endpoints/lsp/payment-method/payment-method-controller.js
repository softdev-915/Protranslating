const _ = require('lodash');
const PaymentMethodAPI = require('./payment-method-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;
const { pipeWithErrors } = require('../../../utils/stream/');

module.exports = {
  async paymentMethodExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new PaymentMethodAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'paymentMethodExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async paymentMethodList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const paymentMethodId = _.get(req, 'swagger.params.paymentMethodId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    // Set filter params
    filters.__tz = _.get(req.headers, 'lms-tz', '0');
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (paymentMethodId) {
      filters._id = paymentMethodId;
    }
    const paymentMethodAPI = new PaymentMethodAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(paymentMethodAPI, req);
    const paymentMethods = await paginableApiDecorator.list(filters);

    if (paymentMethodId) {
      if (paymentMethods && Array.isArray(paymentMethods.list) && paymentMethods.list.length) {
        return sendResponse(res, 200, {
          paymentMethod: paymentMethods.list[0],
        });
      }
      throw new RestError(404, { message: `Payment method ${paymentMethodId} does not exist` });
    } else {
      return sendResponse(res, 200, paymentMethods);
    }
  },
  async paymentMethodCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const paymentMethodAPI = new PaymentMethodAPI(req.$logger, { user });
    const paymentMethod = _.get(req, 'swagger.params.data.value');
    const paymentMethodCreated = await paymentMethodAPI.create(paymentMethod);
    return sendResponse(res, 200, { paymentMethod: paymentMethodCreated });
  },
  async paymentMethodUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const paymentMethodAPI = new PaymentMethodAPI(req.$logger, { user });
    const paymentMethodId = _.get(req, 'swagger.params.paymentMethodId.value');
    const paymentMethod = _.get(req, 'swagger.params.data.value');
    paymentMethod._id = paymentMethodId;
    const paymentMethodUpdated = await paymentMethodAPI.update(paymentMethod);
    return sendResponse(res, 200, { paymentMethod: paymentMethodUpdated });
  },
};
