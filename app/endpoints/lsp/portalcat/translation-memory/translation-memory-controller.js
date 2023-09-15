const _ = require('lodash');
const { getUserFromSession } = require('../../../../utils/request');
const { sendResponse } = require('../../../../components/api-response');
const TranslationMemoryApi = require('./translation-memory-api');
const configuration = require('../../../../components/configuration');

module.exports = {
  async getSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segments = await api.getSegments({ companyId, tmId });
    return sendResponse(res, 200, { segments });
  },
  async getSegmentHistory(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const originalId = _.get(req, 'swagger.params.originalId.value');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segments = await api.getSegmentHistory({ companyId, tmId, originalId });
    return sendResponse(res, 200, { segments });
  },
  async getSegmentDetails(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const originalId = _.get(req, 'swagger.params.originalId.value');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segmentInfo = await api.getSegmentDetails({ companyId, tmId, originalId });
    return sendResponse(res, 200, { segmentInfo });
  },
  async deleteSegment(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const originalId = _.get(req, 'swagger.params.originalId.value');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    await api.deleteSegment({ companyId, tmId, originalId });
    return sendResponse(res, 200);
  },
  async createSegment(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segment = await api.createSegment({ companyId, tmId, body });
    return sendResponse(res, 200, { segment });
  },
  async updateSegment(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const originalId = _.get(req, 'swagger.params.originalId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segment = await api.updateSegment({ companyId, tmId, originalId, body });
    return sendResponse(res, 200, { segment });
  },
  async searchSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const tzOffset = _.get(req.headers, 'lms-tz', '0');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segments = await api.searchSegmentsFull({ companyId, tmId, body, tzOffset });
    return sendResponse(res, 200, { segments });
  },
  async replaceSegmentsContent(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const tmId = _.get(req, 'swagger.params.tmId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const tzOffset = _.get(req.headers, 'lms-tz', '0');
    const api = new TranslationMemoryApi({
      logger: req.$logger,
      user,
      configuration,
      sessionID,
    });
    const segments = await api.replaceSegmentsContent({ companyId, tmId, body, tzOffset });
    return sendResponse(res, 200, { segments });
  },
};
