const _ = require('lodash');
const { getUserFromSession, getTimezoneValueFromSession } = require('../request');
const configuration = require('../../components/configuration');
const { sendResponse, RestError, fileContentDisposition } = require('../../components/api-response');
const PaginableApiDecorator = require('../pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../utils/stream');

const attachmentsHandler = Api => ({
  async detachFile(req, res) {
    const user = getUserFromSession(req);
    const entityId = _.get(req, 'swagger.params.entityId.value');
    const attachmentId = _.get(req, 'swagger.params.attachmentId.value');
    try {
      const api = new Api(req.$logger, { user, configuration });
      if (_.isNil(api.detach)) {
        throw new RestError(500, { message: 'Attachments handling is not implemented for this entity' });
      }
      await api.detach(entityId, attachmentId);
      return sendResponse(res, 200);
    } catch (e) {
      req.$logger.error(`An error occured while detaching file. ${e}`);
      throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
    }
  },

  async getFileStream(req, res) {
    const user = getUserFromSession(req);
    const entityId = _.get(req, 'swagger.params.entityId.value');
    const attachmentId = _.get(req, 'swagger.params.attachmentId.value');
    const api = new Api(req.$logger, { user, configuration });
    if (_.isNil(api.getFileStream)) {
      throw new RestError(500, { message: 'Attachments handling is not implemented for this entity' });
    }
    try {
      const { fileReadStream, filename } =
        await api.getFileStream(entityId, attachmentId);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', fileContentDisposition(filename));
      pipeWithErrors(fileReadStream, res);
    } catch (e) {
      req.$logger.error(`An error occured while downloading file. ${e}`);
      throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
    }
  },
});

const newController = (Api, entityName) => ({
  async create(req, res) {
    const { flags } = req;
    const user = getUserFromSession(req);
    const data = _.get(req, 'swagger.params.data.value');
    const api = new Api(req.$logger, { user, configuration, flags });
    try {
      const entity = await api.create(data);
      return sendResponse(res, 201, { [entityName]: entity });
    } catch (e) {
      const message = e.message || e;
      req.$logger.error(`An error occurred while creating a new ${entityName}. Error: ${message}`);
      throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
    }
  },

  async list(req, res) {
    const user = getUserFromSession(req);
    const api = new Api(req.$logger, { user, configuration, flags: req.flags });
    const timezoneValue = getTimezoneValueFromSession(req);
    const filters = { __tz: timezoneValue };
    try {
      const paginableApiDecorator = new PaginableApiDecorator(api, req, { listMethod: 'list' });
      const response = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, response);
    } catch (e) {
      const message = e.message || e;
      req.$logger.error(`An error occurred while retrieving a list of ${entityName}. Error: ${message}`);
      throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
    }
  },

  async details(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    try {
      const user = getUserFromSession(req);
      const api = new Api(req.$logger, { user, configuration });
      const entity = await api.getById(id);
      return sendResponse(res, 200, { [entityName]: entity });
    } catch (e) {
      req.$logger.error(`An error occurred while retrieving ${entityName} ${id}. ${e}`);
      throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
    }
  },
});

const createExportMethod = (ApiClass, entityName) => async function (req, res) {
  try {
    const user = getUserFromSession(req);
    const api = new ApiClass(req.$logger, { user, configuration });
    const timezoneValue = getTimezoneValueFromSession(req);
    const filters = { __tz: timezoneValue };
    const paginableApiDecorator = new PaginableApiDecorator(api, req, { listMethod: 'export' });
    const { fileReadStream, filename } = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(filename));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(fileReadStream, res);
  } catch (e) {
    req.$logger.error(`An error occurred while exporting ${entityName} list. ${e}`);
    throw e instanceof RestError ? e : new RestError(500, { message: e.message || e });
  }
};

const generateUpdateMethod = (ApiClass, entityName) => async function (req, res) {
  const { flags } = req;
  const user = getUserFromSession(req);
  const api = new ApiClass(req.$logger, { user, configuration, flags });
  const data = _.get(req, 'swagger.params.data.value');

  try {
    const entity = await api.edit(data);
    return sendResponse(res, 200, { [entityName]: entity });
  } catch (e) {
    req.$logger.error(`An error occurred while updating an ${entityName}. ${e}`);
    throw new RestError(500, { message: e.message || e });
  }
};

const createDefaultController = (Api, entityName, options = {}) => {
  const controller = newController(Api, entityName);
  controller.export = createExportMethod(Api, entityName);
  controller.update = generateUpdateMethod(Api, entityName);
  if (options.enableAttachmentsHandling) {
    const { detachFile, getFileStream } = attachmentsHandler(Api);
    controller.detachFile = detachFile;
    controller.getFileStream = getFileStream;
  }
  return controller;
};

module.exports = createDefaultController;
