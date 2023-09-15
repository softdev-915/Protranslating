const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const CompanyExcludedProvidersApi = require('./company-excluded-providers-api');
const { RestError, sendResponse } = require('../../../components/api-response');

module.exports = {
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    try {
      const companyExcludedProvidersApi = new CompanyExcludedProvidersApi(
        req.$logger,
        { user, configuration },
      );
      const excludedProvidersList = await companyExcludedProvidersApi
        .excludedProvidersList(companyId);
      return sendResponse(res, 200, excludedProvidersList);
    } catch (err) {
      this.logger.error(`Error retrieving excluded providers list. Error: ${err}`);
      throw new RestError(500, { message: `Failed to retrieve excluded providers list ${err}` });
    }
  },
};
