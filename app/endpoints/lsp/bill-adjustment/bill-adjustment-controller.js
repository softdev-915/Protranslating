const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const requestUtils = require('../../../utils/request');
const CloudStorage = require('../../../components/cloud-storage');
const BillAdjustmentAPI = require('./bill-adjustment-api');
const BillAdjustmentDocumentAPI = require('./bill-adjustment-document-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');

const { sendResponse, RestError, streamFile } = apiResponse;
const BILL_CREATED_STATUS = 'posted';

module.exports = {
  async billAdjustmentExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new BillAdjustmentAPI({
      log: req.$logger,
      configuration,
      user,
    });
    const tz = _.get(req.session, 'lmsTz', '0');
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'billAdjustmentExport',
    });

    try {
      const file = await paginableApiDecorator.list(filters);

      streamFile(res, file);
    } catch (err) {
      const message = `Failed to export bill adjustments: ${err}`;

      req.$logger.debug(message);
      throw new RestError(500, { message });
    }
  },
  async billAdjustmentList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const api = new BillAdjustmentAPI({
      log: req.$logger,
      configuration,
      user,
      mock: _.get(req.flags, 'mock', false),
    });
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req);
    let billAdjustmentList;

    try {
      billAdjustmentList = await paginableApiDecorator.list(filters);
    } catch (e) {
      const message = e.message || e;

      throw new RestError(500, { message, stack: e.stack });
    }
    return sendResponse(res, 200, billAdjustmentList);
  },
  async billAdjustmentDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billAdjustmentId = _.get(req, 'swagger.params.billAdjustmentId.value');
    const api = new BillAdjustmentAPI({
      log: req.$logger,
      configuration,
      user,
      mock: _.get(req.flags, 'mock', false),
    });
    let billAdjustment;

    try {
      billAdjustment = await api.findOne(billAdjustmentId);
    } catch (e) {
      const message = e.message || e;

      throw new RestError(500, { message, stack: e.stack });
    }
    return sendResponse(res, 200, { billAdjustment })
      .then(() => {
        const syncEntityOnRetrieval = _.get(req.flags, 'syncEntityOnRetrieval', false);
        if (!configuration.environment.IS_PROD && syncEntityOnRetrieval) {
          const siAPI = new SiConnectorAPI(req.flags);
          return siAPI.syncApAdjustments({ _id: billAdjustment._id });
        }
      });
  },
  async billAdjustmentCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const newBillAdjustmentData = _.get(req, 'swagger.params.data.value');
    const syncEntityOnCreation = _.get(req.flags, 'syncEntityOnCreation', true) && !configuration.environment.IS_PROD;
    newBillAdjustmentData.status = BILL_CREATED_STATUS;
    const mock = _.get(req, 'flags.mock', false);
    const api = new BillAdjustmentAPI({
      log: req.$logger,
      configuration,
      user,
      mock,
      syncEntityOnCreation,
    });

    try {
      const newBillAdjustment = await api.create(newBillAdjustmentData, req.flags);
      return sendResponse(res, 200, { billAdjustment: newBillAdjustment })
        .then(() => {
          if (syncEntityOnCreation) {
            const siAPI = new SiConnectorAPI(req.flags);
            return siAPI.syncApAdjustments({ _id: newBillAdjustment._id });
          }
        });
    } catch (error) {
      req.$logger.error(`An error occurred upon creating Bill Adjustment. Error: ${JSON.stringify(error, null, 2)}`);
      throw new RestError(500, { message: `Failed to create bill adjustment: ${error.message}` });
    }
  },
  async billAdjustmentEdit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mock = _.get(req, 'flags.mock', false);
    const api = new BillAdjustmentAPI({
      log: req.$logger, configuration, user, mock,
    });
    const siAPI = new SiConnectorAPI(req.flags);
    let billAdjustment;

    try {
      billAdjustment = await api.edit(_.get(req, 'swagger.params.data.value'));
    } catch (error) {
      req.$logger.error(`An error occurred while updating Bill Adjustment. Error: ${JSON.stringify(error, null, 2)}`);
      const code = _.get(error, 'code', 500);
      const message = _.get(error, 'message', 'An error occurred during update');

      throw new RestError(code, { message });
    }
    return sendResponse(res, 200, { billAdjustment })
      .then(() => siAPI.syncApAdjustments({ _id: billAdjustment._id }));
  },
  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billAdjustmentId = _.get(req, 'swagger.params.billAdjustmentId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const bucket = chooseProperBucket(configuration);
    const api = new BillAdjustmentAPI({
      user,
      configuration,
      log: req.$logger,
      bucket,
      mock: _.get(req.flags, 'mock', false),
    });
    const { file, document } = await api.buildFilePath(billAdjustmentId, documentId);
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
  async serveFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const billAdjustmentId = _.get(req, 'swagger.params.billAdjustmentId.value');
    const bucket = chooseProperBucket(configuration);
    const api = new BillAdjustmentAPI({
      user,
      configuration,
      log: req.$logger,
      bucket,
      mock: _.get(req.flags, 'mock', false),
    });

    try {
      // pass response so the zip stream can be piped
      await api.zipFilesStream(billAdjustmentId, res);
    } catch (e) {
      const message = e.message || e;

      req.$logger.error(`Error serving zip file. Error: ${message}`);
      throw new RestError(500, {
        message: 'Error building zip file',
        stack: e.stack,
      });
    }
  },
  async deleteDocument(req, res) {
    const bucket = chooseProperBucket(configuration);
    const user = requestUtils.getUserFromSession(req);
    const billAdjustmentId = _.get(req, 'swagger.params.billAdjustmentId.value');
    const documentId = decodeURI(_.get(req, 'swagger.params.documentId.value'));
    const apiOptions = {
      user,
      mock: req.flags.mock,
      log: req.$logger,
      configuration,
      bucket,
    };
    const billAdjustmentDocumentApi = new BillAdjustmentDocumentAPI(apiOptions);

    try {
      const updatedBillAdjustment = await billAdjustmentDocumentApi.deleteDocument(billAdjustmentId, documentId);
      return sendResponse(res, 200, { billAdjustment: updatedBillAdjustment });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      req.$logger.error(`Error deleting file. Error: ${err}`);
      throw new RestError(500, { message: 'Error deleting file', stack: _.get(err, 'stack', err) });
    }
  },
};
