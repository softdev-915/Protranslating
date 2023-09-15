const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream');
const ArInvoiceEntryApi = require('./ar-invoice-entry-api');

const { sendResponse, RestError, fileContentDisposition } = apiResponse;
const getList = async (req, api, listMethod) => {
  const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod });
  const queryRequest = _.get(req, 'query');
  const filters = { __tz: _.get(req.headers, 'lms-tz', '0'), ...queryRequest };
  let list;
  try {
    list = await paginableApiDecorator.list(filters);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`An error occurred while retrieving a list for method ${listMethod}. Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
  return list;
};

module.exports = {

  async invoiceEntriesExport(req, res) {
    const api = new ArInvoiceEntryApi(req.$logger, {
      user: getUserFromSession(req),
      configuration,
    });
    const _id = _.get(req, 'swagger.params.id.value');
    const params = _.isNil(_id) ? _.pick(req.query, ['companyId', 'currencyId', 'purchaseOrder']) : { _id };
    const filters = {
      params,
      __tz: _.get(req.headers, 'lms-tz', '0'),
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'export', req });
    const csvStream = await paginableApiDecorator.list(filters, res);
    res.setHeader(
      'Content-Disposition',
      fileContentDisposition(`${csvStream.__filename}.csv`),
    );
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },

  async list(req, res) {
    const arInvoiceEntriesApi = new ArInvoiceEntryApi(req.$logger, {
      user: getUserFromSession(req),
      configuration,
    });
    const invoiceId = _.get(req, 'query.params._id', '');
    const listMethod = invoiceId ? 'listExistingInvoiceEntries' : 'listNewInvoiceEntries';
    const arInvoiceEntries = await getList(req, arInvoiceEntriesApi, listMethod);
    return sendResponse(res, 200, arInvoiceEntries);
  },

};
