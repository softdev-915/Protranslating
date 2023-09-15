const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const DeliveryMethodAPI = require('./delivery-method-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { sendResponse, fileContentDisposition } = apiResponse;

module.exports = {
  async deliveryMethodExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new DeliveryMethodAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'deliveryMethodExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async deliveryMethodList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const deliveryMethodAPI = new DeliveryMethodAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(deliveryMethodAPI, req);
    const deliveryMethods = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, deliveryMethods);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const deliveryMethodId = _.get(req, 'swagger.params.deliveryMethodId.value');
    const deliveryMethodAPI = new DeliveryMethodAPI(req.$logger, { user });
    const deliveryMethod = await deliveryMethodAPI.retrieveById(deliveryMethodId);
    return sendResponse(res, 200, { deliveryMethod });
  },
  async deliveryMethodCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const deliveryMethodAPI = new DeliveryMethodAPI(req.$logger, { user, configuration });
    const deliveryMethod = _.get(req, 'swagger.params.data.value');
    const deliveryMethodCreated = await deliveryMethodAPI.create(deliveryMethod);
    return sendResponse(res, 200, { deliveryMethod: deliveryMethodCreated });
  },
  async deliveryMethodUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const deliveryMethodAPI = new DeliveryMethodAPI(req.$logger, { user, configuration });
    const deliveryMethodId = _.get(req, 'swagger.params.deliveryMethodId.value');
    const deliveryMethod = _.get(req, 'swagger.params.data.value');
    deliveryMethod._id = deliveryMethodId;
    const deliveryMethodUpdated = await deliveryMethodAPI.update(deliveryMethod);
    return sendResponse(res, 200, { deliveryMethod: deliveryMethodUpdated });
  },
};
