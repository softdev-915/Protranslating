const _ = require('lodash');
const ConcurrencyReadDateChecker = require('../../../../utils/concurrency');
const RequestAPI = require('../request-api');
const SchemaAwareAPI = require('../../../schema-aware-api');
const { RestError } = require('../../../../components/api-response');

class RequestDocumentTranslationAPI extends SchemaAwareAPI {
  /**
   * Creates a RequestDocumentTranslationAPI
   * @param   {Object}  options constructor options.
   * @param   {Object}  options.user the user executing the RequestAPI.
   * @param   {Object}  options.configuration the configuration object.
   * @param   {Object}  options.log the logger.
   * @param   {Boolean} options.mock whether this is a mock call or not.
   * @param   {Object}  options.bucket the aws bucket.
   * @returns {Object}  a RequestDocumentTranslationAPI instance.
   */
  constructor(options) {
    super(options.log, options);
    this.requestAPI = new RequestAPI(options);
  }

  async detail(translationParams) {
    const request = await this.requestAPI.findOne(translationParams.request);
    if (!request) {
      throw new RestError(404, { message: `The request ${translationParams.request} does not exist` });
    }
    const translation = await this.schema.BasicCatToolTranslation.findOne(translationParams);
    if (!translation) {
      throw new RestError(404, { message: `Translation for lspId ${translationParams.lspId}, request ${translationParams.request} and document ${translationParams.document} does not exist` });
    }
    return translation;
  }

  /**
   *
   * @param {Object} translationProspect
   * @param {String} translationProspect._id the translation _id to update (undefined if new).
   * @param {String} translationProspect.lspId the lsp id.
   * @param {String} translationProspect.request the request id.
   * @param {String} translationProspect.document the document id.
   * @param {String} translationProspect.readDate the translation readDate.
   * @param {String} translationProspect.translation the translated text.
   * @param {Object} translationProspect.language the translation language.
   * @param {String} translationProspect.language.isoCode the language isoCode.
   */
  async createOrEdit(translationProspect) {
    const translation =
      await this._getEditableTranslation(translationProspect);
    translation.translation = translationProspect.translation;
    try {
      await translation.save();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error saving translation. Error ${message}`);
      throw new RestError(500, { message: 'Error updating translation', stack: err.stack });
    }
    return translation;
  }

  async _getEditableTranslation(translationProspect) {
    let translation;
    const langISOCode = _.get(translationProspect, 'language.isoCode');
    const language = await this.schema.Language.findOne({ isoCode: langISOCode });
    if (!language) {
      throw new RestError(404, { message: `The language ${langISOCode} does not exist` });
    }
    const request = await this.requestAPI.findOne(translationProspect.request);
    if (!request) {
      throw new RestError(404, { message: `The request ${translationProspect.request} does not exist` });
    }
    if (request.tgtLangs.findIndex(l => l.isoCode === langISOCode) === -1) {
      throw new RestError(400, { message: `The request ${request._id} has no target language ${langISOCode}` });
    }
    try {
      const query = _.pick(translationProspect, ['lspId', 'request', 'document']);
      query['language.isoCode'] = langISOCode;
      translation = await this.schema.BasicCatToolTranslation.findOne(query);
      if (translationProspect._id &&
          translationProspect._id.toString() !== translation._id.toString()) {
        throw new RestError(400, { message: `There is an existing translation for document ${translationProspect.document} with language ${translationProspect.language.isoCode}.` });
      } else if (!translation) {
        throw new RestError(404, { message: `Translation for lspId ${translationProspect.lspId}, request ${translationProspect.request} and document ${translationProspect.document} does not exist` });
      }
      translation = await this.detail({
        lspId: translationProspect.lspId,
        request: translationProspect.request,
        document: translationProspect.document,
      });
    } catch (e) {
      const code = _.get(e, 'code');
      const message = _.get(e, 'message', '');
      if (code !== 404 || message.indexOf('Translation for lspId') !== 0) {
        throw e;
      }
    }
    if (!translation) {
      translation = new this.schema.BasicCatToolTranslation({
        lspId: translationProspect.lspId,
        request: translationProspect.request,
        document: translationProspect.document,
        language,
      });
    } else {
      const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
        entityName: 'translation',
      });
      await concurrencyReadDateChecker.failIfOldEntity(translation);
    }
    return translation;
  }
}

module.exports = RequestDocumentTranslationAPI;
