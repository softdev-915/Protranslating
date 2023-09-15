const _ = require('lodash');
const moment = require('moment');
const apiResponse = require('../../../components/api-response');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const requestUtils = require('../../../utils/request');
const CloudStorage = require('../../../components/cloud-storage');
const BillAPI = require('./bill-api');
const BillDocumentApi = require('./bill-document-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream');
const configuration = require('../../../components/configuration');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const BillVariableRateScheduler = require('../../../components/scheduler/bill-variable-rate/index');
const BillFlatRateScheduler = require('../../../components/scheduler/bill-flat-rate/index');
const BillInvoicePerPeriodScheduler = require('../../../components/scheduler/bill-invoice-per-period/index');
const BillMonthlyVendorScheduler = require('../../../components/scheduler/bill-monthly-vendor/index');
const { getUserFromSession } = require('../../../utils/request');
const TemplateAPI = require('../template/template-api');
const LspAPI = require('../lsp/lsp-api');

const schedulerBillTypeMapping = {
  'bill-invoice-per-period': BillInvoicePerPeriodScheduler,
  'bill-flat-rate': BillFlatRateScheduler,
  'bill-variable-rate': BillVariableRateScheduler,
  'bill-monthly-vendor': BillMonthlyVendorScheduler,
};
const { sendResponse, RestError, fileContentDisposition } = apiResponse;

module.exports = {
  async billExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new BillAPI({
      log: req.$logger,
      configuration,
      user,
    });
    const tz = _.get(req.session, 'lmsTz', '0');
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'billExport',
    });
    const csvStream = await paginableApiDecorator.list(filters, res);

    res.setHeader(
      'Content-Disposition',
      fileContentDisposition(`${csvStream.__filename}.csv`),
    );
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async billList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const api = new BillAPI({
      log: req.$logger,
      configuration,
      user,
    });
    const customFilters = _.get(req, 'query.params.filter');
    const filters = {
      __tz: tz,
      vendorId: _.get(customFilters, 'vendorId', null),
      isSynced: _.get(customFilters, 'isSynced', null),
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req);
    let billList;

    try {
      billList = await paginableApiDecorator.list(filters);
    } catch (e) {
      const message = e.message || e;

      throw new RestError(500, { message, stack: e.stack });
    }
    return sendResponse(res, 200, billList);
  },
  async billDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billId = _.get(req, 'swagger.params.billId.value');
    const api = new BillAPI({
      log: req.$logger,
      configuration,
      user,
    });
    let bill;

    try {
      bill = await api.findOne(billId);
    } catch (e) {
      const message = e.message || e;

      throw new RestError(500, { message, stack: e.stack });
    }
    return sendResponse(res, 200, { bill });
  },

  async billEdit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { NODE_ENV } = configuration.environment;
    const mock = _.get(req.flags, 'mock', false);
    const shouldSyncBill = mock && NODE_ENV !== 'PROD';
    const billUpdateData = _.get(req, 'swagger.params.data.value');

    try {
      const api = new BillAPI({
        log: req.$logger,
        configuration,
        user,
      });
      const originalBill = await api.findOne(billUpdateData._id);
      const editedBill = await api.update(billUpdateData);
      return sendResponse(res, 200, editedBill)
        .then(() => {
          const isSameGlPostingDate = moment(originalBill.glPostingDate)
            .isSame(editedBill.glPostingDate);
          if (!isSameGlPostingDate || shouldSyncBill) {
            const siAPI = new SiConnectorAPI(req.flags);
            return siAPI.syncApBills({ _id: editedBill._id });
          }
        });
    } catch (e) {
      throw new RestError(500, { message: `Failed to create bill: ${e.message}`, stack: e.stack });
    }
  },
  async createBillsForVendor(req, res) {
    const { NODE_ENV } = configuration.environment;
    const isProd = NODE_ENV === 'PROD';
    const user = requestUtils.getUserFromSession(req);
    const vendorId = _.get(req, 'swagger.params.vendorId.value', undefined);
    const billType = _.get(req, 'swagger.params.billType.value');
    const SchedulerStrategy = _.get(schedulerBillTypeMapping, billType);

    try {
      const scheduler = new SchedulerStrategy(user, req.flags);

      if (_.isNil(scheduler)) {
        throw new RestError(500, { message: 'Failed to find scheduler to create bills' });
      }
      if (_.get(req, 'flags.mockSchedulerInactive', false)) {
        throw new RestError(503, { message: 'This scheduler cannot be executed because is inactive' });
      }
      const createdBills = await scheduler.createBills(vendorId);
      const responseMessage = createdBills.length
        ? `${createdBills.length} bills were created`
        : 'No tasks to be processed';
      try {
        const syncEntityOnCreation = _.get(req.flags, 'syncEntityOnCreation', true) || isProd;
        if (_.isFunction(scheduler.syncCreatedBills) && syncEntityOnCreation) {
          await scheduler.syncCreatedBills();
        }
      } catch (err) {
        req.$logger.error(`Error syncing bills for vendor ${vendorId}; ${err}`);
      }
      return sendResponse(res, 200, responseMessage);
    } catch (e) {
      throw new RestError(500, { message: `Failed to create bills for vendor ${vendorId}: ${e.message}`, stack: e.stack });
    }
  },
  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billId = _.get(req, 'swagger.params.billId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const bucket = chooseProperBucket(configuration);
    const billApi = new BillAPI({
      user,
      configuration,
      log: req.$logger,
      bucket,
    });
    const { file, document } = await billApi.buildFilePath(billId, documentId);
    const filePathWithName = file.path;
    const documentCloudKey = _.get(document, 'cloudKey', filePathWithName);
    const cloudStorage = new CloudStorage(configuration);

    try {
      const cloudFile = await cloudStorage.gcsGetFile(documentCloudKey);
      const url = await cloudStorage.gcsGetFileDownloadUrl(cloudFile.name);
      return sendResponse(res, 200, url);
    } catch (error) {
      throw new RestError(404, { message: 'The file does not exist', stack: error.stack });
    }
  },

  async deleteDocument(req, res) {
    const bucket = chooseProperBucket(configuration);
    const user = requestUtils.getUserFromSession(req);
    const billId = _.get(req, 'swagger.params.billId.value');
    const documentId = decodeURI(_.get(req, 'swagger.params.documentId.value'));
    const apiOptions = {
      user,
      mock: req.flags.mock,
      log: req.$logger,
      configuration,
      bucket,
    };
    const billDocumentApi = new BillDocumentApi(apiOptions);

    try {
      const updatedBill = await billDocumentApi.deleteDocument(billId, documentId);
      return sendResponse(res, 200, { bill: updatedBill });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      req.$logger.error(`Error deleting file. Error: ${err}`);
      throw new RestError(500, { message: 'Error deleting file', stack: _.get(err, 'stack', err) });
    }
  },

  async serveFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billId = _.get(req, 'swagger.params.billId.value');
    const bucket = chooseProperBucket(configuration);
    const api = new BillAPI({
      user,
      configuration,
      log: req.$logger,
      bucket,
    });

    try {
      await api.zipFilesStream(billId, res);
    } catch (e) {
      const message = e.message || e;

      req.$logger.error(`Error serving zip file. Error: ${message}`);
      throw new RestError(500, {
        message: 'Error building zip file',
        stack: e.stack,
      });
    }
  },
  async getBillPreview(req, res) {
    const utcOffsetInMinutes = _.toNumber(_.get(req.session, 'lmsTz', '0'));
    const billId = _.get(req, 'swagger.params.billId.value');
    const templateId = _.get(req, 'swagger.params.templateId.value');
    const user = getUserFromSession(req);
    const billApi = new BillAPI({
      log: req.$logger,
      configuration,
      user,
    });
    const lspApi = new LspAPI({
      logger: req.$logger,
      configuration,
      user,
    });
    const templateApi = new TemplateAPI(req.$logger, { user, configuration });
    let result;
    try {
      const promiseBill = billApi.findOne(billId);
      const promiseTemplate = templateApi.retrieveById(templateId);
      const promiseFooterTemplate = templateApi.retrieveFooterByTemplateId(templateId);
      const promiseLsp = lspApi.lspDetail();
      const promises = await Promise.all([promiseBill,
        promiseTemplate, promiseLsp, promiseFooterTemplate]);
      result = await billApi.getPreview(...promises, utcOffsetInMinutes);
    } catch (err) {
      const message = err.message || err;
      req.$logger.error(`An error occurred while generating bill template. Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
    return sendResponse(res, 200, result);
  },
};
