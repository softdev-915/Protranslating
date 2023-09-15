const _ = require('lodash');
const ProviderInstructionsAPI = require('./provider-instructions-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;
const { pipeWithErrors } = require('../../../utils/stream');

module.exports = {
  async providerInstructionsExport(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const api = new ProviderInstructionsAPI(req.$logger, { user, configuration });
      const tz = _.get(req.headers, 'lms-tz', '0');
      const filters = {
        __tz: tz,
      };
      const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'providerInstructionsExport' });
      const csvStream = await paginableApiDecorator.list(filters);
      res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
      res.setHeader('Content-type', 'text/csv');
      pipeWithErrors(csvStream, res);
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      const message = err.message || err;
      req.$logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
  },
  async getOne(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const providerInstructionsId = _.get(req, 'swagger.params.providerInstructionsId.value');
      const providerInstructionsAPI = new ProviderInstructionsAPI(req.$logger,
        { user, configuration });
      const providerInstructions = await providerInstructionsAPI.findOne(providerInstructionsId);
      if (_.isNil(providerInstructions)) {
        throw new RestError(404, { message: `Provider instruction ${providerInstructionsId} does not exist` });
      }
      return sendResponse(res, 200, {
        providerInstructions,
      });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      const message = err.message || err;
      req.$logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
  },
  async list(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const tz = _.get(req.headers, 'lms-tz', '0');
      const filters = {
        __tz: tz,
      };
      // Set filter params
      filters.__tz = _.get(req.headers, 'lms-tz', '0');
      filters.attributes = _.get(req, 'swagger.params.attributes.value');
      const providerInstructionsAPI = new ProviderInstructionsAPI(req.$logger,
        { user, configuration });
      const paginableApiDecorator = new PaginableAPIDecorator(providerInstructionsAPI, req);
      const providerInstructionss = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, providerInstructionss);
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      const message = err.message || err;
      req.$logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
  },
  async create(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const providerInstructionsAPI = new ProviderInstructionsAPI(req.$logger,
        { user, configuration });
      const providerInstructions = _.get(req, 'swagger.params.data.value');
      const providerInstructionsCreated =
        await providerInstructionsAPI.create(providerInstructions);
      return sendResponse(res, 200, { providerInstructions: providerInstructionsCreated });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      const message = err.message || err;
      req.$logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
  },
  async update(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const providerInstructionsAPI = new ProviderInstructionsAPI(req.$logger,
        { user, configuration });
      const providerInstructionsId = _.get(req, 'swagger.params.providerInstructionsId.value');
      const providerInstructions = _.get(req, 'swagger.params.data.value');
      providerInstructions._id = providerInstructionsId;
      const providerInstructionsUpdated =
       await providerInstructionsAPI.update(providerInstructions);
      return sendResponse(res, 200, { providerInstructions: providerInstructionsUpdated });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      const message = err.message || err;
      req.$logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
  },
};
