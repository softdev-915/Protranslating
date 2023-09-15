const _ = require('lodash');
const configuration = require('../../../../../../components/configuration');
const requestUtils = require('../../../../../../utils/request');
const { sendResponse } = require('../../../../../../components/api-response');
const RequestDocumentApi = require('./basic-cat-tool-document-api');
const { chooseProperBucket } = require('../../../../../../components/aws/mock-bucket');

module.exports = {
  async serveFileImage(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const page = _.get(req, 'swagger.params.page.value');
    const bucket = chooseProperBucket(configuration);
    const requestDocumentApi = new RequestDocumentApi({
      user,
      log: req.$logger,
      configuration: configuration,
      mock: req.flags.mock,
      bucket,
    });
    const generatedFile = await requestDocumentApi.generateImageFromDocument(companyId,
      requestId, documentId, page);
    res.setHeader('Content-type', 'image/jpg');
    // cache aggresivelly
    res.setHeader('Cache-Control', 'max-age=31556926');
    req.$logger.debug(`Sending file ${generatedFile.file.path}`);
    const fileStream = generatedFile.file.streamRead();
    fileStream.pipe(res).on('finish', () => {
      req.$logger.debug('Destroying the fileStream');
      try {
        fileStream.destroy();
      } catch (err) {
        const message = err.message || err;
        req.$logger.error(`Failed to destroy the file reader. Error: ${message}`);
      }
      req.$logger.debug(`Execute onServed ${generatedFile.file.path}`);
      generatedFile.onServed().then(() => {
        req.$logger.debug('onServed executed');
      }).catch((err) => {
        const message = err.message || err;
        req.$logger.error(`Failed to delete the file ${generatedFile.file.path}. Error: ${message}`);
      });
    });
  },

  async documentInfo(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const bucket = chooseProperBucket(configuration);
    const requestDocumentApi = new RequestDocumentApi({
      user,
      log: req.$logger,
      configuration: configuration,
      mock: req.flags.mock,
      bucket,
    });
    const documentInfo = await requestDocumentApi.documentInfo(companyId, requestId, documentId);
    return sendResponse(res, 200, { info: documentInfo });
  },
};
