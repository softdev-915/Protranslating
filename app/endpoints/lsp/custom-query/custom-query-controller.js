const _ = require('lodash');
const { sendResponse, RestError, streamFile } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const CustomQueryAPI = require('./custom-query-api');

const env = configuration.environment;
const getCustomQueryList = async (req, listMethod) => {
  let customQueries;
  const customQueryAPI = new CustomQueryAPI(req.$logger, { user: getUserFromSession(req) });
  const paginableApiDecorator = new PaginableAPIDecorator(customQueryAPI, req, { listMethod });
  const filters = { __tz: _.get(req.headers, 'lms-tz', '0') };

  try {
    customQueries = await paginableApiDecorator.list(filters);
  } catch (error) {
    const errorText = JSON.stringify(error, null, 2);

    req.$logger.error(`An error occurred while retrieving a Custom Query list. Error: ${errorText}`);
    throw new RestError(500, { message: 'Unable to retrieve custom queries' });
  }

  return customQueries;
};

const failIfCustomQueryNotExists = async (customQueryAPI, customQueryId) => {
  if (!_.isEmpty(customQueryId)) {
    const isExist = await customQueryAPI.isExist(customQueryId);

    if (!isExist) {
      throw new RestError(404, 'Custom Query not found');
    }
  }
};

const getCustomQueryOrFail = async (req) => {
  let customQueries;
  const customQueryAPI = new CustomQueryAPI(req.$logger, { user: getUserFromSession(req) });
  const customQueryId = _.get(req, 'swagger.params.customQueryId.value', '');

  try {
    customQueries = await customQueryAPI.list({ _id: customQueryId });
  } catch (error) {
    const errorText = JSON.stringify(error, null, 2);

    req.$logger.error(`An error occurred while retrieving a Custom Query. Error: ${errorText}`);
    throw new RestError(500, { message: 'Unable to retrieve a custom query' });
  }
  const customQuery = _.get(customQueries, 'list.0', {});

  if (_.isEmpty(customQuery)) {
    throw new RestError(404, { message: `Custom Query ${customQueryId} does not exist` });
  }
  const notAllowedEntities = _.get(customQuery, 'notAllowedEntities', []);

  if (!_.isEmpty(notAllowedEntities)) {
    throw new RestError(403, {
      message: `This custom query uses ${notAllowedEntities.join(', ')} entities and you do not have access to read them in any context`,
    });
  }

  return customQuery;
};

module.exports = {

  async list(req, res) {
    const customQueries = await getCustomQueryList(req, 'list');

    return sendResponse(res, 200, customQueries);
  },

  async get(req, res) {
    const customQuery = await getCustomQueryOrFail(req);

    return sendResponse(res, 200, { customQuery });
  },

  async save(req, res) {
    let customQuery = {};
    const customQueryAPI = new CustomQueryAPI(req.$logger, { user: getUserFromSession(req) });
    const data = _.get(req, 'swagger.params.data.value');
    const _id = _.get(data, '_id', '');

    await failIfCustomQueryNotExists(customQueryAPI, _id);
    try {
      customQuery = await customQueryAPI.save(data);
    } catch (error) {
      const errorText = JSON.stringify(error, null, 2);

      req.$logger.error(`An error occurred while saving a Custom Query. Error: ${errorText}`);
      throw new RestError(500, error);
    }
    sendResponse(res, 200, { customQuery });
  },

  async export(req, res) {
    const customQueries = await getCustomQueryList(req, 'export');

    streamFile(res, customQueries);
  },

  async mock(req, res) {
    if (env.NODE_ENV === 'PROD') {
      throw new RestError(404);
    }
    const customQueryId = _.get(req, 'swagger.params.customQueryId.value', '');
    const customQueryAPI = new CustomQueryAPI(req.$logger, { user: getUserFromSession(req) });

    await failIfCustomQueryNotExists(customQueryAPI, customQueryId);
    let currentDateOnNextRun = _.get(req, 'swagger.params.currentDateOnNextRun.value', 0);

    if (currentDateOnNextRun < 1) {
      throw new RestError(400, 'Mocked timestamp should be positive integer');
    }
    currentDateOnNextRun = new Date(currentDateOnNextRun);
    try {
      await customQueryAPI.save({
        _id: customQueryId,
        mock: { currentDateOnNextRun },
      });
    } catch (error) {
      req.$logger.error(`An error occurred while saving a Custom Query. Error: ${JSON.stringify(error)}`);
      throw new RestError(500, error);
    }
    res.status(200).send('Success');
  },

  async lastResult(req, res) {
    const customQueryAPI = new CustomQueryAPI(req.$logger, { user: getUserFromSession(req) });
    const customQuery = await getCustomQueryOrFail(req);
    let fileUrl;

    try {
      fileUrl = await customQueryAPI.getLastResultFileUrl(customQuery);
    } catch (error) {
      req.$logger.error(`An error occurred while getting the last result of a Custom Query. Error: ${JSON.stringify(error)}`);
      throw new RestError(500, error);
    }
    sendResponse(res, 200, fileUrl);
  },

};
