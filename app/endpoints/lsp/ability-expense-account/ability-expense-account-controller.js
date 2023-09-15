const _ = require('lodash');
const AbilityExpenseAccountAPI = require('./ability-expense-account-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');

const { sendResponse, streamFile } = apiResponse;

module.exports = {
  async abilityExpenseAccountExport(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const user = requestUtils.getUserFromSession(req);
    const api = new AbilityExpenseAccountAPI(req.$logger, { user, configuration, lspId });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'abilityExpenseAccountExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    streamFile(res, csvStream);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const abilityExpenseAccountAPI = new AbilityExpenseAccountAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(abilityExpenseAccountAPI, req);
    const abilityExpenseAccounts = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, abilityExpenseAccounts);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const abilityExpenseAccountId = _.get(req, 'swagger.params.abilityExpenseAccountId.value');
    const abilityExpenseAccountAPI = new AbilityExpenseAccountAPI(req.$logger, { user });
    const abilityExpenseAccount =
      await abilityExpenseAccountAPI.retrieveById(abilityExpenseAccountId);
    return sendResponse(res, 200, { abilityExpenseAccount });
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const abilityExpenseAccountAPI = new AbilityExpenseAccountAPI(req.$logger, { user });
    const abilityExpenseAccount = _.get(req, 'swagger.params.data.value');
    const abilityExpenseAccountCreated =
      await abilityExpenseAccountAPI.create(abilityExpenseAccount);
    return sendResponse(res, 200, { abilityExpenseAccount: abilityExpenseAccountCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const abilityExpenseAccountAPI = new AbilityExpenseAccountAPI(req.$logger, { user });
    const abilityExpenseAccountId = _.get(req, 'swagger.params.abilityExpenseAccountId.value');
    const abilityExpenseAccount = _.get(req, 'swagger.params.data.value');
    abilityExpenseAccount._id = abilityExpenseAccountId;
    const abilityExpenseAccountUpdated =
      await abilityExpenseAccountAPI.update(abilityExpenseAccount);
    return sendResponse(res, 200, { abilityExpenseAccount: abilityExpenseAccountUpdated });
  },
};
