const _ = require('lodash');
const LocationAPI = require('./location-api');
const requestUtils = require('../../../utils/request');
const { pipeWithErrors } = require('../../../utils/stream/');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { fileContentDisposition, sendResponse } = require('../../../components/api-response');

module.exports = {
  async locationExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LocationAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const paginableAPIDecorator = new PaginableAPIDecorator(api, req, {
      listMethod: 'locationExport',
    });
    const csvStream = await paginableAPIDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },

  async locationList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LocationAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const paginableAPIDecorator = new PaginableAPIDecorator(api, req);
    const list = await paginableAPIDecorator.list(filters);
    return sendResponse(res, 200, list);
  },

  async locationDetails(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LocationAPI(req.$logger, { user });
    const locationId = _.get(req, 'swagger.params.locationId.value');
    const location = await api.findOne(locationId);
    sendResponse(res, 200, { location });
  },

  async locationCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LocationAPI(req.$logger, { user });
    const location = _.get(req, 'swagger.params.data.value');
    const created = await api.create(location);
    return sendResponse(res, 200, { location: created });
  },

  async locationUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LocationAPI(req.$logger, { user });
    const location = _.get(req, 'swagger.params.data.value');
    const updated = await api.update(location);
    return sendResponse(res, 200, { location: updated });
  },
};
