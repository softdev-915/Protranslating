const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const apiResponse = require('../../../../components/api-response');
const configuration = require('../../../../components/configuration');
const PortalCatApi = require('../../portalcat/portalcat-api');

const { sendResponse } = apiResponse;

module.exports = {
  async segmentLSP(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const srId = _.get(req, 'swagger.params.srId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const text = _.get(body, 'data.text');
    const langCode = _.get(body, 'data.langCode');
    const api = new PortalCatApi(req.$logger, { user, configuration });
    const data = await api.getTextSegmentation({ srId, text, langCode });
    return sendResponse(res, 200, { segmentedText: data.data.segments });
  },
  async segmentCompany(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const srId = _.get(req, 'swagger.params.srId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const text = _.get(body, 'data.text');
    const langCode = _.get(body, 'data.langCode');
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const api = new PortalCatApi(req.$logger, { user, configuration });
    const data = await api.getTextSegmentation({ srId, text, langCode, companyId });
    return sendResponse(res, 200, { segmentedText: data.data.segments });
  },
};
