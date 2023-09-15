const _ = require('lodash');
const moment = require('moment');
const apiResponse = require('../../../components/api-response');

const sendResponse = apiResponse.sendResponse;

module.exports = {
  async heartbeat(req, res) {
    const sessionTimeout = _.get(req, 'session.user.securityPolicy.timeoutInactivity');
    const expiry = moment.utc(req.session.lastAccess).add(sessionTimeout, 'minutes');
    return sendResponse(res, 200, { heartbeat: { expiry } });
  },
};
