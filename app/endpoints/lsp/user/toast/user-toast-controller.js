const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const { sendResponse, RestError } = require('../../../../components/api-response');
const UserToastAPI = require('./user-toast-api');

module.exports = {
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userId = _.get(req, 'swagger.params.userId.value');
    if (userId !== user._id.toString()) {
      throw new RestError(403, { message: 'Cannot access to other user\'s toast' });
    }
    const userToastAPI = new UserToastAPI(req.$logger, { user });
    const userToasts = await userToastAPI.list(userId);
    const response = {
      list: userToasts,
      total: userToasts.length,
    };
    return sendResponse(res, 200, response);
  },
  async edit(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userId = _.get(req, 'swagger.params.userId.value');
    const toastId = _.get(req, 'swagger.params.toastId.value');
    const toastAction = _.get(req, 'swagger.params.data.value');
    toastAction._id = toastId;
    if (userId !== user._id.toString()) {
      throw new RestError(403, { message: 'Cannot access to other user\'s toast' });
    }
    const userToastAPI = new UserToastAPI(req.$logger, { user });
    const updatedToast = await userToastAPI.edit(user, toastAction);
    return sendResponse(res, 200, updatedToast);
  },
};
