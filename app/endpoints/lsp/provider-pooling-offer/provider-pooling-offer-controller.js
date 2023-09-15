const _ = require('lodash');
const Promise = require('bluebird');
const defaultController = require('../../../utils/default-controller');
const { sendResponse, RestError, streamFile } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const ProviderPoolingOfferApi = require('./provider-pooling-offer-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');

const entityName = 'providerPoolingOffer';
const controller = defaultController(ProviderPoolingOfferApi, entityName);

controller.export = async (req, res) => {
  try {
    const user = getUserFromSession(req);
    const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, {
      user, configuration,
    });
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz };
    const paginableApiDecorator = new PaginableAPIDecorator(
      providerPoolingOfferApi,
      req,
      { listMethod: 'export' },
    );
    const file = await paginableApiDecorator.list(filters);
    streamFile(res, file);
  } catch (e) {
    req.$logger.error(`An error occurred while exporting ${entityName} list. ${e}`);
    throw new RestError(500, { message: e.message || e });
  }
};

controller.findProviders = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, {
    user, configuration,
  });

  try {
    const paginableApiDecorator = new PaginableAPIDecorator(
      providerPoolingOfferApi,
      req,
      { listMethod: 'findProviders' },
    );
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const taskId = _.get(req, 'swagger.params.taskId.value');
    const maxRate = _.get(req, 'swagger.params.maxRate.value');
    const selectedProviders = _.get(req, 'swagger.params.selectedProviders.value');
    const translationUnitId = _.get(req, 'swagger.params.translationUnitId.value');
    const breakdownId = _.get(req, 'swagger.params.breakdownId.value');
    const offerId = _.get(req, 'swagger.params.offerId.value');
    const providers = await paginableApiDecorator
      .list({ requestId,
        workflowId,
        taskId,
        maxRate,
        translationUnitId,
        breakdownId,
        selectedProviders,
        offerId });
    return sendResponse(res, 200, providers);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.getOfferTask = async (req, res) => {
  const user = getUserFromSession(req);
  const requestId = _.get(req, 'swagger.params.requestId.value');
  const workflowId = _.get(req, 'swagger.params.workflowId.value');
  const taskId = _.get(req, 'swagger.params.taskId.value');
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  try {
    const requestData = await providerPoolingOfferApi
      .getOfferTask(requestId, workflowId, taskId);
    return sendResponse(res, 200, requestData);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.getNewOfferData = async (req, res) => {
  const user = getUserFromSession(req);
  const requestId = _.get(req, 'swagger.params.requestId.value');
  const workflowId = _.get(req, 'swagger.params.workflowId.value');
  const taskId = _.get(req, 'swagger.params.taskId.value');
  const providerTaskId = _.get(req, 'swagger.params.providerTaskId.value');
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  try {
    const requestData = await providerPoolingOfferApi
      .getNewOfferData({ requestId, workflowId, taskId, providerTaskId });
    return sendResponse(res, 200, requestData);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.sendOffer = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  const data = _.get(req, 'swagger.params.data.value');
  try {
    await providerPoolingOfferApi.sendOffer(data);
    return sendResponse(res, 200);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.getProviderOffers = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  const providerId = _.get(req, 'swagger.params.providerId.value');
  try {
    const response = await providerPoolingOfferApi.getProviderOffers(providerId);
    return sendResponse(res, 200, response);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.acceptOffers = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  const data = _.get(req, 'swagger.params.data.value');
  try {
    const operations = _.get(data, 'offers', [])
      .map(offer =>
        providerPoolingOfferApi.acceptOffer({
          offerId: offer._id,
          providerId: data.providerId,
          offerUpdatedAt: offer.updatedAt,
        }));
    await Promise.all(operations);
    return sendResponse(res, 200);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.declineOffers = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  const data = _.get(req, 'swagger.params.data.value');
  const { providerId, decliningReason } = data;
  try {
    const operations = _.get(data, 'offers', [])
      .map(offer =>
        providerPoolingOfferApi.declineOffer({
          offerId: offer._id,
          providerId,
          decliningReason,
          offerUpdatedAt: offer.updatedAt,
        }));
    await Promise.all(operations);
    return sendResponse(res, 200);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.undoOffersOperation = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  const data = _.get(req, 'swagger.params.data.value');
  try {
    const operations = _.get(data, 'offers', [])
      .map(offer =>
        providerPoolingOfferApi.undoOfferOperation({
          offerId: offer._id,
          providerId: data.providerId,
          offerUpdatedAt: offer.updatedAt,
        }, data.accepted));
    await Promise.all(operations);
    return sendResponse(res, 200);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

controller.closeOffer = async (req, res) => {
  const user = getUserFromSession(req);
  const providerPoolingOfferApi = new ProviderPoolingOfferApi(req.$logger, { user, configuration });
  const data = _.get(req, 'swagger.params.data.value');
  try {
    await providerPoolingOfferApi.closeOffer(data);
    return sendResponse(res, 200);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
};

module.exports = controller;
