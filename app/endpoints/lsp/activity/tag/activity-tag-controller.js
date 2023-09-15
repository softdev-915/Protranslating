const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const apiResponse = require('../../../../components/api-response');
const ActivityTagAPI = require('./activity-tag-api');
const configuration = require('../../../../components/configuration');
const PaginableAPIDecorator = require('../../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../../utils/stream/');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async activityTagExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ActivityTagAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'activityTagExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async activityTagList(req, res) {
    const activityTagFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const activityTagAPI = new ActivityTagAPI(req.$logger, { user, configuration });
    const activityTagId = _.get(req, 'swagger.params.activityTagId.value');

    // Set filter params
    activityTagFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    activityTagFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    activityTagFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    activityTagFilters.lspId = lspId;
    if (activityTagId) {
      activityTagFilters._id = activityTagId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(activityTagAPI, req, { listMethod: 'activityTagList' });
    const activityTags = await paginableApiDecorator.list(activityTagFilters);

    if (activityTagId) {
      if (activityTags && activityTags.list.length) {
        return sendResponse(res, 200, { activityTag: activityTags.list[0] });
      }
      throw new RestError(404, { message: `Activity Tag ${activityTagId} does not exist` });
    } else {
      return sendResponse(res, 200, activityTags);
    }
  },
  async activityTagCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityTagAPI = new ActivityTagAPI(req.$logger, { user, configuration });
    const activityTag = _.get(req, 'swagger.params.data.value');
    const activityTagCreated = await activityTagAPI
      .create(activityTag);
    return sendResponse(res, 200, { activityTag: activityTagCreated });
  },
  async activityTagUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityTagId = _.get(req, 'swagger.params.activityTagId.value');
    const activityTag = _.get(req, 'swagger.params.data.value');
    const activityTagAPI = new ActivityTagAPI(req.$logger, { user, configuration });
    activityTag._id = activityTagId;
    const activityTagUpdated = await activityTagAPI
      .update(activityTag);
    return sendResponse(res, 200, { activityTag: activityTagUpdated });
  },
};
