const _ = require('lodash');
const moment = require('moment');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const CompanyExternalAccountingCodeApi = require('./company-external-accounting-code-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { streamFile } = require('../../../components/api-response');

const { sendResponse, RestError } = apiResponse;

module.exports = {
  async companyExternalAccountingCodeExport(req, res) {
    try {
      const lspId = _.get(req, 'swagger.params.lspId.value');
      const user = requestUtils.getUserFromSession(req);
      const api = new CompanyExternalAccountingCodeApi(req.$logger, { user, configuration, lspId });
      const tz = _.get(req.headers, 'lms-tz', moment().utcOffset().toString());
      const filters = { __tz: tz };
      const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'companyExternalAccountingCodeExport' });
      const csvStream = await paginableApiDecorator.list(filters);
      streamFile(res, csvStream);
    } catch (error) {
      req.$logger.debug('Failed to export');
      req.$logger.error(error);
      throw new RestError(500, { message: error.message || error });
    }
  },
  async list(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const tz = _.get(req.headers, 'lms-tz', '0');
      // Set filter params
      const filters = { __tz: tz };
      filters.attributes = _.get(req, 'swagger.params.attributes.value');
      const companyExternalAccountingCodeApi = new CompanyExternalAccountingCodeApi(req.$logger, {
        user,
      });
      const paginableApiDecorator = new PaginableAPIDecorator(
        companyExternalAccountingCodeApi, req,
      );
      const companyExternalAccountingCodes = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, companyExternalAccountingCodes);
    } catch (error) {
      req.$logger.debug('Failed to retrieve external accounting codes');
      req.$logger.error(error);
      throw new RestError(500, { message: error.message || error });
    }
  },
  async retrieveById(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const companyExternalAccountingCodeId = _.get(req, 'swagger.params.companyExternalAccountingCodeId.value');
      const companyExternalAccountingCodeApi = new CompanyExternalAccountingCodeApi(req.$logger, {
        user,
      });
      const companyExternalAccountingCode =
        await companyExternalAccountingCodeApi.retrieveById(companyExternalAccountingCodeId);
      return sendResponse(res, 200, { companyExternalAccountingCode });
    } catch (error) {
      req.$logger.debug('Failed to retrieve external accounting code');
      req.$logger.error(error);
      throw new RestError(500, { message: error.message || error });
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyExternalAccountingCodeApi =
        new CompanyExternalAccountingCodeApi(req.$logger, { user });
    const companyExternalAccountingCode = _.get(req, 'swagger.params.data.value');
    const companyExternalAccountingCodeCreated =
        await companyExternalAccountingCodeApi.create(companyExternalAccountingCode);
    return sendResponse(res, 200, {
      companyExternalAccountingCode: companyExternalAccountingCodeCreated,
    });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyExternalAccountingCodeApi = new CompanyExternalAccountingCodeApi(req.$logger, {
      user,
    });
    const companyExternalAccountingCodeId = _.get(req, 'swagger.params.companyExternalAccountingCodeId.value');
    const companyExternalAccountingCode = _.get(req, 'swagger.params.data.value');
    companyExternalAccountingCode._id = companyExternalAccountingCodeId;
    const companyExternalAccountingCodeUpdated =
        await companyExternalAccountingCodeApi.update(companyExternalAccountingCode);
    return sendResponse(res, 200, {
      companyExternalAccountingCode: companyExternalAccountingCodeUpdated,
    });
  },
};
