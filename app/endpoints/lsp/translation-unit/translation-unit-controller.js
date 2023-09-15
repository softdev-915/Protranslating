const _ = require('lodash');
const TranslationUnitAPI = require('./translation-unit-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async translationUnitExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new TranslationUnitAPI(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'translationUnitExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const translationUnitId = _.get(req, 'swagger.params.translationUnitId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz: tz };
    // Set filter params
    filters.__tz = _.get(req.headers, 'lms-tz', '0');
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (translationUnitId) {
      filters._id = translationUnitId;
    }
    const translationUnitAPI = new TranslationUnitAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(translationUnitAPI, req);
    const translationUnits = await paginableApiDecorator.list(filters);

    if (translationUnitId) {
      if (translationUnits && translationUnits.list.length) {
        return sendResponse(res, 200, {
          translationUnit: translationUnits.list[0],
        });
      }
      throw new RestError(404, { message: `Billing unit ${translationUnitId} does not exist` });
    } else {
      return sendResponse(res, 200, translationUnits);
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const translationUnitAPI = new TranslationUnitAPI(req.$logger, { user });
    const translationUnit = _.get(req, 'swagger.params.data.value');
    const translationUnitCreated = await translationUnitAPI.create(translationUnit);
    return sendResponse(res, 200, { translationUnit: translationUnitCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const translationUnitAPI = new TranslationUnitAPI(req.$logger, { user });
    const translationUnitId = _.get(req, 'swagger.params.translationUnitId.value');
    const translationUnit = _.get(req, 'swagger.params.data.value');
    translationUnit._id = translationUnitId;
    const translationUnitUpdated = await translationUnitAPI.update(translationUnit);
    return sendResponse(res, 200, { unit: translationUnitUpdated });
  },
};
