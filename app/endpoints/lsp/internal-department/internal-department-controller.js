const _ = require('lodash');
const InternalDepartmentAPI = require('./internal-department-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async internalDepartmentExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new InternalDepartmentAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'internalDepartmentExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const internalDepartmentId = _.get(req, 'swagger.params.internalDepartmentId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    // Set filter params
    filters.__tz = _.get(req.headers, 'lms-tz', '0');
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (internalDepartmentId) {
      filters._id = internalDepartmentId;
    }
    const internalDepartmentAPI = new InternalDepartmentAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(internalDepartmentAPI, req);
    const internalDepartments = await paginableApiDecorator.list(filters);

    if (internalDepartmentId) {
      if (internalDepartments && internalDepartments.list.length) {
        return sendResponse(res, 200, {
          internalDepartment: internalDepartments.list[0],
        });
      }
      throw new RestError(404, { message: 'Internal department does not exist' });
    } else {
      return sendResponse(res, 200, internalDepartments);
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const internalDepartmentAPI = new InternalDepartmentAPI(req.$logger, { user });
    const internalDepartment = _.get(req, 'swagger.params.data.value');
    const internalDepartmentCreated = await internalDepartmentAPI.create(internalDepartment);
    return sendResponse(res, 200, { internalDepartment: internalDepartmentCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const internalDepartmentAPI = new InternalDepartmentAPI(req.$logger, { user });
    const internalDepartmentId = _.get(req, 'swagger.params.internalDepartmentId.value');
    const internalDepartment = _.get(req, 'swagger.params.data.value');
    internalDepartment._id = internalDepartmentId;
    const internalDepartmentUpdated = await internalDepartmentAPI.update(internalDepartment);
    return sendResponse(res, 200, { internalDepartment: internalDepartmentUpdated });
  },
};
