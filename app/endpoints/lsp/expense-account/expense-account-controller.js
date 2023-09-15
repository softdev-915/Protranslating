const _ = require('lodash');
const ExpenseAccountAPI = require('./expense-account-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async expenseAccountExport(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const user = requestUtils.getUserFromSession(req);
    const api = new ExpenseAccountAPI(req.$logger, { user, configuration, lspId });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'expenseAccountsExport', req });
    const csvStream = await paginableApiDecorator.list({ tz });
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const expenseAccountAPI = new ExpenseAccountAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(expenseAccountAPI, req);
    const expenseAccounts = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, expenseAccounts);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const expenseAccountId = _.get(req, 'swagger.params.expenseAccountId.value');
    const expenseAccountAPI = new ExpenseAccountAPI(req.$logger, { user });
    const expenseAccount = await expenseAccountAPI.retrieveById(expenseAccountId);
    return sendResponse(res, 200, { expenseAccount });
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const expenseAccountAPI = new ExpenseAccountAPI(req.$logger, { user });
    const expenseAccount = _.get(req, 'swagger.params.data.value');
    const expenseAccountCreated = await expenseAccountAPI.create(expenseAccount);
    return sendResponse(res, 200, { expenseAccount: expenseAccountCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const expenseAccountAPI = new ExpenseAccountAPI(req.$logger, { user });
    const expenseAccountId = _.get(req, 'swagger.params.expenseAccountId.value');
    const expenseAccount = _.get(req, 'swagger.params.data.value');
    expenseAccount._id = expenseAccountId;
    const expenseAccountUpdated = await expenseAccountAPI.update(expenseAccount);
    return sendResponse(res, 200, { expenseAccount: expenseAccountUpdated });
  },
};
