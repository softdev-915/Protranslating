const _ = require('lodash');
const GroupAPI = require('./group-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');

const { sendResponse, streamFile, RestError } = apiResponse;

module.exports = {
  async groupExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new GroupAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'groupExport', req });
    const file = await paginableApiDecorator.list(user, filters);
    streamFile(res, file);
  },
  async groupList(req, res) {
    const groupFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const groupAPI = new GroupAPI(req.$logger, { user, configuration });
    const groupId = _.get(req, 'swagger.params.groupId.value');

    // Set filter params
    groupFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    groupFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    groupFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (groupId) {
      groupFilters._id = groupId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(groupAPI, req, { listMethod: 'groupList' });
    const groups = await paginableApiDecorator.list(groupFilters);
    if (groupId) {
      if (groups && groups.list.length) {
        return sendResponse(res, 200, { group: groups.list[0] });
      }
      throw new RestError(404, { message: `Group ${groupId} does not exist` });
    } else {
      return sendResponse(res, 200, groups);
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const groupAPI = new GroupAPI(req.$logger, { user });
    const group = _.get(req, 'swagger.params.data.value');
    group.lspId = lspId;
    const groupCreated = await groupAPI.create(user, group);
    return sendResponse(res, 200, { group: groupCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const groupAPI = new GroupAPI(req.$logger, { user });
    const group = _.get(req, 'swagger.params.data.value');
    const groupUpdated = await groupAPI.update(user, group);
    return sendResponse(res, 200, { group: groupUpdated });
  },
};
