const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const { sendResponse, RestError } = require('../../../../components/api-response');
const PaginableAPIDecorator = require('../../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../../components/configuration');
const WorkflowTemplateApi = require('./workflow-template-api');
const CompanyMinimumChargeApi = require('../../company-minimum-charge/company-minimum-charge-api.js');
const VendorMinimumChargeAPI = require('../../vendor-minimum-charge/vendor-minimum-charge-api');

module.exports = {
  async createTemplate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const overwrite = _.get(req, 'swagger.params.overwrite.value');
    const templateData = _.get(req, 'swagger.params.data.value');
    const workflowTemplateApi = new WorkflowTemplateApi({
      user,
      configuration,
      logger: req.$logger,
    });

    try {
      const template = await workflowTemplateApi.createTemplate(templateData, overwrite);
      return sendResponse(res, 201, template);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Failed to create workflow template: ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, { message });
    }
  },

  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    const languageCombinations = _.get(req, 'swagger.params.languageCombinations.value');
    const workflowTemplateApi = new WorkflowTemplateApi({
      user,
      configuration,
      logger: req.$logger,

    });

    try {
      if (_.isEmpty(languageCombinations)) {
        const apiDecorator = new PaginableAPIDecorator(workflowTemplateApi, req, { listMethod: 'listCompanyTemplates' });
        const list = await apiDecorator.list({
          __tz: _.get(req.headers, 'lms-tz', 0),
          company: companyId,
        });
        return sendResponse(res, 200, list);
      }
      const list = await workflowTemplateApi.listRequestTemplates(companyId, languageCombinations);
      return sendResponse(res, 200, list);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Failed to retrieve workflow templates: ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, { message });
    }
  },

  async updateTemplateState(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateId = _.get(req, 'swagger.params.templateId.value');
    const deleted = _.get(req, 'swagger.params.deleted.value');
    const workflowTemplateApi = new WorkflowTemplateApi({
      user,
      configuration,
      logger: req.$logger,
    });

    try {
      await workflowTemplateApi.updateTemplateState(templateId, deleted);
      sendResponse(res, 200);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Failed to ${deleted ? 'delete' : 'restore'} workflow template: ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, { message });
    }
  },

  async applyTemplate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const templateId = _.get(req, 'swagger.params.templateId.value');
    const data = _.get(req, 'swagger.params.data.value');
    const companyMinChargeApi = new CompanyMinimumChargeApi(
      req.$logger,
      { user, configuration },
    );
    const vendorMinimumChargeApi = new VendorMinimumChargeAPI(
      req.$logger,
      { user, configuration },
    );
    const workflowTemplateApi = new WorkflowTemplateApi({
      user,
      configuration,
      logger: req.$logger,
      companyMinChargeApi,
      vendorMinimumChargeApi,
    });

    try {
      const request = await workflowTemplateApi.applyTemplate(templateId, data);
      sendResponse(res, 200, { request });
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Failed to apply workflow template: ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, { message });
    }
  },
};
