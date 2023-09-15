const _ = require('lodash');
const VendorMinimumChargeAPI = require('./vendor-minimum-charge-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async vendorMinimumChargeExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new VendorMinimumChargeAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'vendorMinimumChargeExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
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
    const vendorMinimumChargeApi = new VendorMinimumChargeAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(vendorMinimumChargeApi, req);
    const vendorMinimumCharges = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, vendorMinimumCharges);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const vendorMinimumChargeId = _.get(req, 'swagger.params.vendorMinimumChargeId.value');
    const vendorMinimumChargeApi = new VendorMinimumChargeAPI(req.$logger, { user });
    const vendorMinimumCharge = await vendorMinimumChargeApi.retrieveById(vendorMinimumChargeId);
    return sendResponse(res, 200, { vendorMinimumCharge });
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const vendorMinimumChargeApi = new VendorMinimumChargeAPI(req.$logger, { user });
    const vendorMinimumCharge = _.get(req, 'swagger.params.data.value');
    const vendorMinimumChargeCreated = await vendorMinimumChargeApi.create(vendorMinimumCharge);
    return sendResponse(res, 200, { vendorMinimumCharge: vendorMinimumChargeCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const vendorMinimumChargeApi = new VendorMinimumChargeAPI(req.$logger, { user });
    const vendorMinimumChargeId = _.get(req, 'swagger.params.vendorMinimumChargeId.value');
    const vendorMinimumCharge = _.get(req, 'swagger.params.data.value');
    vendorMinimumCharge._id = vendorMinimumChargeId;
    const vendorMinimumChargeUpdated = await vendorMinimumChargeApi.update(vendorMinimumCharge);
    return sendResponse(res, 200, { vendorMinimumCharge: vendorMinimumChargeUpdated });
  },
  async retrieveProviderMinimumCharge(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const vendorMinimumChargeApi = new VendorMinimumChargeAPI(req.$logger, { user });
    const filters = {
      vendorId: _.get(req, 'swagger.params.vendorId.value', ''),
      ability: _.get(req, 'swagger.params.ability.value', ''),
      languageCombination: _.get(req, 'swagger.params.languageCombination.value', ''),
    };
    const providerMinimumCharge =
      await vendorMinimumChargeApi.retrieveProviderMinimumCharge(filters);
    return sendResponse(res, 200, { providerMinimumCharge });
  },
};
