const moment = require('moment');
const Promise = require('bluebird');
const _ = require('lodash');
const multer = require('multer');
const busboy = require('connect-busboy');
const mongoose = require('mongoose');
const { query, validationResult } = require('express-validator');
const contactStream = require('concat-stream');
const CloudStorage = require('./index');
const StorageEngine = require('./storage-engine');
const defaultLogger = require('../log/logger');
const { models: mongooseSchema } = require('../database/mongo');
const apiResponse = require('../api-response');
const requestUtils = require('../../utils/request');
const { getRoles, hasOneOfRoleList } = require('../../utils/roles');
const fileUtils = require('../../utils/file');
const { streamToBuffer } = require('../../utils/stream');
const RequestAPI = require('../../endpoints/lsp/request/request-api');
const ActivityApi = require('../../endpoints/lsp/activity/activity-api');
const BillAPI = require('../../endpoints/lsp/bill/bill-api');
const BillAdjustmentAPI = require('../../endpoints/lsp/bill-adjustment/bill-adjustment-api');
const RequestDocumentApi = require('../../endpoints/lsp/company/request/document/request-document-api');
const BillDocumentApi = require('../../endpoints/lsp/bill/bill-document-api');
const BillAdjustmentDocumentApi = require('../../endpoints/lsp/bill-adjustment/bill-adjustment-document-api');
const RequestTaskAPI = require('../../endpoints/lsp/request/task/request-task-api');
const ActivityDocumentAPI = require('../../endpoints/lsp/activity/document/activity-document-api');
const ArAdvanceApi = require('../../endpoints/lsp/ar-advance/ar-advance-api');
const ArAdjustmentsApi = require('../../endpoints/lsp/ar-adjustment/ar-adjustment-api');
const ArPaymentApi = require('../../endpoints/lsp/ar-payment/ar-payment-api');
const ArInvoiceApi = require('../../endpoints/lsp/ar-invoice/ar-invoice-api');
const ApPaymentApi = require('../../endpoints/lsp/ap-payment/ap-payment-api');
const ArInvoiceEntryApi = require('../../endpoints/lsp/ar-invoice/ar-invoice-entry-api');
const ApPaymentEntryApi = require('../../endpoints/lsp/ap-payment/ap-payment-entry-api');
const PcSettingsApi = require('../../endpoints/lsp/portalcat-settings/portalcat-settings-api');
const WorkflowAPI = require('../../endpoints/lsp/request/workflow/workflow-api');
const { areObjectIdsEqual } = require('../../utils/schema');

const DOCUMENT_PENDING_UPLOAD_STATE = 'pending';
const { Types: { ObjectId } } = mongoose;
const { RestError, sendResponse, sendErrorResponse } = apiResponse;
const AWS_FILE_KEYPATH_PROP = 'Key';
const GCS_FILE_KEYPATH_PROP = 'name';
const ALLOWED_PROSPECT_FILES_DELETION_HOURS = /13|14/;
const CAT_RESOURCE_TYPE_SR = 'sr';
const CAT_RESOURCE_TYPE_TB = 'tb';
const CAT_RESOURCE_TYPE_TM = 'tm';
const createStorageEngine = (app, configuration, logger = defaultLogger) => {
  // Create Storage
  app.use(busboy());
  const cloudStorage = new CloudStorage(configuration, logger);
  // keep storage available
  app.use((req, res, next) => {
    req.cloudStorage = cloudStorage;
    next();
  });
  return new StorageEngine({
    configuration,
    awsBucket: cloudStorage.awsBucket,
    gcsBucket: cloudStorage.gcsBucket,
  });
};
const SUPPORTING_FILE_UPLOAD_APIS = {
  'ar-advance': {
    ApiClass: ArAdvanceApi,
    requiredRoles: ['AR-PAYMENT_UPDATE_ALL', 'AR-PAYMENT_UPDATE_OWN'],
  },
  'ar-adjustment': {
    ApiClass: ArAdjustmentsApi,
    requiredRoles: ['AR-ADJUSTMENT_UPDATE_ALL', 'AR-ADJUSTMENT_UPDATE_OWN'],
  },
  'ar-payment': {
    ApiClass: ArPaymentApi,
    requiredRoles: ['AR-PAYMENT_UPDATE_ALL', 'AR-PAYMENT_UPDATE_OWN'],
  },
  'ar-invoice': {
    ApiClass: ArInvoiceApi,
    requiredRoles: ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'],
  },
  'ap-payment': {
    ApiClass: ApPaymentApi,
    requiredRoles: ['AP-PAYMENT_UPDATE_ALL', 'AP-PAYMENT-FILES_UPDATE_OWN'],
  },
};
const userLspCheck = (req, res, next) => {
  // Throw err if userId doesn't exist or doesn't belong to the current lsp
  const userInSession = requestUtils.getUserFromSession(req);
  const lspId = _.get(userInSession, 'lsp._id');
  const userId = _.get(req, 'params.userId');
  // When uploading documents for a new user userId is not defined yet, so we can't check existence
  if (userId !== 'undefined') {
    // check that the userId exists and belongs to the lsp
    mongooseSchema.User.findOneWithDeleted({
      lsp: lspId,
      _id: new ObjectId(userId),
    }).then((user) => {
      if (!user) {
        const err = `Invalid user id provided during user-document-prospect upload: ${userId}`;
        defaultLogger.error(err);
        next(new RestError(403, { message: err }));
      } else {
        next();
      }
    }).catch((err) => next(err));
  } else {
    next();
  }
};

const deleteOldCloudProspects = async (req, prefixRegex) => {
  const { cloudStorage } = req;
  const currentDate = moment.utc();
  const yesterdayDate = moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm');
  if (currentDate.hours().toString().match(ALLOWED_PROSPECT_FILES_DELETION_HOURS)) {
    const files = await cloudStorage.getProspectFilesOlderThanDate(yesterdayDate, prefixRegex);
    return Promise.map(files, (file) => {
      if (file) {
        const awsFilePath = _.get(file, AWS_FILE_KEYPATH_PROP);
        const keyFilePath = _.get(file, GCS_FILE_KEYPATH_PROP, awsFilePath);
        if (keyFilePath) {
          defaultLogger.info(`Cloud storage interceptor: About to delete prospect file with filePath ${keyFilePath}`);
          const errHandler = (err) => {
            const message = _.get(err, 'message', err);
            defaultLogger.debug(message);
            return Promise.resolve();
          };
          try {
            return cloudStorage.deleteFile(keyFilePath).catch(errHandler);
          } catch (err) {
            errHandler(err);
          }
        }
      }
    });
  }
};

const uploadedFilesList = async (req, res) => {
  let files = _.get(req, 'files', []);
  if (!Array.isArray(files)) {
    files = [files];
  }
  const ids = files.map((f) => f.documentProspectId);
  const uploadedDocs = await mongooseSchema.DocumentProspect.find({ _id: { $in: ids } });
  return sendResponse(res, 200, { documents: uploadedDocs });
};

const uploadedUserProspectSingleFile = async (req, res) => {
  const fileId = _.get(req, 'file.documentProspectId._id');
  const uploadedDoc = await mongooseSchema.UserDocumentProspect.findOne({ _id: fileId });
  return sendResponse(res, 200, { document: uploadedDoc });
};

// eslint-disable-next-line arrow-body-style
const performPermissionCheck = (expectedRoles) => {
  return (req, res, next) => {
    const user = requestUtils.getUserFromSession(req);
    const roles = getRoles(user);
    const hasAtLeastOneOfRoleList = hasOneOfRoleList(roles, expectedRoles);
    if (hasAtLeastOneOfRoleList) {
      return next();
    }
    return sendErrorResponse(res, 403, {
      message: 'User is not authorized',
      stack: true,
    });
  };
};

const _buildCommonProspectData = (req) => {
  const user = requestUtils.getUserFromSession(req);
  const userId = _.get(req, 'params.userId');
  const activityId = _.get(req, 'params.activityId');
  const prospectFields = {
    user: _.get(user, '_id', null),
    createdBy: _.get(user, 'email'),
    ip: requestUtils.extractUserIp(req),
    lspId: _.get(user, 'lsp._id'),
    fileType: _.get(req, 'query.fileType'),
  };
  if (activityId) {
    prospectFields.activityId = activityId;
  } else {
    prospectFields.userId = userId;
  }
  return prospectFields;
};

/**
 * Builds a prospect schema
 * @param {Object} options to build the schema
 * @param {String} userFilters.metaType optional metadata metaType
 * @param {Object} userFilters.prospectFields prospect fields
 * @param {Object} userFilters.fileMetadata specific prospect data about the file
 * @param {String} userFilters.schema optional schema name
 */
const prospectFactory = (req, options) => {
  const commonFields = _buildCommonProspectData(req);
  const metaType = _.get(options, 'type', 'DocumentProspect');
  const schemaName = _.get(options, 'schema', 'DocumentProspect');
  const fileMetadata = _.get(options, 'fileMetadata', {});
  Object.assign(fileMetadata, {
    metaType,
  });
  const prospectFields = { ...options.prospectFields, ...commonFields, fileMetadata };
  return new mongooseSchema[schemaName](prospectFields);
};

const interceptor = (app, configuration, logger) => {
  defaultLogger.debug('Interceptor: Received request');
  const cloudStorageEngine = createStorageEngine(app, configuration, logger);
  const uploadInterceptor = multer({
    storage: cloudStorageEngine,
  });
  const multerUploadingHandler = (res, next, err) => {
    if (err) {
      const message = _.get(err, 'message', err);
      defaultLogger.error(`An error ocurred upon uploading document prospect to the cloud: ${message}`);
      sendErrorResponse(res, 500, {
        message: 'Document uploading failed. Try uploading again',
      });
    } else {
      next();
    }
  };

  const processRequestWorkflowFiles = async (req, res, next) => {
    const bucket = cloudStorageEngine.gcsBucket;
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(user, 'lsp._id', _.get(req, 'params.lspId', '')).toString();
    const languageCombinationId = _.get(req, 'query.languageCombinationId');
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
    });
    const requestId = _.get(req, 'params.requestId');
    defaultLogger.debug(`Interceptor: Processing busboy file: UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
    if (_.isNil(requestId)) {
      defaultLogger.debug('Interceptor: Request id not received');
      return sendErrorResponse(res, 400, {
        message: 'Request id not received',
        stack: true,
      });
    }
    let request;
    try {
      defaultLogger.debug(`Interceptor: Searching request in db. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
      request = await requestApi.findOne(requestId);
    } catch (error) {
      defaultLogger.debug(`Interceptor: Request with _id ${requestId} was not found in db. UserId: ${user._id.toString()}, lspId: ${lspId}`);
      next(error);
    }
    if (_.isNil(request)) {
      return sendErrorResponse(res, 404, {
        message: 'Request was not found',
        stack: true,
      });
    }
    // We store the original objects for knowing if something changed and send notifications later
    const originalLanguageCombinations = _.clone(request.languageCombinations);
    const companyId = _.get(request, 'company.id', request.company);
    defaultLogger.debug(`Interceptor: Request company is ${companyId}. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
    const { workflowId, taskId, providerTaskId } = _.get(req, 'params');

    if (!_.isEmpty(workflowId)) {
      const workflows = _.get(request, 'workflows', []);
      const matchedWorkflow = workflows.find((w) => areObjectIdsEqual(w._id, workflowId));
      if (_.isEmpty(matchedWorkflow)) {
        return sendErrorResponse(res, 404, {
          message: 'Workflow was not found',
          request,
          stack: true,
        });
      }
      const workflowUpdatedAt = moment(_.get(matchedWorkflow, 'updatedAt'));
      const sessionWorkflowReadDate = _.get(user, `readDates.workflow.${workflowId}`);
      if (
        _.isEmpty(sessionWorkflowReadDate)
        || workflowUpdatedAt.diff(moment(sessionWorkflowReadDate)) !== 0
      ) {
        return sendErrorResponse(res, 400, {
          message: 'This workflow was changed from a different browser window or tab. To see the new content, open this page in a new tab or refresh this page',
          request,
          stack: true,
        });
      }
    }
    const uploadParams = {
      req,
      requestId,
      companyId,
      workflowId,
      taskId,
      providerTaskId,
      requestApi,
      lspId,
      user,
      bucket,
      translationRequest: request,
      languageCombinationId,
      failedUploads: [],
    };

    if (_.isEmpty(request)) {
      defaultLogger.debug(`Interceptor: Request was not found in the database. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
      return sendErrorResponse(res, 404, {
        message: 'Request was not found in the database',
        request,
        stack: true,
      });
    }
    if (_.isNil(request?.company?._id)) {
      defaultLogger.debug(`Interceptor: Request company is inactive. Company id ${companyId}. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
      return sendErrorResponse(res, 500, {
        message: 'Request company is inactive',
        request,
        stack: true,
      });
    }
    if (_.isNil(companyId)) {
      defaultLogger.debug(`Interceptor: Request company not received. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
      return sendErrorResponse(res, 400, {
        message: 'Request company not received',
        request,
        stack: true,
      });
    }
    Object.assign(uploadParams, { mock: _.get(req, 'flags.mock', false) });
    try {
      await cloudStorageEngine._handleBusboyMultipleFilesUpload(req, uploadParams);
      const filesData = _.get(uploadParams, 'filesData');
      const newDocuments = await Promise.mapSeries(
        Object.keys(filesData.files),
        async (fileIndex) => {
          const {
            gcsFile, mimetype, encoding, documentId, bytesReader, failed, filename,
          } = filesData.files[fileIndex];
          if (failed) {
            uploadParams.failedUploads.push(filename);
            return;
          }
          const uploadedFileMetadata = _.get(filesData, `metadata[${fileIndex}]`);
          defaultLogger.debug(`Interceptor: Successfully uploaded file to gcs: ${gcsFile.name}. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
          const { md5Hash } = gcsFile.metadata;
          const newDocument = {
            _id: documentId,
            name: fileUtils.getFilename(gcsFile.name),
            mime: mimetype,
            encoding,
            cloudKey: gcsFile.name,
            size: bytesReader.bytes,
            md5Hash: _.defaultTo(md5Hash, DOCUMENT_PENDING_UPLOAD_STATE),
            ip: requestUtils.extractUserIp(req),
            user: _.get(user, '_id', null),
            createdBy: _.get(user, 'email'),
            createdAt: moment().utc().toDate(),
            final: _.get(uploadedFileMetadata, 'final', false),
          };
          await req._handleFileUpload({ ...uploadParams, newDocument });
          return newDocument;
        },
      );
      if (_.isFunction(req._handleFilesUpload)) {
        await req._handleFilesUpload({ ...uploadParams, newDocuments });
      }
      const editedRequest = await requestApi.findOne(requestId);
      request.languageCombinations = originalLanguageCombinations.map((l) => {
        l.documents = l.documents.filter((d) => !d.deleted);
        return l;
      });
      await requestApi.afterRequestSaveHook(request, editedRequest, false);
      if (!_.isEmpty(uploadParams.failedUploads)) {
        throw new RestError(500, { message: 'Some files failed to upload' });
      }
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      req.unpipe(req.busboy);
      const handleRequestEnd = async () => {
        const message = _.get(err, 'message', err);
        defaultLogger.error(`Failed to upload file to the cloud: ${message}. UserId: ${user._id.toString()}, requestId: ${requestId}, lspId: ${lspId}`);
        const requestReadAgain = await uploadParams.requestApi.findOne(uploadParams.requestId);
        return sendErrorResponse(res, 500, {
          failedUploads: uploadParams.failedUploads,
          request: requestReadAgain,
          message,
        });
      };
      if (!req.complete) {
        req.resume();
        req.on('error', handleRequestEnd);
        req.on('end', handleRequestEnd);
      } else {
        handleRequestEnd();
      }
    }
  };

  const processBillFiles = async (req, res) => {
    const bucket = cloudStorageEngine.gcsBucket;
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(user, 'lsp._id', _.get(req, 'params.lspId', ''));
    const billApi = new BillAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
    });
    const billId = _.get(req, 'params.billId');
    defaultLogger.debug(`Interceptor: Processing busboy file: UserId: ${user._id.toString()}, billId: ${billId}, lspId: ${lspId}`);
    const bill = await billApi.findOne({ _id: billId });
    if (_.isNil(bill)) {
      defaultLogger.debug(`Interceptor: Bill was not found in the database. Bill id ${billId}`);
      return sendErrorResponse(res, 404, {
        message: 'Bill was not found in the database',
        bill,
        stack: true,
      });
    }
    const uploadParams = {
      req,
      billId,
      lspId,
      user,
      bucket,
      billApi,
      bill,
    };
    let filename;
    Object.assign(uploadParams, { mock: _.get(req, 'flags.mock', false) });
    try {
      defaultLogger.debug(`Interceptor: About to upload file to cloud. Bill Id: ${billId}`);
      await cloudStorageEngine._handleBusboyFileUpload(req, res, uploadParams)
        .then(async (uploadResponse) => {
          defaultLogger.debug(`Interceptor: Successfully uploaded file to gcs: ${_.get(uploadResponse, 'gcsFile.name')}`);
          const { size, md5Hash } = _.get(uploadResponse, 'gcsFile.metadata');
          const { mimetype, encoding } = uploadParams;
          const newDocument = {
            _id: uploadResponse.documentId,
            name: fileUtils.getFilename(_.get(uploadResponse.gcsFile, 'name')),
            mime: mimetype,
            size,
            encoding,
            cloudKey: _.get(uploadResponse.gcsFile, 'name'),
            md5Hash: _.defaultTo(md5Hash, DOCUMENT_PENDING_UPLOAD_STATE),
            ip: requestUtils.extractUserIp(req),
            user: _.get(user, '_id', null),
            createdBy: _.get(user, 'email'),
            createdAt: moment().utc().toDate(),
          };
          await req._handleFileUpload(_.assign(uploadParams, { newDocument }));
          const editedBill = await billApi.findOne(billId);
          return sendResponse(res, 200, { bill: editedBill });
        })
        .catch(async (err) => {
          const message = _.get(err, 'message', err);
          filename = _.get(uploadParams, 'filename');
          defaultLogger.error(`Interceptor: Failed to handle file: ${filename}: ${message}`);
          return sendErrorResponse(res, 500, {
            message: `Interceptor: Failed to upload file with name: ${filename}. ${message}`,
            stack: true,
          });
        });
    } catch (err) {
      const message = _.get(err, 'message', err);
      defaultLogger.error(`Failed to upload file ${filename} to the cloud: ${message}`);
      return sendErrorResponse(res, 500, {
        message: `Interceptor: Failed to upload file ${filename} to cloud`,
        stack: message,
      });
    }
  };

  const processBillAdjustmentFiles = async (req, res) => {
    const bucket = cloudStorageEngine.gcsBucket;
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(user, 'lsp._id', _.get(req, 'params.lspId', ''));
    const billAdjustmentApi = new BillAdjustmentAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
    });
    const billAdjustmentId = _.get(req, 'params.billAdjustmentId');
    defaultLogger.debug(`Interceptor: Processing busboy file: UserId: ${user._id.toString()}, billAdjustmentId: ${billAdjustmentId}, lspId: ${lspId}`);
    const billAdjustment = await billAdjustmentApi.findOne({ _id: billAdjustmentId });
    if (_.isNil(billAdjustment)) {
      defaultLogger.debug(`Interceptor: Bill Adjustment was not found in the database. Bill Adjustment id ${billAdjustmentId}`);
      return sendErrorResponse(res, 404, {
        message: 'Bill Adjustment was not found in the database',
        billAdjustment,
        stack: true,
      });
    }
    const uploadParams = {
      req,
      billAdjustmentId,
      lspId,
      user,
      bucket,
      billAdjustmentApi,
      billAdjustment,
    };
    let filename;
    Object.assign(uploadParams, { mock: _.get(req, 'flags.mock', false) });
    try {
      defaultLogger.debug(`Interceptor: About to upload file to cloud. Bill Adjustment Id: ${billAdjustmentId}`);
      await cloudStorageEngine._handleBusboyFileUpload(req, res, uploadParams)
        .then(async (uploadResponse) => {
          defaultLogger.debug(`Interceptor: Successfully uploaded file to gcs: ${_.get(uploadResponse, 'gcsFile.name')}`);
          const { size, md5Hash } = _.get(uploadResponse, 'gcsFile.metadata');
          const { mimetype, encoding } = uploadParams;
          const newDocument = {
            _id: uploadResponse.documentId,
            name: fileUtils.getFilename(_.get(uploadResponse.gcsFile, 'name')),
            mime: mimetype,
            size,
            encoding,
            cloudKey: _.get(uploadResponse.gcsFile, 'name'),
            md5Hash: _.defaultTo(md5Hash, DOCUMENT_PENDING_UPLOAD_STATE),
            ip: requestUtils.extractUserIp(req),
            user: _.get(user, '_id', null),
            createdBy: _.get(user, 'email'),
            createdAt: moment().utc().toDate(),
          };
          await req._handleFileUpload(_.assign(uploadParams, { newDocument }));
          const editedBillAdjustment = await billAdjustmentApi.findOne(billAdjustmentId);
          return sendResponse(res, 200, { billAdjustment: editedBillAdjustment });
        })
        .catch(async (err) => {
          const message = _.get(err, 'message', err);
          filename = _.get(uploadParams, 'filename');
          defaultLogger.error(`Interceptor: Failed to handle file: ${filename}: ${message}`);
          return sendErrorResponse(res, 500, {
            message: `Interceptor: Failed to upload file with name: ${filename}. ${message}`,
            stack: true,
          });
        });
    } catch (err) {
      const message = _.get(err, 'message', err);
      defaultLogger.error(`Failed to upload file ${filename} to the cloud: ${message}`);
      return sendErrorResponse(res, 500, {
        message: `Interceptor: Failed to upload file ${filename} to cloud`,
        stack: message,
      });
    }
  };

  // eslint-disable-next-line no-unused-vars
  const processBusboyFiles = async (req, res) => {
    const bucket = cloudStorageEngine.gcsBucket;
    const uploadParams = { bucket, mock: _.get(req, 'flags.mock', false) };
    try {
      if (_.isFunction(req._preFileUploadValidate)) {
        await req._preFileUploadValidate(uploadParams);
      }
      const {
        filename, mimetype, encoding, gcsFile,
      } = await cloudStorageEngine._handleBusboyFileUploadTemp(req, res, uploadParams);
      const uploadedDocument = {
        name: filename,
        mime: mimetype,
        encoding,
        cloudKey: _.get(gcsFile, 'name'),
        md5Hash: _.get(gcsFile, 'metadata.md5Hash', 'pending'),
        size: _.get(gcsFile, 'metadata.size', 0),
      };
      const fileUploadedParams = { ...uploadParams, ...uploadedDocument };
      if (!_.isFunction(req._handleFileUpload)) {
        throw new Error('_handleFileUpload function is not provided');
      }
      const response = await req._handleFileUpload(fileUploadedParams);
      return sendResponse(res, 200, response);
    } catch (err) {
      const message = _.get(err, 'message', err);
      const data = _.get(err, 'data', null);
      return sendErrorResponse(res, _.get(err, 'code', 500), { message, data });
    }
  };

  const processMulterFiles = (req, res, next) => {
    uploadInterceptor.array('files')(req, res, multerUploadingHandler.bind(this, res, next));
  };

  const processActivityEmailFiles = async (req, res) => {
    const bucket = cloudStorageEngine.gcsBucket;
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(user, 'lsp._id', _.get(req, 'params.lspId', '')).toString();
    const uploadParams = {
      req, lspId, user, bucket,
    };
    Object.assign(uploadParams, { mock: _.get(req, 'flags.mock', false) });
    const activityDocumentApi = new ActivityDocumentAPI(user, configuration, req.$logger);
    req._generateFilePath = activityDocumentApi.generateActivityEmailFilePath
      .bind(activityDocumentApi);
    try {
      await cloudStorageEngine._handleBusboyFileUpload(req, res, uploadParams)
        .then(async (uploadResponse) => activityDocumentApi
          .handleEmailFileUpload(req, res, uploadParams, uploadResponse))
        .catch(async (err) => activityDocumentApi
          .handleFileUploadFail(err, res, uploadParams.filename));
    } catch (err) {
      return activityDocumentApi.handleFileUploadFail(err, res, uploadParams.filename);
    }
  };

  const processActivityFeedbackFiles = async (req, res) => {
    const bucket = cloudStorageEngine.gcsBucket;
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(user, 'lsp._id', _.get(req, 'params.lspId', ''));
    const activityApiOptions = { user, configuration, mock: req.flags.mock };
    const activityApi = new ActivityApi(req.$logger, activityApiOptions);
    const activityId = _.get(req, 'params.activityId');
    defaultLogger.debug(`Interceptor: Processing busboy file: UserId: ${user._id.toString()}, activityId: ${activityId}, lspId: ${lspId}`);
    const uploadParams = {
      req,
      lspId,
      user,
      bucket,
      activityApi,
      activityId,
    };
    Object.assign(uploadParams, { mock: _.get(req, 'flags.mock', false) });
    const activityDocumentApi = new ActivityDocumentAPI(user, configuration, req.$logger);
    try {
      defaultLogger.debug('Interceptor: About to upload file to cloud.');
      await cloudStorageEngine._handleBusboyFileUpload(req, res, uploadParams)
        .then(async (uploadResponse) => activityDocumentApi
          .handleFeedbackFileUpload(req, res, uploadParams, uploadResponse))
        .catch(async (err) => activityDocumentApi
          .handleFileUploadFail(err, res, uploadParams.filename));
    } catch (err) {
      return activityDocumentApi
        .handleFileUploadFail(err, res, uploadParams.filename);
    }
  };

  const expectedRoles = [
    'REQUEST_CREATE_ALL',
    'REQUEST_UPDATE_ALL',
    'REQUEST_CREATE_COMPANY',
    'REQUEST_UPDATE_COMPANY',
    'REQUEST_CREATE_OWN',
    'REQUEST_UPDATE_OWN',
    'TASK_UPDATE_OWN',
    'TASK-FINAL-FILE_UPDATE_OWN',
    'ACTIVITY-EMAIL_CREATE_ALL',
    'ACTIVITY-EMAIL_CREATE_OWN',
    'BILL_UPDATE_ALL',
    'BILL_UPDATE_OWN',
    'BILL-ADJUSTMENT_UPDATE_ALL',
    'BILL-ADJUSTMENT_UPDATE_OWN',
  ];

  const getUploadApi = (req, res, next) => {
    const entityName = _.get(req, 'params.entityName');
    const entityId = _.get(req, 'params.entityId');
    const user = requestUtils.getUserFromSession(req);
    const userRoles = getRoles(user);
    const uploadApi = SUPPORTING_FILE_UPLOAD_APIS[entityName];
    if (_.isNil(uploadApi)) {
      throw new RestError(500, { message: `File uploads are not supported by ${entityName}` });
    }
    const { ApiClass, requiredRoles } = uploadApi;
    if (!requiredRoles.some((r) => userRoles.includes(r))) {
      throw new RestError(403, { message: 'User is no authorized to access this route' });
    }
    const api = new ApiClass(req.$logger, { user, configuration });
    if (_.isNil(api.handleFileUpload) || _.isNil(api.generateFilePath)) {
      throw new RestError(500, { message: `File uploads are not implemented for ${entityName}` });
    }
    req._handleFileUpload = api.handleFileUpload.bind(api, entityId);
    req._generateFilePath = api.generateFilePath.bind(api, { entityName, entityId });
    next();
  };

  app.use((req, res, next) => {
    req.validateRequest = () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new RestError(400, {
          message: _.get(_.first(errors.array()), 'msg', 'Request validation failed'),
        });
      }
    };
    next();
  });

  app.post(
    '/api/lsp/:lspId/company/:companyId/pc-settings/resources',
    performPermissionCheck(['CAT-RESOURCES_CREATE_ALL']),
    query('type', 'type is missing or unsupported').isIn([CAT_RESOURCE_TYPE_SR, CAT_RESOURCE_TYPE_TB, CAT_RESOURCE_TYPE_TM]),
    query('language', 'language is required')
      .if((value, { req }) => _.get(req, 'query.type') === CAT_RESOURCE_TYPE_SR).notEmpty(),
    query('srcLang', 'srcLang is required')
      .if((value, { req }) => _.get(req, 'query.type') !== CAT_RESOURCE_TYPE_SR).notEmpty(),
    query('tgtLang', 'tgtLang is required')
      .if((value, { req }) => _.get(req, 'query.type') !== CAT_RESOURCE_TYPE_SR).notEmpty(),
    async (req, res, next) => {
      try {
        req.validateRequest();
        const mock = _.get(req.flags, 'mock', false);
        const user = requestUtils.getUserFromSession(req);
        const { sessionID } = req;
        const pcSettingsApi = new PcSettingsApi({
          user, configuration, logger: req.$logger, mock, sessionID,
        });
        const data = {
          type: _.get(req, 'query.type'),
          language: _.get(req, 'query.language'),
          srcLang: _.get(req, 'query.srcLang'),
          tgtLang: _.get(req, 'query.tgtLang'),
          isReviewedByClient: _.get(req, 'query.isReviewed'),
          companyId: _.get(req, 'params.companyId'),
        };
        const descriptor = await new Promise((resolve) => {
          req.pipe(req.busboy);
          req.busboy.on('file', async (fieldname, file, { filename }) => {
            const fileBuffer = await streamToBuffer(file);
            resolve(pcSettingsApi.importResource(Object.assign(data, {
              file: fileBuffer, filename,
            })));
          });
        });
        await sendResponse(res, 200, { descriptor });
      } catch (err) {
        next(err);
      }
    },
  );

  app.put(
    '/api/lsp/:lspId/company/:companyId/pc-settings/resources/:resourceId',
    performPermissionCheck(['CAT-RESOURCES_UPDATE_ALL']),
    query('type', 'type is missing or unsupported').isIn([CAT_RESOURCE_TYPE_SR, CAT_RESOURCE_TYPE_TB, CAT_RESOURCE_TYPE_TM]),
    async (req, res, next) => {
      try {
        req.validateRequest();
        const mock = _.get(req.flags, 'mock', false);
        const user = requestUtils.getUserFromSession(req);
        const { sessionID } = req;
        const pcSettingsApi = new PcSettingsApi({
          user, configuration, logger: req.$logger, mock, sessionID,
        });
        const data = {
          type: req.query.type,
          resourceId: req.params.resourceId,
          isReviewedByClient: req.query.isReviewed,
        };
        const descriptor = await new Promise((resolve) => {
          req.pipe(req.busboy);
          req.busboy.on('file', async (fieldname, file, { filename }) => {
            const fileBuffer = await streamToBuffer(file);
            resolve(pcSettingsApi.updateResource(Object.assign(data, {
              file: fileBuffer, filename,
            })));
          });
        });
        sendResponse(res, 200, { descriptor });
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    '/api/lsp/:lspId/pc-settings/sr',
    performPermissionCheck(['LSP-SETTINGS_UPDATE_OWN']),
    query('language', 'language is required').notEmpty(),
    async (req, res, next) => {
      try {
        req.validateRequest();
        const user = requestUtils.getUserFromSession(req);
        const { sessionID } = req;
        const pcSettingsApi = new PcSettingsApi({
          user, configuration, logger: req.$logger, sessionID,
        });
        const data = { type: CAT_RESOURCE_TYPE_SR, language: _.get(req, 'query.language') };
        const descriptor = await new Promise((resolve) => {
          req.pipe(req.busboy);
          req.busboy.on('file', (fieldname, file, { filename }) => {
            file.pipe(contactStream((fileBuffer) => resolve(
              pcSettingsApi.importResource(Object.assign(data, { file: fileBuffer, filename })),
            )));
          });
        });
        sendResponse(res, 200, { descriptor });
      } catch (err) {
        next(err);
      }
    },
  );

  app.put(
    '/api/lsp/:lspId/pc-settings/sr/:descriptorId',
    performPermissionCheck(['LSP-SETTINGS_UPDATE_OWN']),
    async (req, res, next) => {
      const user = requestUtils.getUserFromSession(req);
      const { sessionID } = req;
      const pcSettingsApi = new PcSettingsApi({
        user, configuration, logger: req.$logger, sessionID,
      });
      const data = {
        type: CAT_RESOURCE_TYPE_SR,
        resourceId: req.params.descriptorId,
      };
      try {
        const descriptor = await new Promise((resolve) => {
          req.pipe(req.busboy);
          req.busboy.on('file', (fieldname, file, { filename }) => {
            file.pipe(contactStream((fileBuffer) => resolve(
              pcSettingsApi.updateResource(Object.assign(data, { file: fileBuffer, filename })),
            )));
          });
        });
        sendResponse(res, 200, { descriptor });
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    '/api/lsp/:lspId/request/:requestId/document',
    performPermissionCheck(expectedRoles),
    (req, res, next) => {
      const user = requestUtils.getUserFromSession(req);
      const requestApi = new RequestAPI({ log: defaultLogger, user, configuration });
      const workflowApi = new WorkflowAPI({
        logger: defaultLogger, user, configuration, requestApi,
      });
      const api = new RequestDocumentApi({
        sessionID: req.sessionID,
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      }, requestApi, workflowApi);
      req._handleFileUpload = api.handleFileUpload.bind(api);
      req._generateFilePath = api.generateFilePath.bind(api);
      next();
    },
    (req, res, next) => processRequestWorkflowFiles(req, res, next).catch((err) => next(err)),
  );
  app.post(
    '/api/lsp/:lspId/bill/:billId/document',
    performPermissionCheck(['BILL_UPDATE_ALL', 'BILL-FILES_UPDATE_OWN']),
    (req, res, next) => {
      const user = requestUtils.getUserFromSession(req);
      const api = new BillDocumentApi({
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      });
      req._handleFileUpload = api.handleFileUpload.bind(api);
      req._generateFilePath = api.generateFilePath.bind(api);
      next();
    },
    (req, res, next) => processBillFiles(req, res, next).catch((err) => next(err)),
  );
  app.post(
    '/api/lsp/:lspId/bill-adjustment/:billAdjustmentId/document',
    performPermissionCheck(expectedRoles),
    (req, res, next) => {
      const user = requestUtils.getUserFromSession(req);
      const api = new BillAdjustmentDocumentApi({
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      });
      req._handleFileUpload = api.handleFileUpload.bind(api);
      req._generateFilePath = api.generateFilePath.bind(api);
      next();
    },
    (req, res, next) => processBillAdjustmentFiles(req, res, next).catch((err) => next(err)),
  );

  app.post(
    '/api/lsp/:lspId/request/:requestId/workflow/:workflowId/task/:taskId/providerTask/:providerTaskId/document',
    performPermissionCheck(expectedRoles),
    (req, res, next) => {
      const user = requestUtils.getUserFromSession(req);
      const requestTaskApi = new RequestTaskAPI({
        user,
        configuration,
        log: req.$logger,
        mock: req.flags.mock,
      });
      req._handleFileUpload = requestTaskApi.handleFileUpload.bind(requestTaskApi);
      req._generateFilePath = requestTaskApi.generateFilePath.bind(requestTaskApi);
      next();
    },
    (req, res, next) => processRequestWorkflowFiles(req, res, next).catch((err) => next(err)),
  );

  // Upload General File for the rest of the endpoints
  app.post(
    '/api/lsp/:lspId/document-prospect',
    performPermissionCheck(expectedRoles),
    (req, res, next) => {
      req._generateProspectFilePath = (fileStorageFactory, doc, extension) => {
        const prospectId = doc._id.toString();
        return fileStorageFactory.documentProspectFile(prospectId, extension);
      };
      req._generateDocumentProspect = (prospectFields) => prospectFactory(req, { prospectFields });
      deleteOldCloudProspects(req);
      next();
    },
    // TODO: Body schema check
    processMulterFiles,
    uploadedFilesList,
  );
  // End request before it reaches swagger

  // Upload Documents on User creation
  app.post(
    '/api/lsp/:lspId/user/:userId/document',
    performPermissionCheck(['STAFF-FILE-MANAGEMENT_UPDATE_ALL']),
    userLspCheck,
    (req, res, next) => {
      const prefixRegex = /[a-zA-Z0-9]{24}\/user_hiring_files\/[a-zA-Z0-9]{24,}/;
      req._generateProspectFilePath = (fileStorageFactory, doc, extension) => {
        const userId = _.get(req, 'params.userId');
        const prospectId = doc._id.toString();
        return fileStorageFactory.userHiringDocumentProspect(userId, prospectId, extension);
      };
      req._generateDocumentProspect = (prospectFields) => prospectFactory(req, {
        prospectFields,
        type: 'UserDocumentProspect',
        schema: 'UserDocumentProspect',
      });
      deleteOldCloudProspects(req, prefixRegex);
      next();
    },
    // TODO: Body schema check
    // Allow multer to process each file
    uploadInterceptor.single('file'),
    uploadedUserProspectSingleFile,
  );
  // End request before it reaches swagger
  app.post(
    '/api/lsp/:lspId/activityFeedback/:activityId/document',
    // Perform permission check
    performPermissionCheck([
      'ACTIVITY-NC-CC_UPDATE_ALL',
      'ACTIVITY-NC-CC_UPDATE_OWN',
      'ACTIVITY-NC-CC_CREATE_ALL',
      'ACTIVITY-NC-CC_CREATE_OWN',
      'ACTIVITY-VES1_CREATE_ALL',
      'ACTIVITY-VES1_UPDATE_ALL',
    ]),
    (req, _res, next) => {
      const user = requestUtils.getUserFromSession(req);
      const activityDocumentApi = new ActivityDocumentAPI(user, configuration, req.$logger);
      req._generateFilePath = activityDocumentApi.generateActivityFeedbackFilePath
        .bind(activityDocumentApi);
      req._handleFileUpload = activityDocumentApi.handleFeedbackFileUpload
        .bind(activityDocumentApi);
      next();
    },

    (req, res, next) => processActivityFeedbackFiles(req, res).catch((err) => next(err)),
  );
  // End request before it reaches swagger
  app.post(
    '/api/lsp/:lspId/activityEmail/document',
    // Perform permission check
    performPermissionCheck([
      'ACTIVITY-EMAIL_CREATE_ALL',
      'ACTIVITY-EMAIL_CREATE_OWN',
    ]),
    (req, res, next) => processActivityEmailFiles(req, res).catch((err) => next(err)),
  );

  app.post('/api/lsp/:lspId/:entityName/:entityId/attachments/upload', getUploadApi, processBusboyFiles);

  // Csv entries importing for AR-Invoice / AP-Payment
  app.post('/api/lsp/:lspId/entry/:entityName/import', (req, res, next) => {
    const user = requestUtils.getUserFromSession(req);
    const entityName = _.get(req, 'params.entityName');
    let api;
    const apiParams = {
      logger: req.$logger,
      user,
      configuration,
      entityName,
    };
    if (entityName === 'ap-payment-entries') {
      api = new ApPaymentEntryApi(apiParams);
    } else {
      api = new ArInvoiceEntryApi(apiParams);
    }
    if (!api.canImport()) {
      throw new RestError(403, { message: 'User is no authorized to access this route' });
    }
    req.api = api;
    next();
  }, (req, res) => {
    const entityName = _.get(req, 'params.entityName');
    req.$logger.debug('Entries csv importing: Handling csv file uploading');
    const onFinish = (importedEntriesNumber) => {
      delete req.api;
      sendResponse(res, 200, { importedEntriesNumber });
    };
    const onError = (err) => {
      req.$logger.debug('Error ocurred upon uploading entries csv importing: Handling csv file uploading');
      delete req.api;
      sendErrorResponse(res, 500, { message: `${err}` });
    };
    const onCsvFile = (fieldname, file, { filename }) => {
      req.$logger.debug(`Entries csv importing: Handling csv file with name: ${filename}`);
      try {
        req.api.importEntriesFromCsv(file).then(onFinish).catch(onError);
      } catch (err) {
        this.logger.error(`Error importing entries csv for entity: ${entityName}. Error: ${err}`);
        throw new RestError(500, { message: `Error importing csv: ${err}` });
      }
    };
    req.pipe(req.busboy);
    req.busboy.on('file', onCsvFile);
  });
};

module.exports = (app, configuration, logger) => {
  interceptor(app, configuration, logger);
};
