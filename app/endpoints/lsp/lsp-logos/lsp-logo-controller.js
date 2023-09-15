const _ = require('lodash');
const LspLogoApi = require('./lsp-logo-api');
const { RestError, sendResponse } = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');

module.exports = {
  async list(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const logoFilter = JSON.parse(_.get(req, 'query.params.filter'));
      const lspLogoApi = new LspLogoApi(req.$logger, { user, configuration });
      const lspLogoList = await lspLogoApi.list(logoFilter);
      return sendResponse(res, 200, lspLogoList);
    } catch (err) {
      this.logger.error(`Error retrieving logos list. Error: ${err}`);
      throw new RestError(500, { message: `Failed to retrieve logos list ${err}` });
    }
  },
};
