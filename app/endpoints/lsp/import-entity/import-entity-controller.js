const _ = require('lodash');
const ImportEntityApi = require('./import-entity-api');
const defaultController = require('../../../utils/default-controller');
const { sendResponse, RestError } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream');
const { MIMETYPE_XLSX, MIMETYPE_CSV } = require('../../../utils/file');
const apiResponse = require('../../../components/api-response');
const SchemaAPI = require('../schema/schema-api');
const logger = require('../../../components/log/logger');

const { fileContentDisposition } = apiResponse;
const controller = defaultController(ImportEntityApi, 'import-entity', {
  enableAttachmentsHandling: true,
});

const log = (msg, req) => {
  const message = [
    'Import module',
    `User: ${getUserFromSession(req)._id}`,
    `Request: ${req.id}`,
    msg,
  ];
  logger.info(message.join('. '));
};

controller.import = async function (req, res) {
  const user = getUserFromSession(req);
  const schemaApi = new SchemaAPI(req.$logger, { user, configuration });
  const importEntityApi = new ImportEntityApi(req.$logger, { user, configuration });
  const file = _.get(req, 'swagger.params.file.value');
  if (![MIMETYPE_CSV, MIMETYPE_XLSX].includes(file.mimetype)) {
    throw new RestError(400, { message: 'Wrong file format. Expecting xlsx file to be uploaded' });
  }
  try {
    const allowedSchemas = await schemaApi.getAllSchemas();
    await importEntityApi.import(file, allowedSchemas.list);
  } catch (error) {
    throw new RestError(500, error);
  }
  return sendResponse(res, 200);
};

controller.export = async function (req, res) {
  const user = getUserFromSession(req);
  const schemaApi = new SchemaAPI(req.$logger, { user, configuration });
  const mockedEntities = !_.isEmpty(req.flags.mockImportModuleEntities)
    ? decodeURIComponent(req.flags.mockImportModuleEntities).split(',')
    : null;
  const api = new ImportEntityApi(req.$logger, { user, configuration, mockedEntities });
  try {
    const schemas = await schemaApi.getAllSchemas();
    const exportedEntities = await api.export(schemas.list);
    res.setHeader('Content-Disposition', fileContentDisposition('Import entities template.xlsx'));
    res.setHeader('Content-type', MIMETYPE_XLSX);
    pipeWithErrors(exportedEntities, res);
  } catch (error) {
    log(`${error}`, req);
    throw new RestError(500, error);
  }
};

module.exports = controller;
