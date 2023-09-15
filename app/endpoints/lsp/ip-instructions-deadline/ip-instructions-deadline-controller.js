const _ = require('lodash');
const IpInstructionsDeadlineAPI = require('./ip-instructions-deadline-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { validateIpInstructionsDeadline } = require('../../../utils/ip-instructions-deadline/instructions-deadline-validator');

const { sendResponse, RestError } = apiResponse;
const getTimezoneFilters = (req) => {
  const tz = _.get(req.headers, 'lms-tz', '0');
  const filters = { __tz: tz };
  filters.__tz = _.get(req.headers, 'lms-tz', '0');
  return filters;
};

module.exports = {
  async listIpInstructionsDeadlines(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const filters = getTimezoneFilters(req);
    const ipInstructionsDeadlineAPI = new IpInstructionsDeadlineAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(ipInstructionsDeadlineAPI, req);

    try {
      const ipInstructionsDeadlines = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, ipInstructionsDeadlines);
    } catch (error) {
      const wrappedError = new RestError(500, { message: error.toString() });
      throw error instanceof RestError ? error : wrappedError;
    }
  },
  async getIpInstructionsDeadline(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const ipInstructionsDeadlineId = _.get(req, 'swagger.params.ipInstructionsDeadlineId.value');
    const filters = getTimezoneFilters(req);
    filters._id = ipInstructionsDeadlineId;
    const ipInstructionsDeadlineAPI = new IpInstructionsDeadlineAPI(req.$logger, { user });
    try {
      const ipInstructionsDeadline = await ipInstructionsDeadlineAPI
        .getIpInstructionsDeadline(filters);
      if (!_.isEmpty(ipInstructionsDeadline)) {
        return sendResponse(res, 200, { ipInstructionsDeadline });
      }
      throw new RestError(404, { message: `Ip Instructions deadline ${ipInstructionsDeadlineId} does not exist` });
    } catch (error) {
      const wrappedError = new RestError(500, { message: error.toString() });
      throw error instanceof RestError ? error : wrappedError;
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const ipInstructionsDeadlineAPI = new IpInstructionsDeadlineAPI(req.$logger, { user });
    const ipInstructionsDeadline = _.get(req, 'swagger.params.data.value');
    try {
      validateIpInstructionsDeadline(ipInstructionsDeadline);
      const ipInstructionsDeadlineCreated = await ipInstructionsDeadlineAPI
        .create(ipInstructionsDeadline);
      return sendResponse(res, 200, { ipInstructionsDeadline: ipInstructionsDeadlineCreated });
    } catch (error) {
      const wrappedError = new RestError(500, { message: error.toString() });
      throw error instanceof RestError ? error : wrappedError;
    }
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const ipInstructionsDeadlineAPI = new IpInstructionsDeadlineAPI(req.$logger, { user });
    const ipInstructionsDeadlineId = _.get(req, 'swagger.params.ipInstructionsDeadlineId.value');
    const ipInstructionsDeadline = _.get(req, 'swagger.params.data.value');
    try {
      ipInstructionsDeadline._id = ipInstructionsDeadlineId;
      validateIpInstructionsDeadline(ipInstructionsDeadline);
      const ipInstructionsDeadlineUpdated = await ipInstructionsDeadlineAPI
        .update(ipInstructionsDeadline);
      return sendResponse(res, 200, { ipInstructionDeadline: ipInstructionsDeadlineUpdated });
    } catch (error) {
      const wrappedError = new RestError(500, { message: error.toString() });
      throw error instanceof RestError ? error : wrappedError;
    }
  },
};
