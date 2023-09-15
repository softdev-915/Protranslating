const _ = require('lodash');
const version = require('../../components/version');
const PortalCatApi = require('../lsp/portalcat/portalcat-api');
const configuration = require('../../components/configuration');

module.exports = {
  version(req, res) {
    return res.status(200).json({ v: version });
  },
  async pcVersion(req, res) {
    const api = new PortalCatApi(req.$logger, { configuration });
    const response = await api.getVersion();
    return res.status(response.status).json({ v: _.get(response, 'data.version', 'NA') });
  },
};
