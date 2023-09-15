const _ = require('lodash');
const TaxFormAPI = require('./tax-form-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;
const { pipeWithErrors } = require('../../../utils/stream/');

module.exports = {
  async taxFormExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new TaxFormAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'taxFormExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async taxFormList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const taxFormId = _.get(req, 'swagger.params.taxFormId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    // Set filter params
    filters.__tz = _.get(req.headers, 'lms-tz', '0');
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const taxFormAPI = new TaxFormAPI(req.$logger, { user });
    if (taxFormId) {
      const taxForm = await taxFormAPI.findOne(taxFormId);
      if (taxForm) {
        return sendResponse(res, 200, { taxForm });
      }
      throw new RestError(404, { message: `Tax form ${taxFormId} does not exist` });
    } else {
      const paginableApiDecorator = new PaginableAPIDecorator(taxFormAPI, req);
      const taxForms = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, taxForms);
    }
  },
  async taxFormCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const taxFormAPI = new TaxFormAPI(req.$logger, { user });
    const taxForm = _.get(req, 'swagger.params.data.value');
    const taxFormCreated = await taxFormAPI.create(taxForm);
    return sendResponse(res, 200, { taxForm: taxFormCreated });
  },
  async taxFormUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const taxFormAPI = new TaxFormAPI(req.$logger, { user });
    const taxFormId = _.get(req, 'swagger.params.taxFormId.value');
    const taxForm = _.get(req, 'swagger.params.data.value');
    taxForm._id = taxFormId;
    const taxFormUpdated = await taxFormAPI.update(taxForm);
    return sendResponse(res, 200, { taxForm: taxFormUpdated });
  },
};
