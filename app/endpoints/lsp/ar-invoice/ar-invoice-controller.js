const _ = require('lodash');
const { sendResponse, RestError } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const ArInvoiceApi = require('./ar-invoice-api');
const TemplateAPI = require('../template/template-api');
const defaultController = require('../../../utils/default-controller');
const LspAPI = require('../lsp/lsp-api');
const CurrencyAPI = require('../currency/currency-api');

const entityName = 'ar-invoice';
const controller = defaultController(ArInvoiceApi, entityName, { enableAttachmentsHandling: true });

controller.details = async (req, res) => {
  const id = _.get(req, 'swagger.params.id.value');
  try {
    const user = getUserFromSession(req);
    const api = new ArInvoiceApi(req.$logger, { user, configuration, flags: req.flags });
    const entity = await api.getById(id);
    return sendResponse(res, 200, { [entityName]: entity });
  } catch (e) {
    req.$logger.error(`An error occurred while retrieving ${entityName} ${id}. ${e}`);
    throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
  }
};

controller.getFromRequestCurrencyPoLists = async (req, res) => {
  const companyId = _.get(req, 'swagger.params.companyId.value');
  const arInvoiceApi = new ArInvoiceApi(
    req.$logger,
    { user: getUserFromSession(req), configuration, flags: req.flags },
  );
  let result;
  try {
    result = await arInvoiceApi.getFromRequestCurrencyPoLists(companyId);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`An error occurred while retrieving PO and currency lists from request. Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
  return sendResponse(res, 200, result);
};

controller.getInvoiceTemplate = async (req, res) => {
  const invoiceId = _.get(req, 'swagger.params.id.value');
  const templateId = _.get(req, 'swagger.params.templateId.value');
  const user = getUserFromSession(req);
  const lspAPI = new LspAPI({ logger: req.$logger, user: user, configuration });
  const arInvoiceApi = new ArInvoiceApi(
    req.$logger,
    { user: getUserFromSession(req), configuration, flags: req.flags },
  );
  const currencyApi = new CurrencyAPI(req.$logger, { user, configuration });
  const templateApi = new TemplateAPI(req.$logger, { user, configuration });
  let result;
  try {
    const invoice = await arInvoiceApi.getById(invoiceId, null, true);
    const promiseCurrency = currencyApi.list({ _id: invoice.accounting.currency._id });
    const promiseTemplate = templateApi.retrieveById(templateId);
    const promiseFooterTemplate = templateApi.retrieveFooterByTemplateId(templateId);
    const promiseLsp = lspAPI.lspDetail();
    const promises = await Promise
      .all([promiseTemplate, promiseFooterTemplate, promiseLsp, promiseCurrency]);
    result = await arInvoiceApi.getTemplateData(invoice, ...promises);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`An error occurred while generating ${entityName} template. Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
  return sendResponse(res, 200, result);
};

controller.invoiceActivity = async (req, res) => {
  const invoiceId = _.get(req, 'swagger.params.id.value');
  const arInvoiceApi = new ArInvoiceApi(
    req.$logger,
    { user: getUserFromSession(req), configuration, flags: req.flags },
  );
  let invoiceActivity;
  try {
    invoiceActivity = await arInvoiceApi.getInvoiceActivity(invoiceId);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`An error occurred while retrieving ${entityName} ${invoiceId}. Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
  return sendResponse(res, 200, invoiceActivity);
};

controller.reverseInvoice = async (req, res) => {
  const invoiceId = _.get(req, 'swagger.params.id.value');
  const { reversedOnDate, memo } = _.get(req, 'swagger.params.data.value');
  const arInvoiceApi = new ArInvoiceApi(
    req.$logger,
    { user: getUserFromSession(req), configuration, flags: req.flags },
  );
  let result;
  try {
    result = await arInvoiceApi.reverseInvoice(invoiceId, reversedOnDate, memo);
  } catch (err) {
    const message = err.message || err;
    req.$logger.error(`An error occurred while reversing an invoice with id ${invoiceId}. Error: ${message}`);
    throw new RestError(500, { message, stack: err.stack });
  }
  return sendResponse(res, 200, result);
};

module.exports = controller;
