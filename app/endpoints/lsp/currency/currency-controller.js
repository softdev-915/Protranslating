const _ = require('lodash');
const CurrencyAPI = require('./currency-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async currencyExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CurrencyAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'currencyExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const currencyId = _.get(req, 'swagger.params.currencyId.value');
    const filters = {
      __tz: tz,
    };
    if (currencyId) {
      filters._id = currencyId;
    }
    const currencyAPI = new CurrencyAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(currencyAPI, req);
    const currencies = await paginableApiDecorator.list(filters);
    if (currencyId) {
      if (currencies && currencies.list.length) {
        return sendResponse(res, 200, {
          currency: currencies.list[0],
        });
      }
      throw new RestError(404, { message: `Currency ${currencyId} does not exist` });
    } else {
      return sendResponse(res, 200, currencies);
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const currencyAPI = new CurrencyAPI(req.$logger, { user });
    const currency = _.get(req, 'swagger.params.data.value');
    const currencyCreated = await currencyAPI.create(currency);
    return sendResponse(res, 200, { currency: currencyCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const currencyAPI = new CurrencyAPI(req.$logger, { user });
    const currency = _.get(req, 'swagger.params.data.value');
    const currencyUpdated = await currencyAPI.update(currency);
    return sendResponse(res, 200, { currency: currencyUpdated });
  },
};
