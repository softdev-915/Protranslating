const _ = require('lodash');
const { chooseProperBucket } = require('../../../../components/aws/mock-bucket');
const configuration = require('../../../../components/configuration');
const { RestError, sendResponse, fileContentDisposition } = require('../../../../components/api-response');
const OpportunityDocumentApi = require('./opportunity-document-api');
const CloudStorage = require('../../../../components/cloud-storage');
const requestUtils = require('../../../../utils/request');

module.exports = {
  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const opportunityId = _.get(req, 'swagger.params.opportunityId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const bucket = chooseProperBucket(configuration);
    const opportunityDocumentApi = new OpportunityDocumentApi({
      user: user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const file = await opportunityDocumentApi.buildFilePath(companyId,
      opportunityId, documentId);
    res.setHeader('Content-Disposition', fileContentDisposition(file.name));
    req.$logger.info(`Sending file ${file.path}`);
    const cloudStorage = new CloudStorage(configuration);
    try {
      const cloudFile = await cloudStorage.gcsGetFile(file.path);
      cloudFile.createReadStream().pipe(res);
    } catch (error) {
      throw new RestError(404, { message: 'The file does not exist', stack: error.stack });
    }
  },
  async checkFileRemovalPermissions(req, res) {
    let hasPermission = false;
    const user = requestUtils.getUserFromSession(req);
    const opportunityId = _.get(req, 'swagger.params.opportunityId.value');
    const opportunityDocumentApi = new OpportunityDocumentApi({
      user,
      mock: req.flags.mock,
      log: req.$logger,
      configuration,
    });
    // check for permission
    hasPermission = await opportunityDocumentApi.checkFileRemovalPermissions(opportunityId);
    return sendResponse(res, 200, { hasPermission });
  },
  async serveSourceFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const opportunityId = _.get(req, 'swagger.params.opportunityId.value');
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const bucket = chooseProperBucket(configuration);
    const opportunityDocumentApi = new OpportunityDocumentApi({
      user: user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    try {
      await opportunityDocumentApi.zipFilesStream(companyId, opportunityId, res);
    } catch (e) {
      const message = e.message || e;
      req.$logger.error(`Error serving zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
    }
  },
};
