const _ = require('lodash');
const { RestError } = require('../../../../components/api-response');
const { convertToObjectId } = require('../../../../utils/schema');
const SchemaAwareAPI = require('../../../schema-aware-api');
const {
  sanitizeWorkflow,
  prepareCompanyAndVendorFilters,
  reduceWorkflowsLanguages,
} = require('./workflow-template-helpers');
const { updateMatchingRateDetails } = require('../workflow/workflow-helpers.js');
const { searchFactory } = require('../../../../utils/pagination');
const Promise = require('bluebird');
const { getProviderMatchingRateDetail } = require('../../provider-pooling-offer/provider-pooling-offer-helpers');

class WorkflowTemplateApi extends SchemaAwareAPI {
  constructor({ user, configuration, logger, companyMinChargeApi, vendorMinimumChargeApi }) {
    super(logger, { user });
    this.configuration = configuration;
    this.companyMinChargeApi = companyMinChargeApi;
    this.vendorMinimumChargeApi = vendorMinimumChargeApi;
  }

  async createTemplate(data, overwrite) {
    const request = await this.schema.Request
      .findOne({ _id: data.requestId }, { workflows: 1, company: 1 })
      .lean();

    if (_.isNil(request)) {
      throw new RestError(404, { message: `Request with ${data.requestId} was no found` });
    }
    let template = await this.schema.WorkflowTemplate.findOneWithDeleted({
      name: data.name,
      company: request.company._id,
    });

    if (!_.isNil(template)) {
      this._handleTemplatePermissons(overwrite, data, request);
    }

    const templateObject = await this._createTemplateObject(request, data);

    request.workflowTemplate = templateObject.name;
    template = !_.isNil(template)
      ? Object.assign(template, templateObject)
      : new this.schema.WorkflowTemplate(templateObject);

    await template.save();
    const updatedRequest = await this.schema.Request
      .findOneAndUpdate(
        { _id: data.requestId },
        { $set: { workflowTemplate: template.name } },
        { new: true },
      )
      .lean();
    return _.pick(updatedRequest, ['_id', 'workflowTemplate', 'updatedAt']);
  }

  _handleTemplatePermissons(overwrite, data, request) {
    if (!overwrite) {
      throw new RestError(409, {
        message: `Template with name ${data.name} already exists for company ${request.company.name}`,
      });
    }

    if (overwrite && !this.user.has('WORKFLOW-TEMPLATE_UPDATE_ALL')) {
      throw new RestError(404, {
        message: 'You don’t have the right permission to update the Workflow Template',
      });
    }
  }

  async listRequestTemplates(companyId, languageCombinations) {
    languageCombinations.push('None-None');
    const list = await this.schema.WorkflowTemplate.aggregate([
      {
        $match: {
          company: convertToObjectId(companyId),
          deleted: false,
          $expr: {
            $and: [
              { $setIsSubset: ['$languageCombinations', languageCombinations] },
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          languageCombinations: 1,
        },
      },
      {
        $sort: {
          name: 1,
        },
      },
    ]);
    return { list, length: list.length };
  }

  async listCompanyTemplates(filters) {
    const query = Object.assign(
      { lspId: this.lspId, company: convertToObjectId(filters.company) },
      _.get(filters, 'paginationParams', {}),
    );

    const list = await searchFactory({
      model: this.schema.WorkflowTemplate,
      filters: query,
      extraPipelines: [
        {
          $project: {
            _id: 1,
            name: 1,
            languageCombinations: {
              // We need this to remove trailing comma and space
              $substr: ['$languageCombinations', 0, { $subtract: [{ $strLenCP: '$languageCombinations' }, 2] }],
            },
            deleted: 1,
          },
        },
      ],
      extraQueryParams: ['languageCombinations'],
      utcOffsetInMinutes: filters.__tz,
      beforeMatchPipeline: [
        {
          $addFields: {
            languageCombinations: {
              $reduce: {
                input: '$languageCombinations',
                initialValue: '',
                in: { $concat: ['$$value', '$$this', ', '] },
              },
            },
          },
        },
      ],
    });
    return { list, total: list.length };
  }

  async updateTemplateState(templateId, deleted) {
    await this.schema.WorkflowTemplate.findOneAndUpdateWithDeleted(
      { _id: convertToObjectId(templateId) },
      { $set: { deleted } },
    );
  }

  async applyTemplate(templateId, data) {
    const { requestId } = data;
    const request = await this.schema.Request.findOne({ _id: requestId });
    const template = await this.schema.WorkflowTemplate.findOne({ _id: templateId }).lean();

    if (_.isNil(request)) {
      throw new RestError(404, { message: `Request ${requestId} was not found` });
    }
    if (_.isNil(template)) {
      throw new RestError(404, { message: `Template ${templateId} was not found` });
    }

    const companyBillingInformation = await this.schema.CompanySecondary
      .findOne({ lspId: this.lspId, _id: request.company._id })
      .select('billingInformation')
      .lean();
    const companyRates = _.get(companyBillingInformation, 'billingInformation.rates', []);

    request.workflows = await Promise.map(
      template.workflows,
      workflow => this._prepareWorkflowsToInsert(workflow, request, companyRates),
    );
    request.workflowTemplate = template.name;
    await this.schema.Request.updateWorkflowTotals(request);
    await request.save();
    return request;
  }

  async _prepareWorkflowsToInsert(workflow, request, companyRates) {
    workflow.workflowDueDate = request.deliveryDate;

    const {
      companyMinimumChargeFilters,
      companyRateFilters,
      vendorRateFilters,
      vendorMinimunChargeFilters,
    } = prepareCompanyAndVendorFilters(workflow, request);

    await Promise.mapSeries(workflow.tasks, async (task) => {
      const ability = await this.schema.Ability
        .findOne({ name: task.ability, lspId: this.lspId })
        .lean();
      const abilityName = _.get(ability, 'name', '');

      companyRateFilters.ability = ability;
      vendorRateFilters.ability = abilityName;
      vendorMinimunChargeFilters.ability = abilityName;
      companyMinimumChargeFilters.ability = abilityName;

      if (_.isNil(companyRateFilters.ability)) {
        throw new Error(`Ability ${task.ability} was not found in the database`);
      }

      task.invoiceDetails.forEach(invoiceDetail => updateMatchingRateDetails(
        invoiceDetail.invoice,
        companyRateFilters,
        companyRates,
        this.companyMinChargeApi,
      ));

      await this._populateTask(task, companyMinimumChargeFilters);

      await Promise.mapSeries(task.providerTasks, providerTask => this._populateProviderTask(
        providerTask,
        request.deliveryDate,
        vendorMinimunChargeFilters,
        vendorRateFilters,
      ));
    });
    return workflow;
  }

  async _populateTask(task, filters) {
    try {
      const companyMinChargeDetails = await this.companyMinChargeApi.getMinCharge(filters);
      task.minCharge = _.get(companyMinChargeDetails, 'minCharge', 0);
    } catch (err) {
      task.minCharge = 0;
    }
  }

  async _populateProviderTask(providerTask, deliveryDate, filters, vendorRateFilters) {
    providerTask.taskDueDate = deliveryDate;
    filters.vendorId = _.get(providerTask, 'provider._id');

    await Promise.mapSeries(providerTask.billDetails, details => this._populateBillDetails(
      details,
      vendorRateFilters,
      filters.vendorId,
    ));

    if (_.isNil(filters.vendorId)) {
      return;
    }
    try {
      const minCharge = await this.vendorMinimumChargeApi
        .retrieveProviderMinimumCharge(filters, true);
      providerTask.minCharge = _.get(minCharge, 'rate', 0);
    } catch (err) {
      providerTask.minCharge = 0;
    }
  }

  async _populateBillDetails(billDetail, vendorRateFilters, vendorId) {
    billDetail.quantity = 0;
    if (_.isNil(vendorId)) {
      return;
    }
    vendorRateFilters.breakdown = _.get(billDetail, 'breakdown.name', '');
    vendorRateFilters.translationUnit = _.get(billDetail, 'translationUnit.name', '');
    const user = await this.schema.User.findOneWithDeleted({ _id: vendorId })
      .select('vendorDetails.rates')
      .lean();
    const rates = _.get(user, 'vendorDetails.rates', []);
    const matchingRateDetail = getProviderMatchingRateDetail(vendorRateFilters, rates);
    billDetail.unitPrice = _.get(matchingRateDetail, 'price', 0);
  }

  async _createTemplateObject(request, data) {
    const templateWorkflows = request.workflows
      .filter(workflow => data.workflows.includes(workflow._id.toString()));
    const sanitizedWorkflows = await Promise.map(templateWorkflows, sanitizeWorkflow);
    const languageCombinations = templateWorkflows.reduce(reduceWorkflowsLanguages, new Set());
    const templateData = {
      lspId: this.lspId,
      name: data.name,
      company: request.company._id,
      languageCombinations: Array.from(languageCombinations),
      languageCombination: 'dfsdf',
      workflows: sanitizedWorkflows,
    };
    return templateData;
  }
}

module.exports = WorkflowTemplateApi;
