const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const DocumentTypeAPI = require('./document-type-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { sendResponse, fileContentDisposition } = apiResponse;

module.exports = {
  async documentTypeExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new DocumentTypeAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'documentTypeExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async documentTypeList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const documentTypeAPI = new DocumentTypeAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(documentTypeAPI, req);
    const documentTypes = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, documentTypes);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const documentTypeId = _.get(req, 'swagger.params.documentTypeId.value');
    const documentTypeAPI = new DocumentTypeAPI(req.$logger, { user });
    const documentType = await documentTypeAPI.retrieveById(documentTypeId);
    return sendResponse(res, 200, { documentType });
  },
  async documentTypeCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const documentTypeAPI = new DocumentTypeAPI(req.$logger, { user, configuration });
    const documentType = _.get(req, 'swagger.params.data.value');
    const documentTypeCreated = await documentTypeAPI.create(documentType);
    return sendResponse(res, 200, { documentType: documentTypeCreated });
  },
  async documentTypeUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const documentTypeAPI = new DocumentTypeAPI(req.$logger, { user, configuration });
    const documentTypeId = _.get(req, 'swagger.params.documentTypeId.value');
    const documentType = _.get(req, 'swagger.params.data.value');
    documentType._id = documentTypeId;
    const documentTypeUpdated = await documentTypeAPI.update(documentType);
    return sendResponse(res, 200, { documentType: documentTypeUpdated });
  },
};
