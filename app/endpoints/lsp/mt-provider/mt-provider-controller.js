const _ = require('lodash');
const MtProviderApi = require('./mt-provider-api');
const { sendResponse } = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');

module.exports = {
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const mtEngineApi = new MtProviderApi(req.$logger, { user, configuration });
    const paginableApiDecorator = new PaginableAPIDecorator(mtEngineApi, req);
    const mtProviders = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, mtProviders);
  },
  async mtProviderDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const mtProviderId = _.get(req, 'swagger.params.id.value');
    const mtProviderApi = new MtProviderApi(req.$logger, { user, configuration });
    const mtProvider = await mtProviderApi.mtProviderDetail(mtProviderId);
    return sendResponse(res, 200, { mtProvider });
  },
};
