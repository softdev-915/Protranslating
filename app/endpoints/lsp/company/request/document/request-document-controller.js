const _ = require('lodash');
const { chooseProperBucket } = require('../../../../../components/aws/mock-bucket');
const configuration = require('../../../../../components/configuration');
const { RestError, sendResponse } = require('../../../../../components/api-response');
const requestUtils = require('../../../../../utils/request');
const RequestDocumentApi = require('./request-document-api');
const RequestAPI = require('../../../request/request-api');
const WorkflowApi = require('../../../request/workflow/workflow-api');
const ServerURLFactory = require('../../../../../components/application/server-url-factory');
const CloudStorage = require('../../../../../components/cloud-storage');
const { extractUserIp } = require('../../../../../utils/request');
const RequestDocumentApiDecorator = require('../../../../../utils/request/request-document-api-decorator');

// eslint-disable-next-line no-unused-vars
const serveFilesZip = async (type, req, res, next) => {
  // https://github.com/archiverjs/node-archiver
  // https://stackoverflow.com/a/25210806/467034
  const user = requestUtils.getUserFromSession(req);
  const serverURLFactory = new ServerURLFactory(configuration);
  const serverUrl = serverURLFactory.buildServerURL();

  if (_.isNull(user)) {
    res.redirect(301, serverUrl);
  }
  const { requestId, companyId, languageCombinationId, documentId } = _.get(req, 'swagger.params');
  const bucket = chooseProperBucket(configuration);
  const apiOptions = {
    user,
    configuration,
    log: req.$logger,
    mock: req.flags.mock,
    bucket,
  };
  const requestApi = new RequestAPI(apiOptions);
  const api = new RequestDocumentApi(apiOptions, requestApi);

  try {
    const filters = {
      user,
      requestId: requestId.value,
      companyId: companyId.value,
      documentId: _.get(documentId, 'value', ''),
      languageCombinationId: _.get(languageCombinationId, 'value', ''),
      type,
      res,
    };

    await api.zipFilesStream(filters);
  } catch (e) {
    if (e instanceof RestError) {
      throw e;
    }
    req.$logger.error(`Error serving zip file. Error: ${e}`);
    throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
  }
};

module.exports = {
  async serveFile(req, res) {
    const { isUserIpAllowed = true } = res.locals;
    if (!isUserIpAllowed) {
      throw new RestError(401, { message: 'IP is not allowed' });
    }
    const user = requestUtils.getUserFromSession(req);
    const serverURLFactory = new ServerURLFactory(configuration);
    const serverUrl = serverURLFactory.buildServerURL();

    if (_.isNull(user)) {
      res.redirect(301, serverUrl);
    }
    const bucket = chooseProperBucket(configuration);
    const cloudStorage = new CloudStorage(configuration);
    const api = new RequestDocumentApi({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const { requestId, companyId, documentId } = _.get(req, 'swagger.params');
    const decoratedApi = new RequestDocumentApiDecorator({
      api, cloudStorage, req, res,
    });

    try {
      await decoratedApi.serveFile({
        request: requestId.value,
        companyId: companyId.value,
        documentId: documentId.value,
      });
    } catch (err) {
      req.$logger.error(`Error downloading file. Error: ${err}`);
      throw new RestError(404, { message: _.get(err, 'message', err) });
    }
  },
  async serveOcrFilesZip(req, res, next) {
    await serveFilesZip('ocr', req, res, next);
  },
  async serveSourceFilesZip(req, res, next) {
    await serveFilesZip('src', req, res, next);
  },
  async serveFinalFilesZip(req, res, next) {
    await serveFilesZip('final', req, res, next);
  },
  async deleteDocument(req, res) {
    const clientIP = extractUserIp(req);
    const bucket = chooseProperBucket(configuration);
    const user = requestUtils.getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const documentId = decodeURI(_.get(req, 'swagger.params.documentId.value'));
    const apiOptions = {
      user,
      mock: req.flags.mock,
      log: req.$logger,
      configuration,
      bucket,
    };
    const requestApi = new RequestAPI(apiOptions);
    const workflowApi = new WorkflowApi({ ...apiOptions, logger: req.$logger, requestApi });
    const requestDocumentApi = new RequestDocumentApi(apiOptions, requestApi, workflowApi);
    try {
      const updatedRequest = await requestDocumentApi.deleteDocument(
        requestId,
        documentId,
        clientIP,
      );

      return sendResponse(res, 200, { request: updatedRequest });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      req.$logger.error(`Error deleting file. Error: ${err}`);
      throw new RestError(500, { message: 'Error deleting file', stack: _.get(err, 'stack', err) });
    }
  },
  async checkRemovalPermissions(req, res) {
    let hasPermission = false;
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const apiOptions = {
      user,
      mock: req.flags.mock,
      log: req.$logger,
      configuration,
      bucket,
    };
    const requestApi = new RequestAPI(apiOptions);
    const requestDocumentApi = new RequestDocumentApi(apiOptions);
    const clientIP = extractUserIp(req);
    const requestQuery = { _id: requestId, lspId: this.lspId };
    const request = await requestApi.findOne(requestQuery);

    hasPermission = await requestDocumentApi.checkRemovalPermissions(request, clientIP);

    return sendResponse(res, 200, { hasPermission });
  },
};
