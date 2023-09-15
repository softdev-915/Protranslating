const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const apiResponse = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const PcSettingsApi = require('../../portalcat-settings/portalcat-settings-api');

const { sendResponse } = apiResponse;

module.exports = {
  async getLSPSegmentationRules(req, res) {
    const mockSegmentationRulesEmpty = _.get(req, 'flags.mockSegmentationRulesEmpty', false);
    if (mockSegmentationRulesEmpty) {
      return sendResponse(res, 200, {
        segmentationRulesList: {
          descriptors: [],
          total: 0,
        },
      });
    }
    const { sessionID } = req;
    const user = requestUtils.getUserFromSession(req);
    const api = new PcSettingsApi({
      logger: req.$logger, user, configuration, sessionID,
    });
    const segmentationRulesList = await api.list({ type: 'sr' });
    return sendResponse(res, 200, { segmentationRulesList });
  },
  async getCompanySegmentationRules(req, res) {
    const mockSegmentationRulesEmpty = _.get(req, 'flags.mockSegmentationRulesEmpty', false);
    if (mockSegmentationRulesEmpty) {
      return sendResponse(res, 200, {
        segmentationRulesList: {
          descriptors: [],
          total: 0,
        },
      });
    }
    const { sessionID } = req;
    const user = requestUtils.getUserFromSession(req);
    const api = new PcSettingsApi({
      logger: req.$logger, user, configuration, sessionID,
    });
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const segmentationRulesList = await api.list({ companyId, type: 'sr' });
    return sendResponse(res, 200, { segmentationRulesList });
  },
  async getSegmentationRule(req, res) {
    const { sessionID } = req;
    const user = requestUtils.getUserFromSession(req);
    const api = new PcSettingsApi({
      logger: req.$logger, user, configuration, sessionID,
    });
    const srId = _.get(req, 'swagger.params.srId.value');
    const file = await api.findDescriptor('sr', { _id: srId });
    return sendResponse(res, 200, { segmentationRule: file });
  },
};
