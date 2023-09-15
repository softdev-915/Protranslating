const _ = require('lodash');
const TemplateAPI = require('./template-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');

const streamFile = apiResponse.streamFile;
const sendResponse = apiResponse.sendResponse;
const RestError = apiResponse.RestError;

module.exports = {
  async export(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateApi = new TemplateAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    try {
      const paginableApiDecorator = new PaginableAPIDecorator(templateApi, req, { listMethod: 'export' });
      const file = await paginableApiDecorator.list(filters);
      streamFile(res, file);
    } catch (error) {
      const message = _.get(error, 'message', error);
      throw new RestError(500, { message, stack: error.stack });
    }
  },
  async list(req, res) {
    const filters = {};
    const user = requestUtils.getUserFromSession(req);
    const templateApi = new TemplateAPI(req.$logger, { user, configuration });
    const templateTypesString = _.get(req, 'swagger.params.types.value');
    if (templateTypesString) {
      try {
        const templates = await templateApi.retrieveByTypes(templateTypesString);
        return sendResponse(res, 200, templates);
      } catch (error) {
        const message = _.get(error, 'message', error);
        throw new RestError(500, { message, stack: error.stack });
      }
    }
    try {
      const templateId = _.get(req, 'swagger.params.templateId.value');
      // Set filter params
      filters.__tz = _.get(req.headers, 'lms-tz', '0');
      filters.attributes = _.get(req, 'swagger.params.attributes.value');
      filters.deleted = _.get(req, 'swagger.params.withDeleted.value');
      if (templateId) {
        filters._id = templateId;
      }

      // Make request
      const paginableApiDecorator = new PaginableAPIDecorator(templateApi, req);
      const templates = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, templates);
    } catch (error) {
      const message = _.get(error, 'message', error);
      throw new RestError(500, { message, stack: error.stack });
    }
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateId = _.get(req, 'swagger.params.templateId.value');
    const templateAPI = new TemplateAPI(req.$logger, { user });
    try {
      const template = await templateAPI.retrieveById(templateId);
      return sendResponse(res, 200, { template });
    } catch (error) {
      const message = _.get(error, 'message', error);
      throw new RestError(500, { message, stack: error.stack });
    }
  },
  async retrieveByName(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateName = _.get(req, 'swagger.params.templateName.value');
    const templateAPI = new TemplateAPI(req.$logger, { user });
    const template = await templateAPI.retrieveByName(templateName);
    return sendResponse(res, 200, { template });
  },
  async retrieveByCompanyInternalDepartmentId(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const internalDepartmentId = _.get(req, 'swagger.params.internalDepartmentId.value');
    const templateAPI = new TemplateAPI(req.$logger, { user });
    try {
      const template = await templateAPI
        .retrieveByCompanyInternalDepartmentId(companyId, internalDepartmentId);
      return sendResponse(res, 200, { template });
    } catch (error) {
      const message = _.get(error, 'message', error);
      throw new RestError(500, { message, stack: error.stack });
    }
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateAPI = new TemplateAPI(req.$logger, { user });
    const template = _.get(req, 'swagger.params.data.value');
    try {
      const templateCreated = await templateAPI.create(template);
      return sendResponse(res, 200, { template: templateCreated });
    } catch (error) {
      const message = _.get(error, 'message', error);
      throw new RestError(500, { message, stack: error.stack });
    }
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateAPI = new TemplateAPI(req.$logger, { user, configuration });
    const template = _.get(req, 'swagger.params.data.value');
    try {
      const templateId = _.get(req, 'swagger.params.templateId.value');
      template._id = templateId;
      const templateUpdated = await templateAPI.update(template);
      return sendResponse(res, 200, { template: templateUpdated });
    } catch (error) {
      const message = _.get(error, 'message', error);
      throw new RestError(500, { message, stack: error.stack });
    }
  },
};
