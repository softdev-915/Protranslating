const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const ToastAPI = require('./toast-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');

const { sendResponse, streamFile } = apiResponse;

module.exports = {
  async toastExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const api = new ToastAPI(req.$logger, { user, configuration, lspId });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'toastExport' });
    const file = await paginableApiDecorator.list(filters);
    streamFile(res, file);
  },
  async list(req, res) {
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const user = requestUtils.getUserFromSession(req);
    const toastId = _.get(req, 'swagger.params.toastId.value');
    let responseFormatter = toasts => toasts;
    const toastAPI = new ToastAPI(req.$logger, { user });
    let api = toastAPI;
    if (toastId) {
      filters._id = toastId;
      responseFormatter = toast => ({ toast });
    } else {
      api = new PaginableAPIDecorator(toastAPI, req);
    }
    const toasts = await api.list(filters);
    return sendResponse(res, 200, responseFormatter(toasts));
  },
  async create(req, res) {
    const toastProspect = _.get(req, 'swagger.params.data.value');
    const user = requestUtils.getUserFromSession(req);
    const toastAPI = new ToastAPI(req.$logger, { user });
    const newToast = await toastAPI.create(toastProspect);
    return sendResponse(res, 200, { toast: newToast });
  },
  async edit(req, res) {
    const toastId = _.get(req, 'swagger.params.toastId.value');
    const toastProspect = _.get(req, 'swagger.params.data.value');
    toastProspect._id = toastId;
    const user = requestUtils.getUserFromSession(req);
    const toastAPI = new ToastAPI(req.$logger, { user });
    const editedToast = await toastAPI.edit(toastProspect);
    return sendResponse(res, 200, { toast: editedToast });
  },
};
