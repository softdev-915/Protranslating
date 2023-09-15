const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const { sendResponse } = require('../../../components/api-response');
const ActiveUserSessionsAPI = require('./active-user-sessions-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
// const configuration = require('../../../components/configuration');

module.exports = {
  async activeUserSessionsList(req, res) {
    try {
      const filters = {};
      const user = requestUtils.getUserFromSession(req);
      const activeUserSessionsAPI = new ActiveUserSessionsAPI(req.$logger, { user });
      filters.__tz = _.get(req.session, 'lmsTz', '0');
      const paginableApiDecorator = new PaginableAPIDecorator(activeUserSessionsAPI, req, { listMethod: 'activeUserSessionsList' });
      const list = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, list);
    } catch (error) {
      req.$logger.debug('Failed to retrieve active user sessions');
      req.$logger.error(error);
    }
  },
};
