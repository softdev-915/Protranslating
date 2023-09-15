const RoleAPI = require('./role-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');

const sendResponse = apiResponse.sendResponse;

module.exports = {
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const roleAPI = new RoleAPI(req.$logger, { user });
    const roles = await roleAPI.list();
    return sendResponse(res, 200, { roles: roles.map(r => r.name) });
  },
};
