const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const AssignmentStatusAPI = require('./assignment-status-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { sendResponse, fileContentDisposition } = apiResponse;

module.exports = {
  async assignmentStatusExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new AssignmentStatusAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'assignmentStatusExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async assignmentStatusList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const assignmentStatusAPI = new AssignmentStatusAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(assignmentStatusAPI, req);
    const assignmentStatuss = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, assignmentStatuss);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const assignmentStatusId = _.get(req, 'swagger.params.assignmentStatusId.value');
    const assignmentStatusAPI = new AssignmentStatusAPI(req.$logger, { user });
    const assignmentStatus = await assignmentStatusAPI.retrieveById(assignmentStatusId);
    return sendResponse(res, 200, { assignmentStatus });
  },
  async assignmentStatusCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const assignmentStatusAPI = new AssignmentStatusAPI(req.$logger, { user, configuration });
    const assignmentStatus = _.get(req, 'swagger.params.data.value');
    const assignmentStatusCreated = await assignmentStatusAPI.create(assignmentStatus);
    return sendResponse(res, 200, { assignmentStatus: assignmentStatusCreated });
  },
  async assignmentStatusUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const assignmentStatusAPI = new AssignmentStatusAPI(req.$logger, { user, configuration });
    const assignmentStatusId = _.get(req, 'swagger.params.assignmentStatusId.value');
    const assignmentStatus = _.get(req, 'swagger.params.data.value');
    assignmentStatus._id = assignmentStatusId;
    const assignmentStatusUpdated = await assignmentStatusAPI.update(assignmentStatus);
    return sendResponse(res, 200, { assignmentStatus: assignmentStatusUpdated });
  },
};
