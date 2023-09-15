const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const CertificationApi = require('./certification-api');
const { pipeWithErrors } = require('../../../utils/stream/');
const PaginableApiDecorator = require('../../../utils/pagination/paginable-api-decorator');
const {
  sendResponse,
  fileContentDisposition,
} = require('../../../components/api-response');

module.exports = {
  async certificationExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CertificationApi(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };

    const paginableApiDecorator = new PaginableApiDecorator(api, req,
      { listMethod: 'certificationExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },

  async certificationList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CertificationApi(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableApiDecorator(api, req);
    const list = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, list);
  },

  async certificationDetails(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CertificationApi(req.$logger, { user });
    const certificationId = _.get(req, 'swagger.params.certificationId.value');
    const certification = await api.findOne(certificationId);
    return sendResponse(res, 200, { certification });
  },

  async certificationCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CertificationApi(req.$logger, { user });
    const certification = _.get(req, 'swagger.params.data.value');
    const certificationCreated = await api.create(certification);
    return sendResponse(res, 200, { certification: certificationCreated });
  },

  async certificationUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CertificationApi(req.$logger, { user });
    const certification = _.get(req, 'swagger.params.data.value');
    const certificationId = _.get(req, 'swagger.params.certificationId.value');

    // ik-todo: remove
    certification._id = certificationId;
    const certificationUpdated = await api.update(certification);
    return sendResponse(res, 200, { certification: certificationUpdated });
  },
};
