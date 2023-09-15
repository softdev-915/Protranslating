const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const CompanyMinimumChargeAPI = require('./company-minimum-charge-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async export(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CompanyMinimumChargeAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'export', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async detail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyMinimumChargeAPI = new CompanyMinimumChargeAPI(req.$logger,
      { user, configuration });
    const companyMinimumChargeId = _.get(req, 'swagger.params.companyMinimumChargeId.value');
    const companyMinimumCharge = await companyMinimumChargeAPI.detail(companyMinimumChargeId);
    return sendResponse(res, 200, {
      companyMinimumCharge,
    });
  },
  async list(req, res) {
    const companyMinimumChargeFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const companyMinimumChargeAPI = new CompanyMinimumChargeAPI(req.$logger,
      { user, configuration });
    companyMinimumChargeFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    companyMinimumChargeFilters.filter = _.get(req, 'query.params.filter');
    companyMinimumChargeFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (!_.isEmpty(companyMinimumChargeFilters.filter)) {
      const filters = JSON.parse(companyMinimumChargeFilters.filter);
      const filterId = _.get(filters, 'company._id');
      companyMinimumChargeFilters._id = filterId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(companyMinimumChargeAPI, req);
    const companyMinimumCharges = await paginableApiDecorator.list(companyMinimumChargeFilters);
    return sendResponse(res, 200, companyMinimumCharges);
  },
  async getMinCharge(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyMinimumChargeAPI = new CompanyMinimumChargeAPI(req.$logger,
      { user, configuration });
    const { languageCombination, company, ability, currencyId } = _.get(req, 'swagger.params');
    const minCharge = await companyMinimumChargeAPI.getMinCharge({
      languageCombination: languageCombination.value,
      company: company.value,
      ability: ability.value,
      currencyId: currencyId.value,
    });
    return sendResponse(res, 200, { minCharge: _.get(minCharge, 'minCharge', 0) });
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyMinimumChargeAPI = new CompanyMinimumChargeAPI(req.$logger, { user });
    const companyMinimumCharge = _.get(req, 'swagger.params.data.value');
    const companyMinimumChargeCreated = await companyMinimumChargeAPI
      .create(companyMinimumCharge);
    return sendResponse(res, 200, { companyMinimumCharge: companyMinimumChargeCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyMinimumChargeAPI = new CompanyMinimumChargeAPI(req.$logger, { user });
    const companyMinimumCharge = _.get(req, 'swagger.params.data.value');
    const companyMinimumChargeId = _.get(req, 'swagger.params.companyMinimumChargeId.value');
    companyMinimumCharge._id = companyMinimumChargeId;
    const companyMinimumChargeUpdated = await companyMinimumChargeAPI
      .update(companyMinimumCharge);
    return sendResponse(res, 200, { companyMinimumCharge: companyMinimumChargeUpdated });
  },
};
