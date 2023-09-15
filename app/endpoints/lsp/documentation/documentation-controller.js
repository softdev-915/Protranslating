const _ = require('lodash');
const rolesUtils = require('../../../utils/roles');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const DocumentationAPI = require('./documentation-api');

const RestError = apiResponse.RestError;
const sendResponse = apiResponse.sendResponse;

module.exports = {
  async getDocumentation(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const docSearch = {};
    const name = _.get(req, 'swagger.params.name.value');
    const keywords = _.get(req, 'swagger.params.keywords.value');
    if (name) {
      docSearch.name = name;
    }
    if (keywords) {
      docSearch.keywords = keywords;
    }
    docSearch.roles = rolesUtils.extractUserRoles(req);
    const documentationAPI = new DocumentationAPI(req.$logger, { user });
    const documentation = await documentationAPI.getDocumentation(docSearch);
    if (!documentation) {
      throw new RestError(404, { message: `No documentation for ${name}` });
    }
    return sendResponse(res, 200, { documentation });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const name = _.get(req, 'swagger.params.name.value');
    const documentation = _.get(req, 'swagger.params.data.value');
    documentation.name = name;
    const documentationAPI = new DocumentationAPI(req.$logger, { user });
    const docUpdated = await documentationAPI.update(documentation);
    return sendResponse(res, 200, { documentation: docUpdated });
  },
};
