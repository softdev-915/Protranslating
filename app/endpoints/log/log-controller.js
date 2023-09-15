const _ = require('lodash');
const { sendResponse } = require('../../components/api-response');

module.exports = {
  async createLog(req, res) {
    const message = _.get(req, 'swagger.params.data.value.message');
    const logLevel = _.get(req, 'swagger.params.data.value.logLevel');
    switch (logLevel) {
      case 'silly':
        req.$logger.silly(message);
        break;
      case 'debug':
        req.$logger.debug(message);
        break;
      case 'verbose':
        req.$logger.verbose(message);
        break;
      case 'warn':
        req.$logger.warn(message);
        break;
      case 'error':
        req.$logger.error(message);
        break;
      case 'info':
      default:
        req.$logger.info(message);
        break;
    }
    return sendResponse(res, 200, {});
  },
};
