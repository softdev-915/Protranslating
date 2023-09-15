const _ = require('lodash');
const { getUserFromSession } = require('../../../utils/request');
const { pipeWithErrors } = require('../../../utils/stream');
const PaginableApiDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { sendResponse, fileContentDisposition } = require('../../../components/api-response');
const RevenueAccountApi = require('./revenue-account-api');

module.exports = {
  async list(req, res) {
    const user = getUserFromSession(req);
    const accountsApi = new RevenueAccountApi(req.$logger, { user });
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz };
    const paginableApiDecorator = new PaginableApiDecorator(accountsApi, req);
    const list = await paginableApiDecorator.list(filters);
    sendResponse(res, 200, list);
  },
  async export(req, res) {
    const user = getUserFromSession(req);
    const api = new RevenueAccountApi(req.$logger, { user });
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz };
    const paginableApiDecorator = new PaginableApiDecorator(api, req,
      { listMethod: 'export' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async details(req, res) {
    const user = getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const accountsApi = new RevenueAccountApi(req.$logger, { user });
    const account = await accountsApi.findById(id);
    sendResponse(res, 200, { account });
  },
  async create(req, res) {
    const user = getUserFromSession(req);
    const data = _.get(req, 'swagger.params.data.value');
    const accountsApi = new RevenueAccountApi(req.$logger, { user });
    const account = await accountsApi.create(data);
    sendResponse(res, 200, { account });
  },
  async update(req, res) {
    const user = getUserFromSession(req);
    const data = _.get(req, 'swagger.params.data.value');
    const id = _.get(req, 'swagger.params.id.value');
    const accountsApi = new RevenueAccountApi(req.$logger, { user });
    const account = await accountsApi.update(id, data);
    sendResponse(res, 200, { account });
  },
};
