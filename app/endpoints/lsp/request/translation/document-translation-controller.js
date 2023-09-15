const _ = require('lodash');
const AWSBucket = require('../../../../components/aws/bucket');
const { RestError, sendResponse } = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');
const configuration = require('../../../../components/configuration');
const RequestDocumentTranslationAPI = require('./document-translation-api');

module.exports = {
  async detail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const request = _.get(req, 'swagger.params.requestId.value');
    const document = _.get(req, 'swagger.params.documentId.value');
    const language = _.get(req, 'swagger.params.language.value');
    const translationParams = {
      lspId,
      request,
      document,
      'language.isoCode': language,
    };

    if (user.lsp._id.toString() !== translationParams.lspId) {
      throw new RestError(403, { message: 'You cannot retrieve translation from another lsp' });
    }
    const environmentConfig = configuration.environment;
    const bucket = new AWSBucket({
      accessKeyId: environmentConfig.AWS_S3_KEY,
      secretAccessKey: environmentConfig.AWS_S3_SECRET,
      region: 'us-east-1',
      bucketACL: 'private',
      bucketName: environmentConfig.AWS_S3_BUCKET,
      pagingDelay: 5,
    });
    const translationAPI = new RequestDocumentTranslationAPI({
      user,
      configuration,
      log: req.$logger,
      mock: false,
      bucket,
    });
    const translation = await translationAPI.detail(translationParams);

    sendResponse(res, 200, { translation });
  },
  async createOrEdit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const request = _.get(req, 'swagger.params.requestId.value');
    const document = _.get(req, 'swagger.params.documentId.value');
    const language = _.get(req, 'swagger.params.language.value');
    const translationProspect = _.get(req, 'swagger.params.data.value');
    const translationParams = {
      lspId,
      request,
      document,
      'language.isoCode': language,
      translation: translationProspect.translation,
      readDate: translationProspect.readDate,
    };

    if (user.lsp._id.toString() !== translationParams.lspId) {
      throw new RestError(403, { message: 'You cannot retrieve translation from another lsp' });
    }
    const environmentConfig = configuration.environment;
    const bucket = new AWSBucket({
      accessKeyId: environmentConfig.AWS_S3_KEY,
      secretAccessKey: environmentConfig.AWS_S3_SECRET,
      region: 'us-east-1',
      bucketACL: 'private',
      bucketName: environmentConfig.AWS_S3_BUCKET,
      pagingDelay: 5,
    });
    const translationAPI = new RequestDocumentTranslationAPI({
      user,
      log: req.$logger,
      configuration,
      mock: false,
      bucket,
    });
    const translation = await translationAPI.createOrEdit(translationParams);

    sendResponse(res, 200, { translation });
  },
};
