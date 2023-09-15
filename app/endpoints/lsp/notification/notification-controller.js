const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const { sendResponse, streamFile, RestError } = require('../../../components/api-response');
const NotificationAPI = require('./notification-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { queryTranslatorFactory } = require('./notification-helper');

module.exports = {
  async notificationExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new NotificationAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'notificationExport',
      queryTranslator: queryTranslatorFactory(req),
    });
    const file = await paginableApiDecorator.list(filters);
    streamFile(res, file);
  },
  async notificationList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new NotificationAPI(req.$logger, { user, configuration });
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'notificationList',
      queryTranslator: queryTranslatorFactory(req),
    });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const listData = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, listData);
  },
  async notificationDetail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new NotificationAPI(req.$logger, { user, configuration });
    const notificationId = _.get(req, 'swagger.params.notificationId.value');
    const notification = await api.notificationDetail(notificationId);
    return sendResponse(res, 200, notification);
  },
  async getBackupInfo(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new NotificationAPI(req.$logger, { user, configuration });
    const response = await api.getNotificationBackupInfo();
    return sendResponse(res, 200, response);
  },
  async restoreFrom(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const data = _.get(req, 'swagger.params.data.value');
      const api = new NotificationAPI(req.$logger, { user, configuration });
      const response = await api.restoreFrom(data);
      return sendResponse(res, 200, response);
    } catch (e) {
      const message = _.get(e, 'message', e);
      const errorMessage = `Error restoring backup: ${message}`;
      req.$logger.error(errorMessage);
      throw new RestError(500, { message: errorMessage });
    }
  },
  async testRestoreAndBackup(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const api = new NotificationAPI(req.$logger, { user, configuration });
      const response = await api.testRestoreAndBackup();
      return sendResponse(res, 200, response);
    } catch (e) {
      const message = _.get(e, 'message', e);
      const errorMessage = `Error testing backup and restore: ${message}`;
      req.$logger.error(errorMessage);
      throw new RestError(500, { message: errorMessage });
    }
  },
};
