const _ = require('lodash');
const BillingTermAPI = require('./billing-term-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;
const { pipeWithErrors } = require('../../../utils/stream/');

module.exports = {
  async billingTermExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new BillingTermAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'billingTermExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billingTermId = _.get(req, 'swagger.params.billingTermId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    // Set filter params
    filters.__tz = _.get(req.headers, 'lms-tz', '0');
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (billingTermId) {
      filters._id = billingTermId;
    }
    const billingTermAPI = new BillingTermAPI(req.$logger, { user, configuration });
    const paginableApiDecorator = new PaginableAPIDecorator(billingTermAPI, req);
    const billingTerms = await paginableApiDecorator.list(filters);

    if (billingTermId) {
      if (billingTerms && Array.isArray(billingTerms.list) && billingTerms.list.length) {
        return sendResponse(res, 200, {
          billingTerm: billingTerms.list[0],
        });
      }
      throw new RestError(404, { message: `Billing term ${billingTermId} does not exist` });
    } else {
      return sendResponse(res, 200, billingTerms);
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billingTermAPI = new BillingTermAPI(req.$logger, { user, configuration });
    const billingTerm = _.get(req, 'swagger.params.data.value');
    const billingTermCreated = await billingTermAPI.create(billingTerm);
    return sendResponse(res, 200, { billingTerm: billingTermCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billingTermAPI = new BillingTermAPI(req.$logger, { user, configuration });
    const billingTermId = _.get(req, 'swagger.params.billingTermId.value');
    const billingTerm = _.get(req, 'swagger.params.data.value');
    billingTerm._id = billingTermId;
    const billingTermUpdated = await billingTermAPI.update(billingTerm);
    return sendResponse(res, 200, { billingTerm: billingTermUpdated });
  },
};
