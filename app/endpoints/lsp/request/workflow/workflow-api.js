// eslint-disable-next-line global-require
const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const async = require('async');
const Promise = require('bluebird');
const { isEmpty } = require('lodash');
const { RestError } = require('../../../../components/api-response');
const requestAPIHelper = require('../request-api-helper');
const WorkflowTaskProviderValidator = require('../workflow-task-provider-validator');
const {
  hasPreviousIncompleteTaskChange,
  hasNextTaskStartedChange,
  hasPreviousCompletedTaskStatusChange,
  isCompletedTaskMissing,
  forEachProviderTask,
  resetMissingLanguageInWorkflow,
  copyWorkflow,
} = require('../workflow-helpers');
const WorkflowTaskUpdater = require('../workflow-task-updater');
const WorkflowUpdater = require('../workflow-updater');
const { getRequestInvoiceStatus } = require('../../ar-invoice/ar-invoice-helper');
const { areObjectIdsEqual } = require('../../../../utils/schema');
const CompanyMinimumChargeApi = require('../../company-minimum-charge/company-minimum-charge-api');
const FileStorageFacade = require('../../../../components/file-storage');
const MockableMoment = require('../../../../components/moment');
const SchemaAwareAPI = require('../../../schema-aware-api');
const WorkflowProviderEmailSender = require('./workflow-provider-email-sender');
const ConcurrencyReadDateChecker = require('../../../../utils/concurrency');

const REQUEST_COMPLETED_STATUS = 'Completed';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const PROVIDER_TASK_CANCELLED_STATUS = 'cancelled';
const TASK_ABILITY_REFLOW = 'Reflow';
const PROVIDER_TASK_COMPLETED_STATUS = 'completed';
const PORTALCAT_PIPELINE_TYPE_EXPORT = 'export';
const UPDATE_ERROR_MESSAGE = 'To see the new content, open this page in a new tab or refresh this page';

const PortalCatApi = require('../../portalcat/portalcat-api');
const { isLinguisticTask } = require('../workflow-helpers');
const { getProgressByTask } = require('../../portalcat/portalcat-helpers');
const { updateMatchingRateDetails } = require('./workflow-helpers');

const PORTALCAT_SEGMENTS_FILTER_QA = 'qa';
const abilityToAssignedToMap = {
  Translation: 'assignedToTranslator',
  Editing: 'assignedToEditor',
  PEMT: 'assignedToEditor',
  QA: 'assignedToQaEditor',
};
const ASSIGNEE_TYPE = {
  Translation: 'translator',
  Editing: 'editor',
  PEMT: 'editor',
  QA: 'qaEditor',
};
class WorkflowAPI extends SchemaAwareAPI {
  constructor(options) {
    const {
      user, configuration, logger, mock, mockServerTime, mockRequestBilled,
      requestApi,
    } = options;
    super(logger, { user });

    this.configuration = configuration;
    this.mock = mock;
    this.mockServerTime = mockServerTime;
    this.mockRequestBilled = mockRequestBilled;
    this.requestApi = requestApi;
    this.workflowProviderEmailSender = new WorkflowProviderEmailSender(
      this.logger,
      {
        mock: this.mock,
        lspId: this.lspId,
        serverUrl: this.requestApi.serverUrl,
      },
      this.user.lsp,
      this.schema,
      this.configuration,
    );
    this.canUpdateWorkflow = this.user.has([
      'WORKFLOW_UPDATE_OWN',
      'WORKFLOW_UPDATE_ALL',
      'REQUEST_READ_ASSIGNED-TASK',
    ]);

    this.fileStorageFacade = new FileStorageFacade(this.lspId, configuration, logger);
    this.companyMinimumChargeAPI = new CompanyMinimumChargeApi(
      logger,
      { user, configuration },
    );

    this.concurrencyReadDateChecker = new ConcurrencyReadDateChecker(
      this.user,
      this.logger,

      {
        entityName: 'workflow',
      },
    );
    this.portalCatApi = new PortalCatApi(this.logger, {
      user: this.user,
      configuration: this.configuration,
    }, requestApi, this);
  }

  async _assertPermissions() {
    if (!this.canUpdateWorkflow) {
      throw new RestError(403, { message: 'The user is not authorized to update this request' });
    }
    if (!this.user.has('WORKFLOW_UPDATE_ALL')) {
      throw new RestError(400, { message: 'You are not allowed to update' });
    }
  }

  async _getRequest(requestIdString) {
    let requestId;
    try {
      requestId = new ObjectId(requestIdString);
    } catch (e) {
      this.logger.error(`Bad requestId provided: ${requestIdString}`);
      throw new RestError(400, { message: 'The given requestId is invalid' });
    }
    this.logger.debug('Fetching original request');
    let dbRequest;
    try {
      this.logger.debug(`Retrieving request with _id ${requestId.toString()}`);
      dbRequest = await this.schema.Request.findOne({ _id: requestId, lspId: this.lspId });
    } catch (e) {
      const message = e.message || e;
      this.logger.error(`Error fetching request ${requestIdString}. Error: ${message}`);
      throw new RestError(500, { message: `Error editing request: ${message}`, stack: e.stack });
    }
    return dbRequest;
  }

  checkStatus(requestStatus) {
    if (requestStatus === REQUEST_COMPLETED_STATUS) {
      throw new RestError(400, { message: 'Request in completed status can not be updated' });
    }
  }

  async checkConcurency(dbEntity, entityToUpdate, errorMessage = '') {
    try {
      await this.concurrencyReadDateChecker.failIfOldEntity(dbEntity);
    } catch (e) {
      let message = errorMessage
        || `This ${this.concurrencyReadDateChecker.entityName} was changed from a different browser window or tab.`;
      message += ` ${UPDATE_ERROR_MESSAGE}`;
      throw new RestError(409, { message });
    }
  }

  _validateProviderTasks(dbRequest) {
    if (dbRequest.status !== REQUEST_COMPLETED_STATUS) {
      return;
    }
    forEachProviderTask(dbRequest, ({ providerTask }) => {
      const isProviderTaskFinished = [
        PROVIDER_TASK_APPROVED_STATUS,
        PROVIDER_TASK_CANCELLED_STATUS,
      ].includes(providerTask.status);
      if (!isProviderTaskFinished) {
        throw new RestError(400, { message: 'This request cannot be completed until all provider tasks in the request are "Approved" or "Canceled".' });
      }
    });
  }

  _validateProviderTaskStatus(dbRequest, originalRequest) {
    if (!this.requestApi.canOnlyUpdateOwnTasks) {
      return;
    }
    this.logger.debug('Checking if a provider task has change with previous incomplete task');
    if (hasPreviousIncompleteTaskChange(dbRequest, originalRequest)) {
      this.logger.error("attempted to change a task's status which was previously completed");
      // if 400 is returned, that would mean that request will be allways invalid.
      // returns 403 because if the user had other roles, the request would be valid.
      throw new RestError(403, { message: 'You cannot modify a provider task if there is previous incompleted task' });
    }
    this.logger.debug('Checking if a provider task has change with a next completed task');
    if (hasNextTaskStartedChange(dbRequest, originalRequest)) {
    // if 400 is returned, that would mean that request will be allways invalid.
    // returns 403 because if the user had other roles, the request would be valid.
      throw new RestError(403, { message: 'You cannot modify a provider task if there is a next completed task' });
    }
    // IF a user can only update the tasks assigned to him, we have to prevent
    // the user changing tasks statuses if the next task's state is "Not Started"
    this.logger.debug('Checking if the update does not change any completed task');
    if (hasPreviousCompletedTaskStatusChange(dbRequest, originalRequest)
    || isCompletedTaskMissing(dbRequest, originalRequest)) {
      this.logger.error("attempted to change a task's status which was previously completed");
      // if 400 is returned, that would mean that request will be allways invalid.
      // returns 403 because if the user had other roles, the request would be valid.
      throw new RestError(403, { message: 'You cannot modify a provider task if completed and the next one has started' });
    }
  }

  async _create(dbRequest, originalRequest, workflow) {
    const {
      logger, configuration, user, fileStorageFacade,
    } = this;
    const workflowTaskUpdater = new WorkflowTaskUpdater(
      [workflow],
      {
        user,
        fileStorageFacade,
        logger,
        configuration,
      },
    );
    const workflowUpdater = new WorkflowUpdater(
      user,
      null,
      originalRequest,
      { workflowTaskUpdater },
    );
    try {
      dbRequest.workflows.push(workflow);
      logger.debug('Updating workflow tasks');
      await workflowTaskUpdater.applyUpdate(dbRequest);
      await workflowUpdater.setProviderTasksPriorityStatus(dbRequest);
      const hasSomeWorkflowEmptyTasks = await async.some(dbRequest.workflows, async (w) => _.isEmpty(w.tasks));
      if (hasSomeWorkflowEmptyTasks) {
        logger.error('Error editing request. Error: A workflow must have at least one task');
        throw new Error('A workflow must have at least one task');
      }
      if (!this.requestApi.canOnlyUpdateAssignedTask) {
        await this.schema.Request.updateWorkflowTotals(dbRequest);
      }
      const serverTime = new MockableMoment(this.mockServerTime).getDateObject();
      dbRequest.updateWorkflowTasksApprovedCancelledStatus(serverTime, this.user.email);
      if (this.canUpdateWorkflow) {
        dbRequest.requestInvoiceStatus = getRequestInvoiceStatus(dbRequest);
      }
      logger.debug('Successfully updating workflow tasks (and moved the tasks files if any)');
    } catch (err) {
      const message = err.message || err;
      logger.error(`Error updating workflow tasks. Error ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, {
        message: `Error updating workflow tasks: ${message}`,
        stack: err.stack,
      });
    }
    this._validateProviderTasks(dbRequest);
  }

  async create(workflow, requestIdString) {
    await this._assertPermissions();
    const dbRequest = await this._getRequest(requestIdString);
    this.checkStatus(dbRequest.status);
    const originalRequest = dbRequest.toObject();
    await requestAPIHelper.generateWorkflowsIds(workflow);
    const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(this.user, this.schema);
    await workflowTaskProviderValidator.validateWorkflowTasks(
      workflow,
      dbRequest.workflows,
    );
    this._validateProviderTaskStatus(workflow, originalRequest);
    await this._create(dbRequest, originalRequest, workflow);
    const updatedRequest = await this.requestApi.saveRequest(dbRequest, { timestamps: false });
    try {
      await this.afterWorkflowSaveHook(originalRequest, workflow, updatedRequest);
    } catch (err) {
      this.logger.error(`Error executing after request save hook. Error: ${err}`);
    }
    return { request: updatedRequest };
  }

  async _formatTaskForPasting(
    task,
    { srcLang, tgtLang },
    {
      company, quoteCurrency, localCurrency, internalDepartment, deliveryDate,
    },
    companyRates,
  ) {
    if (!_.isEmpty(company) && !_.isEmpty(task.ability)) {
      const filters = {
        company: company._id,
        ability: task.ability,
        currencyId: quoteCurrency._id,
      };
      const srcLangName = _.get(srcLang, 'name', '');
      const tgtLangName = _.get(tgtLang, 'name', '');
      Object.assign(filters, {
        languageCombination: `${srcLangName} - ${tgtLangName}`,
      });
      const data = await this.companyMinimumChargeAPI.getMinCharge(filters);
      const minCharge = _.toNumber(_.get(data, 'minCharge', 0));
      task.minCharge = minCharge;
      task.total = minCharge;
    } else {
      task.minCharge = 0;
      task.total = 0;
    }
    if (!isEmpty(task.invoiceDetails)) {
      const internalDepartmentId = _.get(internalDepartment, '_id');
      const filters = {
        srcLang, tgtLang, quoteCurrency, localCurrency, internalDepartmentId,
      };
      if (!_.isEmpty(task.ability)) {
        filters.ability = await this.schema.Ability.findOne({
          name: task.ability,
          lspId: this.lspId,
        }).lean();
      }
      task.invoiceDetails.forEach((invoiceDetail) => updateMatchingRateDetails(
        invoiceDetail.invoice,
        filters,
        companyRates,
        this.companyMinimumChargeAPI,
      ));
    }
    if (!_.isEmpty(task.providerTasks)) {
      task.providerTasks.forEach((t) => {
        Object.assign(t, {
          billed: false,
          taskDueDate: deliveryDate,
        });
      });
    }
  }

  async _formatWorkflowForPasting(workflow, originalRequest, companyRates) {
    workflow.workflowDueDate = originalRequest.deliveryDate;
    if (!_.has(workflow, 'tasks')) {
      return workflow;
    }
    const srcLang = _.get(workflow, 'srcLang', {});
    const tgtLang = _.get(workflow, 'tgtLang', {});
    await Promise.map(workflow.tasks, (task) => this._formatTaskForPasting(
      task,
      { srcLang, tgtLang },
      originalRequest,
      companyRates,
    ));
  }

  async _formatWorkflowsForPasting(workflows, originalRequest) {
    const company = _.get(originalRequest, 'company._id');
    const query = { lspId: this.lspId, _id: company };
    const companyBillingInformation = await this.schema.CompanySecondary.findOne(query).select('billingInformation').lean();
    const companyRates = _.get(companyBillingInformation, 'billingInformation.rates', []);
    await Promise.map(workflows, (workflow) => this._formatWorkflowForPasting(
      workflow,
      originalRequest,
      companyRates,
    ));
  }

  _clearNonMatchingLanguageOfWorkflow(workflows, originalRequest) {
    return Promise.map(workflows, (workflow) => resetMissingLanguageInWorkflow(workflow, originalRequest));
  }

  async _updateRequestByPastingWorkflows(dbRequest, originalRequest, workflows) {
    const {
      logger, configuration, user, fileStorageFacade,
    } = this;
    const workflowTaskUpdater = new WorkflowTaskUpdater(
      workflows,
      {
        user,
        fileStorageFacade,
        logger,
        configuration,
      },
    );
    const workflowUpdater = new WorkflowUpdater(
      user,
      null,
      originalRequest,
      { workflowTaskUpdater },
    );
    try {
      dbRequest.workflows.push(...workflows);
      logger.debug('Updating workflow tasks');
      await workflowTaskUpdater.applyUpdate(dbRequest);
      await workflowUpdater.setProviderTasksPriorityStatus(dbRequest);
      const hasSomeWorkflowEmptyTasks = await async.some(dbRequest.workflows, async (workflow) => _.isEmpty(workflow.tasks));
      if (hasSomeWorkflowEmptyTasks) {
        logger.error('Error editing request. Error: A workflow must have at least one task');
        throw new Error('A workflow must have at least one task');
      }
      if (!this.requestApi.canOnlyUpdateAssignedTask) {
        await this.schema.Request.updateWorkflowTotals(dbRequest);
      }
      dbRequest.requestInvoiceStatus = getRequestInvoiceStatus(dbRequest);
      logger.debug('Successfully updating workflow tasks (and moved the tasks files if any)');
    } catch (err) {
      const message = err.message || err;
      logger.error(`Error updating workflow tasks. Error ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, {
        message: `Error updating workflow tasks: ${message}`,
        stack: err.stack,
      });
    }
    this._validateProviderTasks(dbRequest);
  }

  async paste(requestIdString, sourceRequestId, workflows) {
    await this._assertPermissions();
    const dbRequest = await this._getRequest(requestIdString);
    this.checkStatus(dbRequest.status);
    const originalRequest = dbRequest.toObject();
    const sourceRequest = await this.schema.Request
      .findOne({ _id: sourceRequestId, lspId: this.lspId }).lean();

    const copiedWorkflows = await Promise
      .map(workflows, async (workflow) => {
        const dbWorkflow = sourceRequest.workflows
          .find((w) => areObjectIdsEqual(w._id, workflow._id));
        await this.checkConcurency(dbWorkflow, workflow, 'You are trying to paste a workflow that was previously updated.');
        return copyWorkflow(dbWorkflow);
      })
      .filter((w) => !isEmpty(w));

    await this._clearNonMatchingLanguageOfWorkflow(copiedWorkflows, originalRequest);
    await this._formatWorkflowsForPasting(copiedWorkflows, originalRequest);
    await requestAPIHelper.generateWorkflowsIds(copiedWorkflows);
    const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(this.user, this.schema);
    await workflowTaskProviderValidator.validateWorkflowTasks(
      copiedWorkflows,
      dbRequest.workflows,
    );
    this._validateProviderTaskStatus(dbRequest, originalRequest);
    await this._updateRequestByPastingWorkflows(dbRequest, originalRequest, copiedWorkflows);
    const updatedRequest = await this.requestApi.saveRequest(dbRequest, { timestamps: false });
    return { request: updatedRequest };
  }

  async _assertEditWorkflowPermissions(workflowId, workflow, dbRequest) {
    const isCompleted = dbRequest.status === REQUEST_COMPLETED_STATUS;
    if (isCompleted) {
      const canUpdateTaskNotes = this.user.has('TASK-NOTES_UPDATE_ALL');
      const canUpdateTaskStatus = this.user.has('TASK-STATUS_UPDATE_ALL');
      if (!canUpdateTaskNotes && !canUpdateTaskStatus) {
        throw new RestError(403, { message: 'User does not have permission to edit workflow of completed request' });
      }
    }
    if (!this.canUpdateWorkflow) {
      throw new RestError(403, { message: 'The user is not authorized to update this request' });
    }
    if (this.user.has('WORKFLOW_UPDATE_ALL')) {
      return;
    }
    const dbRequestObject = dbRequest.toJSON();
    const dbWorkflow = dbRequestObject.workflows
      .find((w) => areObjectIdsEqual(w._id, workflowId));
    const dbInvoiceDetails = dbWorkflow.tasks.map((t) => _.get(t, 'invoiceDetails', [])).filter((item) => !_.isEmpty(item));
    if (!_.isEmpty(dbInvoiceDetails)) {
      const newInvoiceDetails = workflow.tasks.map((t) => t.invoiceDetails)
        .filter((item) => !_.isEmpty(item));
      if (!_.isEmpty(newInvoiceDetails)) {
        const invoiceDifferences = _.difference(dbInvoiceDetails, newInvoiceDetails);
        const dbBills = dbWorkflow.tasks.map((t) => t.providerTasks.map((p) => p.billDetails));
        const newBills = workflow.tasks.map((t) => t.providerTasks.map((p) => p.billDetails));
        const billDifferences = _.difference(dbBills, newBills);
        if (!_.isEmpty(invoiceDifferences) || !_.isEmpty(billDifferences)) {
          throw new RestError(400, { message: 'You are not allowed to update' });
        }
      }
    }
  }

  async updatePpoProviderInstructions(dbRequest, workflow) {
    const dbWorkflow = dbRequest.workflows.find((w) => areObjectIdsEqual(w._id, workflow._id));
    if (_.isEmpty(dbWorkflow)) {
      return;
    }
    if (!this.user.has('WORKFLOW_UPDATE_ALL') && !this.user.has('WORKFLOW_UPDATE_OWN')) {
      return;
    }

    const tasks = _.get(dbWorkflow, 'tasks', []);
    await Promise.map(tasks, async (task) => {
      const providerTasks = _.get(task, 'providerTasks', []);
      await Promise.map(providerTasks, async (providerTask) => {
        const updateTask = _.get(workflow, 'tasks', []).find((t) => areObjectIdsEqual(t._id, task._id));
        const updateProviderTask = _.get(updateTask, 'providerTasks', [])
          .find((pt) => areObjectIdsEqual(pt._id, providerTask._id));
        if (!updateProviderTask) {
          return;
        }
        if (updateProviderTask.instructions !== providerTask.instructions) {
          await this.schema.ProviderPoolingOffer.updateOne(
            {
              'request._id': dbRequest._id,
              workflowId: dbWorkflow._id,
              taskId: task._id,
              providerTaskId: providerTask._id,
            },
            { $set: { providerTaskInstructions: updateProviderTask.instructions } },
          );
        }
      });
    });
  }

  async _edit(dbRequest, originalRequest, workflow) {
    const {
      logger, configuration, user, fileStorageFacade,
    } = this;
    await requestAPIHelper.generateWorkflowsIds(workflow);
    const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(this.user, this.schema);
    await workflowTaskProviderValidator.validateWorkflowTasks(
      workflow,
      dbRequest.workflows,
    );
    const workflowTaskUpdater = new WorkflowTaskUpdater(
      [workflow],
      {
        user,
        fileStorageFacade,
        logger,
        configuration,
        workflowApi: this,
        mockRequestBilled: this.mockRequestBilled,
      },
    );
    const workflowUpdater = new WorkflowUpdater(
      user,
      null,
      originalRequest,
      { workflowTaskUpdater },
    );
    try {
      if (this.canUpdateWorkflow) {
        workflowUpdater.updateExistingWorkflow(workflow, dbRequest);
      }
      logger.debug('Updating workflow tasks');
      await workflowTaskUpdater.applyUpdate(dbRequest);
      await workflowUpdater.setProviderTasksPriorityStatus(dbRequest);
      const haveSomeWorkflowsEmptyTasks = await async.some(dbRequest.workflows, async (w) => _.isEmpty(w.tasks));
      if (haveSomeWorkflowsEmptyTasks) {
        logger.error('Error editing request. Error: A workflow must have at least one task');
        throw new Error('A workflow must have at least one task');
      }
      if (!this.requestApi.canOnlyUpdateAssignedTask) {
        await this.schema.Request.updateWorkflowTotals(dbRequest);
      }
      const serverTime = new MockableMoment(this.mockServerTime).getDateObject();
      dbRequest.updateWorkflowTasksApprovedCancelledStatus(serverTime, this.user.email);
      if (this.canUpdateWorkflow) {
        dbRequest.requestInvoiceStatus = getRequestInvoiceStatus(dbRequest);
      }
      logger.debug('Successfully updating workflow tasks (and moved the tasks files if any)');
    } catch (err) {
      const message = err.message || err;
      logger.error(`Error updating workflow tasks. Error ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, {
        message: `Error updating workflow tasks: ${message}`,
        stack: err.stack,
      });
    }
    this._validateProviderTasks(dbRequest);
  }

  async edit(workflow, requestIdString, workflowId) {
    const dbRequest = await this._getRequest(requestIdString);
    this.checkStatus(dbRequest.status);
    await this._assertEditWorkflowPermissions(workflowId, workflow, dbRequest);
    const originalRequest = dbRequest.toObject();
    const dbWorkflow = originalRequest.workflows.find((w) => w._id.toString() === workflowId);
    if (_.isEmpty(dbWorkflow)) {
      throw new RestError(409, { message: `You are trying to update a workflow that was previously deleted. ${UPDATE_ERROR_MESSAGE}` });
    }
    await this.checkConcurency(dbWorkflow, workflow);
    this._validateProviderTaskStatus(dbRequest, originalRequest);
    await this._edit(dbRequest, originalRequest, workflow);
    if (requestAPIHelper.isPortalCat(dbRequest)) {
      if (this.user.has('WORKFLOW_UPDATE_ALL')) {
        try {
          const workflowPipelines = await this.portalCatApi.getPipelines({ requestId: requestIdString, workflowId, type: 'import' });
          const workflowPipelinesFileIds = workflowPipelines.map((p) => p.fileId);
          await this.assignPortalCatSegments(
            originalRequest,
            dbRequest,
            workflowPipelinesFileIds,
            [workflowId],
          );
        } catch (err) {
          this.logger.error(`Error assigning segments to a single vendor. Error: ${err}`);
        }
      }
      this.triggerPortalCatExport(dbRequest)
        .catch((err) => this.logger.error(`Error triggering PortalCat export pipeline: ${err}`));
    }
    const updatedRequest = await this.requestApi.saveRequest(dbRequest, { timestamps: false });
    await this.updatePpoProviderInstructions(originalRequest, workflow);
    try {
      await this.afterWorkflowSaveHook(originalRequest, workflow, updatedRequest);
    } catch (err) {
      this.logger.error(`Error executing after request save hook. Error: ${err}`);
    }
    return { request: updatedRequest };
  }

  async delete(workflows, requestIdString) {
    await this._assertPermissions();
    const dbRequest = await this._getRequest(requestIdString);
    this.checkStatus(dbRequest.status);
    const originalRequest = dbRequest.toObject();
    this._validateProviderTaskStatus(dbRequest, originalRequest);
    try {
      await Promise.each(workflows, async (workflow) => {
        const dbWorkflow = dbRequest.workflows.find((w) => w._id.toString() === workflow._id);
        await this.checkConcurency(dbWorkflow, workflow, 'You are trying to delete a workflow that was previously updated.');
        dbRequest.workflows.pull({ _id: workflow._id });
      });
      const haveSomeWorkflowsEmptyTasks = await async.some(dbRequest.workflows, async (w) => _.isEmpty(w.tasks));
      if (haveSomeWorkflowsEmptyTasks) {
        this.logger.error('Error editing request. Error: A workflow must have at least one task');
        throw new Error('A workflow must have at least one task');
      }
      if (!this.requestApi.canOnlyUpdateAssignedTask) {
        await this.schema.Request.updateWorkflowTotals(dbRequest);
      }
      if (this.canUpdateWorkflow) {
        dbRequest.requestInvoiceStatus = getRequestInvoiceStatus(dbRequest);
      }
      this.logger.debug('Successfully updating workflow tasks (and moved the tasks files if any)');
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error updating workflow tasks. Error ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, {
        message: `Error updating workflow tasks: ${message}`,
        stack: err.stack,
      });
    }
    this._validateProviderTasks(dbRequest);
    if (_.isEmpty(dbRequest.workflows)) {
      dbRequest.workflowTemplate = '';
    }
    const updatedRequest = await this.requestApi.saveRequest(dbRequest, { timestamps: false });
    return { request: updatedRequest };
  }

  async setOrder(workflowIds, requestIdString) {
    let workflowIdList = [];
    try {
      workflowIdList = workflowIds.map((id) => new ObjectId(id));
    } catch (e) {
      this.logger.error(`Bad workflowIds provided: ${JSON.stringify(workflowIds)}`);
      throw new RestError(400, { message: 'The given workflowIds are invalid' });
    }
    await this._assertPermissions();
    const dbRequest = await this._getRequest(requestIdString);
    this.checkStatus(dbRequest.status);
    const originalRequest = dbRequest.toObject();
    if (workflowIds.length !== dbRequest.workflows.length) {
      throw new RestError(400, { message: 'The given workflowIds are invalid' });
    }
    const newWorkflows = workflowIdList.map((_id) => dbRequest.workflows.find((w) => areObjectIdsEqual(w._id, _id)));
    const hasEmptyWorkflow = await async.some(newWorkflows, async (w) => _.isEmpty(w));

    if (hasEmptyWorkflow) {
      throw new RestError(400, { message: 'The given workflowIds are invalid' });
    }
    this._validateProviderTaskStatus(dbRequest, originalRequest);
    try {
      dbRequest.workflows = newWorkflows;
      const haveSomeWorkflowsEmptyTasks = await async.some(dbRequest.workflows, async (w) => _.isEmpty(w.tasks));
      if (haveSomeWorkflowsEmptyTasks) {
        this.logger.error('Error editing request. Error: A workflow must have at least one task');
        throw new Error('A workflow must have at least one task');
      }
      if (!this.requestApi.canOnlyUpdateAssignedTask) {
        await this.schema.Request.updateWorkflowTotals(dbRequest);
      }
      if (this.canUpdateWorkflow) {
        dbRequest.requestInvoiceStatus = getRequestInvoiceStatus(dbRequest);
      }
      this.logger.debug('Successfully updating workflow tasks (and moved the tasks files if any)');
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error updating workflow tasks. Error ${message}`);
      if (err instanceof RestError) {
        throw err;
      }
      throw new RestError(500, {
        message: `Error updating workflow tasks: ${message}`,
        stack: err.stack,
      });
    }
    this._validateProviderTasks(dbRequest);
    const updatedRequest = await this.requestApi.saveRequest(dbRequest, { timestamps: false });
    return { request: updatedRequest };
  }

  async afterWorkflowSaveHook(originalRequest, workflow, newRequest) {
    if (!_.isEmpty(workflow)) {
      this.workflowProviderEmailSender.sendWorkflowEmails(originalRequest, workflow);
    }
    this.requestApi.triggerPortalCatPipelines(originalRequest, newRequest);
  }

  triggerPortalCatExport(request) {
    return Promise.map(
      request.workflows,
      async (workflow) => {
        let isReflowEncountered = false;
        const areAllPreReflowProviderTasksCompleted = workflow.tasks.every((task) => {
          const isReflow = task.ability === TASK_ABILITY_REFLOW;
          if (isReflow || isReflowEncountered) {
            isReflowEncountered = true;
            return true;
          }
          return task.providerTasks.every(
            (providerTask) => providerTask.status === PROVIDER_TASK_COMPLETED_STATUS
              || providerTask.status === PROVIDER_TASK_APPROVED_STATUS,
          );
        });
        if (!areAllPreReflowProviderTasksCompleted || !isReflowEncountered) {
          return;
        }
        const exportOperation = await this.portalCatApi.buildPcOperation({
          operation: 'run',
          type: PORTALCAT_PIPELINE_TYPE_EXPORT,
          languageCombinations: request.languageCombinations,
          srcLangFilter: _.get(workflow, 'srcLang.isoCode'),
          tgtLangFilter: _.get(workflow, 'tgtLang.isoCode'),
        });
        return this.portalCatApi.performPipelinesOperations({
          requestId: request._id,
          operations: [exportOperation],
        });
      },
    );
  }

  async assignPortalCatSegments(originalRequest, newRequest, fileIdsFilter = [], workflowIdsFilter = []) {
    const oldWorkflows = _.defaultTo(_.get(originalRequest, 'workflows'), []);
    const workflows = _.get(newRequest, 'workflows', []);
    await Promise.mapSeries(newRequest.languageCombinations, async (lc) => {
      const documents = requestAPIHelper
        .getRequestDocuments(newRequest.languageCombinations, lc._id);
      const filteredDocuments = await this.portalCatApi.filterDocumentsByPcAllowance(documents);
      let fileIds = _.map(filteredDocuments, '_id');
      if (!_.isEmpty(fileIdsFilter)) {
        fileIds = _.intersectionWith(fileIds, fileIdsFilter, areObjectIdsEqual);
      }
      if (_.isEmpty(fileIds)) {
        return;
      }
      return Promise.mapSeries(
        lc.srcLangs,
        (srcLang) => Promise.mapSeries(lc.tgtLangs, (tgtLang) => {
          const workflow = _.find(
            workflows,
            (w) => w.srcLang.isoCode === srcLang.isoCode
              && w.tgtLang.isoCode === tgtLang.isoCode
              && (_.isEmpty(workflowIdsFilter) || workflowIdsFilter.includes(w._id.toString())),
          );
          if (_.isNil(workflow)) {
            return;
          }
          const oldWorkflow = oldWorkflows.find((w) => areObjectIdsEqual(w._id, workflow._id));
          const workflowTasks = _.get(workflow, 'tasks', []);
          const oldWorkflowTasks = _.get(oldWorkflow, 'tasks', []);
          const tasksToUpdate = this._getTasksForSegmentsAssignment(workflowTasks, oldWorkflowTasks);
          const getFirstTaskByAbility = (tasks, ability) => tasks.find((task) => _.get(task, 'ability', '') === ability);
          const translationTask = getFirstTaskByAbility(tasksToUpdate, 'Translation');
          let editingTask = getFirstTaskByAbility(tasksToUpdate, 'Editing');
          if (_.isNil(editingTask)) {
            editingTask = getFirstTaskByAbility(tasksToUpdate, 'PEMT');
          }
          const qaTask = getFirstTaskByAbility(tasksToUpdate, 'QA');
          const assignmentUsers = [translationTask, editingTask, qaTask]
            .filter((task) => !_.isNil(task))
            .map((task) => {
              const providerId = _.get(task, 'providerTasks[0].provider._id');
              const taskAbility = _.get(task, 'ability', '');
              return {
                userId: providerId,
                userType: _.get(ASSIGNEE_TYPE, taskAbility, null),
              };
            });
          if (_.isEmpty(assignmentUsers)) {
            return;
          }
          return this._performSegmentsAssignment({
            fileIds,
            request: newRequest,
            workflow,
            users: assignmentUsers,
          });
        }),
      );
    });
  }

  async find(requestId, workflowIds = [], { withCATData = true } = {}) {
    const workflowObjectIds = workflowIds.map((id) => new ObjectId(id));
    const query = {
      lspId: this.lspId,
      _id: new ObjectId(requestId),
    };
    if (!_.isEmpty(workflowObjectIds)) {
      query['workflows._id'] = { $in: workflowObjectIds };
    }
    const pipelines = [
      { $match: query },
      { $project: { workflows: 1 } },
      { $unwind: '$workflows' },
    ];
    if (!_.isEmpty(workflowObjectIds)) {
      pipelines.push({ $match: { 'workflows._id': { $in: workflowObjectIds } } });
    }
    pipelines.push({ $replaceRoot: { newRoot: '$workflows' } });

    const workflows = await this.schema.Request.aggregate(pipelines);
    if (!_.isEmpty(workflowObjectIds) && _.isEmpty(workflows)) {
      throw new RestError(
        404,
        { message: `Request ${requestId} with workflows ${workflowIds} does not exist` },
      );
    }

    const request = await this._getRequest(requestId);
    if (withCATData) {
      await Promise.map(workflows, (workflow) => this.populateWorkflowWithCATData(workflow, request));
    }
    return workflows;
  }

  async populateWorkflowWithCATData(workflow = {}, request = {}) {
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const languageCombinations = request.languageCombinations.filter((combination) => {
      const srcLang = _.get(combination, 'srcLangs', []).find((lang) => lang.isoCode === srcIsoCode);
      const tgtLang = _.get(combination, 'tgtLangs', []).find((lang) => lang.isoCode === tgtIsoCode);
      return !_.isNil(srcLang) && !_.isNil(tgtLang);
    });
    const documents = await this.portalCatApi.filterDocumentsByPcAllowance(
      requestAPIHelper.getRequestDocuments(languageCombinations),
    );
    const documentIdsToSegmentsWithIssues = await Promise.reduce(documents, async (res, document) => {
      const segmentsWithQaIssues = await this.portalCatApi.getFileSegments({
        request,
        workflow,
        fileId: document._id,
        filter: PORTALCAT_SEGMENTS_FILTER_QA,
      });
      res[document._id] = segmentsWithQaIssues;
      return res;
    }, {});
    workflow.hasQaIssues = Object.keys(documentIdsToSegmentsWithIssues)
      .some((documentId) => !_.isEmpty(documentIdsToSegmentsWithIssues[documentId]));
    await this._populateProviderTasksWitCATData(workflow, request, documentIdsToSegmentsWithIssues);
  }

  _performSegmentsAssignment({
    request, workflow, fileIds, users,
  }) {
    const companyId = _.get(request, 'company._id', '');
    return Promise.map(fileIds, async (fileId) => {
      const params = {
        requestId: request._id,
        fileId,
        companyId,
        srcLang: _.get(workflow, 'srcLang.isoCode'),
        tgtLang: _.get(workflow, 'tgtLang.isoCode'),
      };
      await this.portalCatApi.ensureImportCompleted(params);
      await this.portalCatApi.ensureMtCompleted(params);
      await this.portalCatApi.assignFileSegmentsToUser({
        requestId: request._id,
        workflow,
        fileId,
        users,
      });
    });
  }

  _getTasksForSegmentsAssignment(newTasks, oldTasks) {
    return newTasks.filter((task) => {
      let haveProviderTasksChanged = true;
      const newProviderTasks = _.get(task, 'providerTasks', []);
      const oldTask = oldTasks.find((t) => areObjectIdsEqual(t._id, task._id));
      const oldProviderTasks = _.get(oldTask, 'providerTasks', []);
      haveProviderTasksChanged = newProviderTasks.some((newPt) => {
        const oldPt = oldProviderTasks.find((pt) => areObjectIdsEqual(
          _.get(newPt, '_id', ''),
          _.get(pt, '_id', ''),
        ));
        return _.isNil(oldPt) || !areObjectIdsEqual(
          _.get(newPt, 'provider._id', ''),
          _.get(oldPt, 'provider._id', ''),
        );
      });
      const taskAbility = _.get(task, 'ability', '');
      const hasOneTask = _.get(newProviderTasks, 'length', 0) === 1;
      const providerId = _.get(_.first(newProviderTasks), 'provider._id');
      const shouldUpdate = isLinguisticTask(taskAbility)
        && (haveProviderTasksChanged || !task.allSegmentsAssignedToOneProvider)
        && hasOneTask
        && !_.isNil(providerId);
      if (shouldUpdate) {
        task.allSegmentsAssignedToOneProvider = true;
      }
      return shouldUpdate;
    });
  }

  async _populateProviderTasksWitCATData(workflow = {}, request = {}, documentIdsToSegmentsWithIssues = []) {
    const tasks = _.get(workflow, 'tasks', []);
    await Promise.mapSeries(tasks, async (task) => {
      if (!isLinguisticTask(task.ability)) {
        return;
      }
      const assignedToFieldName = abilityToAssignedToMap[task.ability];
      try {
        const taskProgress = await this.portalCatApi.getTaskProgress({ request, workflow, task });
        const providerTasks = _.get(task, 'providerTasks', []);
        providerTasks.forEach((pt) => {
          const providerId = _.get(pt, 'provider._id', '');
          pt.hasQaIssues = Object.keys(documentIdsToSegmentsWithIssues).some((documentId) => {
            const assignedSegments = documentIdsToSegmentsWithIssues[documentId]
              .filter((segment) => areObjectIdsEqual(segment[assignedToFieldName], providerId));
            return !_.isEmpty(assignedSegments);
          });
          const providerTaskProgress = _.get(taskProgress, providerId);
          if (_.isNil(providerTaskProgress)) {
            pt.areAllSegmentsConfirmed = false;
          } else {
            const progress = getProgressByTask(providerTaskProgress, task.ability);
            if (progress < providerTaskProgress.assignedWordsTotal) {
              pt.areAllSegmentsConfirmed = false;
            } else {
              pt.areAllSegmentsConfirmed = true;
            }
          }
        });
      } catch (error) {
        const message = _.get(error, 'message', error);
        this.logger.error(`Error getting task progress for workflow provider tasks decoration: ${message}`);
      }
    });
  }
}

module.exports = WorkflowAPI;
