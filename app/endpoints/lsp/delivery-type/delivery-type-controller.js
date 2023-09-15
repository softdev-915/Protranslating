const _ = require('lodash');
const DeliveryTypeAPI = require('./delivery-type-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const defaultController = require('../../../utils/default-controller');

const { sendResponse, sendErrorResponse } = apiResponse;
const controller = defaultController(DeliveryTypeAPI, 'deliveryType');

controller.nameList = async (req, res) => {
  const user = requestUtils.getUserFromSession(req);
  const select = _.get(req, 'query.params.select', false);
  const deliveryTypeApi = new DeliveryTypeAPI(req.$logger, { user });
  try {
    const paginableApiDecorator = new PaginableAPIDecorator(deliveryTypeApi, req, { listMethod: 'nameList' });
    const response = await paginableApiDecorator.list({ select });
    return sendResponse(res, 200, response);
  } catch (error) {
    return sendErrorResponse(res, 500, { message: _.get(error, 'message', error) }, false);
  }
};

module.exports = controller;
