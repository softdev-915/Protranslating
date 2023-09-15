const PortalMTTranslationApi = require('./portalmt-translating-api');
const _ = require('lodash');
const configuration = require('../../../../components/configuration');
const apiResponse = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');

const { sendResponse } = apiResponse;

module.exports = {
  async translateSegments(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new PortalMTTranslationApi({ logger: req.$logger, user, configuration });
    const isMocksActive = _.get(req, 'headers[lms-mockrepetitions]', 'false') === 'true';
    const data = _.get(req, 'swagger.params.data.value');
    const source = _.get(data, 'source');
    const sourceLang = _.get(data, 'sourceLang');
    const targetLang = _.get(data, 'targetLang');
    const model = _.get(data, 'model');
    const sessionID = _.get(req, 'sessionID');
    const requestBody = {
      source,
      sourceLang,
      targetLang,
      model,
      sessionID,
    };
    const { translations, mtNode } = isMocksActive
      ? api.mockGetTranslation(requestBody)
      : await api.getTranslation(requestBody);
    return sendResponse(res, 200, { translatedText: translations, mtNode });
  },
  async translateSuggest(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new PortalMTTranslationApi({ logger: req.$logger, user, configuration });
    const isMocksActive = _.get(req, 'headers[lms-mockrepetitions]', 'false') === 'true';
    const data = _.get(req, 'swagger.params.data.value');
    const source = _.get(data, 'source');
    const sourceLang = _.get(data, 'sourceLang');
    const targetLang = _.get(data, 'targetLang');
    const models = _.get(data, 'models');
    const sessionID = _.get(req, 'sessionID');
    const prefix = _.get(data, 'prefix');
    const requestBody = {
      source,
      sourceLang,
      targetLang,
      models,
      sessionID,
      prefix,
    };
    const { suggestions, mtNode } = isMocksActive
      ? api.mockGetTranslationSuggestions(requestBody)
      : await api.getTranslationSuggestions(requestBody);
    return sendResponse(res, 200, { suggestions, mtNode });
  },
};
