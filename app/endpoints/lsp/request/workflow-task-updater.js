const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const { areObjectIdsEqual } = require('../../../utils/schema');
const { forEachProviderTask } = require('../../../utils/request/workflow');
const rolesUtils = require('../../../utils/roles');
const { compareIdentifiableEntities, compareFileArray } = require('../../../utils/document/document-helper');
const CloudStorage = require('../../../components/cloud-storage');
const RequestDocumentApi = require('../company/request/document/request-document-api');
const { WORKFLOW_TASK_STATUSES, isLinguisticTask } = require('./workflow-helpers');
const requestApiHelper = require('./request-api-helper');

const PROVIDER_STATUS_APPROVED = 'approved';
const PROVIDER_STATUS_CANCELLED = 'cancelled';
const INVOICED_STATUS = 'Invoiced';
const PARTIALLY_INVOICED_STATUS = 'Partially Invoiced';
const NOT_INVOICED_STATUS = 'Not Invoiced';
const CANCELLED_REQUEST_INVOICE_STATUS = 'Cancelled';
const APPROVED_STATUS = 'approved';
const COMPLETED_STATUS = 'completed';
const CANCELLED_STATUS = 'cancelled';
const PENDING_TASK_STATUS = 'Pending';
const PROVIDER_READ_ONLY_STATUSES = [
  'completed',
  'cancelled',
  'approved',
];
const TASK_AUTO_TRANSLATE_ABILITIES = ['Auto Scan PDF to MT Translated', 'Auto Scan PDF to MT Skipped'];
class WorkflowTaskUpdater {
  constructor(workflows, options) {
    const {
      logger, configuration, fileStorageFacade, user, workflowApi,
      mockRequestBilled,
    } = options;
    // update tasks only for workflows where tasks array is populated
    // this means that those workflows were expanded and edited on the frontend
    this.workflows = workflows.filter((w) => _.get(w, 'tasks.length', 0) !== 0);
    this.logger = logger;
    user.roles = rolesUtils.getRoles(user);
    this.user = user;
    this.fileStorageFacade = fileStorageFacade;
    this.canUpdateAnyWorkflow = rolesUtils.hasRole('WORKFLOW_UPDATE_ALL', user.roles);
    this.canUpdateOwnWorkflow = rolesUtils.hasRole('WORKFLOW_UPDATE_OWN', user.roles);
    this.canApproveOwnTask = ['TASK-APPROVAL_UPDATE_OWN', 'TASK-APPROVAL_UPDATE_ALL'].some((r) => rolesUtils.hasRole(r, user.roles));
    this.canUpdateNotes = rolesUtils.hasRole('TASK-NOTES_UPDATE_ALL', user.roles);
    this.canUpdateStatus = ['TASK-STATUS_UPDATE_ALL', 'REQUEST_READ_ASSIGNED-TASK'].some((role) => rolesUtils.hasRole(role, user.roles));
    this.canUpdateWorkflow = this.canUpdateOwnWorkflow || this.canUpdateAnyWorkflow
      || this.canUpdateStatus;
    this.canOnlyUpdateStatus = this.canUpdateStatus && !this.canUpdateWorkflow;
    this.canUpdateInvoices = rolesUtils.hasRole('WORKFLOW_UPDATE_ALL', user.roles);
    this.isForeignCurrencyRequest = _.get(this.request, 'localCurrency.isoCode') !== _.get(this.request, 'quoteCurrency.isoCode');
    this.shouldSendEmail = false;
    this.providerChanges = [];
    this.statusChanges = [];
    this._filePromises = [];
    this.cloudStorage = new CloudStorage(configuration, logger);
    this.requestDocumentApi = new RequestDocumentApi({
      user,
      log: logger,
      configuration,
    });
    this.workflowApi = workflowApi;
    this.mockRequestBilled = mockRequestBilled;
    this.environmentName = configuration.environment.NODE_ENV;
  }

  /**
   * Applies all tasks updates for a given request
   * @param {Object} request the mongoose request from the database.
   */
  async applyUpdate(request) {
    if (this.canOnlyUpdateStatus) {
      this.logger.debug('Updating only tasks status');
      return this._applyStatusUpdate(request);
    }
    this.logger.debug('Updating all task info');
    return this._applyAllUpdates(request);
  }

  applyUpdateOnCompletedRequest(request) {
    this.logger.debug(`Updating task notes and statuses for completed request ${request._id}`);
    forEachProviderTask(request, ({ workflow, task, providerTask }) => {
      const updateWorkflow = this.workflows.find((w) => areObjectIdsEqual(w._id, workflow._id));
      const updateTask = _.get(updateWorkflow, 'tasks', []).find((t) => areObjectIdsEqual(t._id, task._id));
      const updateProviderTask = _.get(updateTask, 'providerTasks', [])
        .find((pt) => areObjectIdsEqual(pt._id, providerTask._id));

      if (!updateProviderTask) {
        this.logger.warn(`Couldn't find providerTask ${providerTask._id} for task ${task._id} for workflow ${workflow._id}. Request id ${request._id}`);
        return;
      }
      if (this.canUpdateNotes) {
        providerTask.notes = updateProviderTask.notes;
      }
      if (this.canUpdateStatus) {
        providerTask.status = updateProviderTask.status;
      }
    });
  }

  _properFileStorage(company, request, file, task) {
    if (!file.final) {
      this.logger.debug('Non final file provided, handle it with translationRequestTaskFile with AWS key');
      return _.get(this.fileStorageFacade.translationRequestTaskFile(company, request, task, file), 'path');
    }
    this.logger.debug('Final file provided, handle it with translationRequestTaskFile with AWS key');
    return _.get(this.fileStorageFacade.translationRequestFinalFile(company, request, file), 'path');
  }

  _processProviderTaskFile(request, requestProviderTask, editableTask, task, workflow) {
    this.logger.info('Processing provider task file');
    const comparison = compareFileArray(requestProviderTask.files, editableTask.files);

    this.logger.debug(`There are ${comparison.missing.length} files to delete and ${comparison.added.length} to be added`);
    comparison.missing.forEach((missing) => {
      // pull will do nothing
      requestProviderTask.files.pull({ _id: missing._id });
      if (missing.final && !missing.deleted) {
        request.finalDocuments.forEach((d) => {
          if (d.id === missing.id) {
            d._doc.deleted = true;
            request.markModified('finalDocuments');
          }
        });
      }
      const bucketFilePath = _.get(missing, 'cloudKey');

      this.logger.debug(`Queuing delete "${bucketFilePath}"`);
      this.logger.debug(`Cloud Storage: will delete Prefix "${bucketFilePath}"`);
      this._filePromises.push(
        new Promise((resolve) => this.cloudStorage.deleteFile(bucketFilePath)
          .then(resolve())
          .catch((err) => {
            const message = _.get(err, 'message', err);

            this.logger.debug(message);
            resolve();
          })),
      );
    });
    comparison.added.forEach((added) => {
      // Add task file if it doesn't exist already (whether is final or not)
      if (!requestProviderTask.files.find((f) => f._id.toString() === added._id)) {
        requestProviderTask.files.push(added);
      }
      if (added.final) {
        const idx = request.finalDocuments.findIndex((f) => f._id.toString()
          === added._id.toString());

        if (idx === -1) {
          _.unset(added, 'completed');
          request.finalDocuments.push(added);
        }
      }
    });
    if (task.ability === 'Validation and Delivery') {
      if (requestProviderTask.status === 'completed') {
        // FIXME final files should be read from the request's workflows
        // instead of duplicating the documents in the request documents.
        requestProviderTask.files.forEach((doc) => {
          if (doc.final) {
            const idx = request.finalDocuments.findIndex((f) => f.id === doc.id);

            if (idx === -1) {
              const newFinalFile = doc.toObject();

              _.unset(newFinalFile, 'completed');
              Object.assign(newFinalFile, {
                srcLang: workflow.srcLang,
                tgtLang: workflow.tgtLang,
              });
              request.finalDocuments.push(newFinalFile);
            }
          }
        });
      }
    }
    request.markModified('finalDocuments');
  }

  _removeTaskFilesIfExist(request, task) {
    if (task.providerTasks) {
      task.providerTasks.forEach((pt) => {
        // sending empty files to trigger file delete
        this._processProviderTaskFile(request, pt, { files: [] }, task);
      });
    }
  }

  _addTaskFilesIfExist(request, task) {
    if (task.providerTasks) {
      task.providerTasks.forEach((pt) => {
        // sending empty files to trigger file move
        this._processProviderTaskFile(request, { files: [] }, pt, task);
      });
    }
  }

  canUpdateProviderTask(request, workflow, task, providerTask) {
    const dbWorkflow = request.workflows.find((w) => areObjectIdsEqual(w._id, workflow._id));
    const dbTask = dbWorkflow.tasks.find((t) => areObjectIdsEqual(t._id, task._id));

    if (_.isNil(dbTask)) return true;
    const dbProviderTask = dbTask.providerTasks.find((p) => areObjectIdsEqual(p._id, providerTask._id));

    if (_.isNil(dbProviderTask)) return true;
    if (providerTask.status !== dbProviderTask.status) return true;
    return ![COMPLETED_STATUS, APPROVED_STATUS].includes(dbProviderTask.status);
  }

  async _updateProviderTask(request, existing, providerTask, task, workflow) {
    if (_.isBoolean(this.mockRequestBilled) && this.environmentName !== 'PROD') {
      existing.billed = this.mockRequestBilled;
    }
    if (!this.canUpdateProviderTask(request, workflow, task, providerTask)) return;
    // IF previous task is null or previous.status is completed, it should send an email
    // only if status or provider is changed.
    let oldProvider = _.get(existing, 'provider');

    if (oldProvider) {
      oldProvider = oldProvider.toString();
    }
    let newProvider = _.get(providerTask, 'provider');

    if (newProvider && typeof newProvider !== 'string') {
      if (newProvider instanceof ObjectId) {
        newProvider = newProvider.toString();
      } else if (newProvider._id) {
        newProvider = newProvider._id.toString();
      } else {
        newProvider = null;
      }
    }
    if (oldProvider !== newProvider) {
      // if there is no new provider then I wouldn't be able to send an email.
      if (newProvider) {
        if (!PROVIDER_READ_ONLY_STATUSES.includes(providerTask.status)) {
          const reason = oldProvider === '' ? 'newProvider' : 'provider';

          this.providerChanges.push({
            task,
            new: providerTask,
            existing,
            reason,
          });
        }
        existing.provider = providerTask.provider;
      } else {
        existing.provider = null;
      }
    }
    if (existing.status !== providerTask.status) {
      let canUpdateStatus = true;
      if (
        requestApiHelper.isPortalCat(request)
        && providerTask.status === COMPLETED_STATUS
        && isLinguisticTask(task.ability)
      ) {
        await this.workflowApi.populateWorkflowWithCATData(workflow, request);
        canUpdateStatus = !_.get(providerTask, 'hasQaIssues', false) && _.get(providerTask, 'areAllSegmentsConfirmed', true);
      }
      if (canUpdateStatus) {
        // the task must have a provider to send an email to.
        if (_.get(existing, 'provider._id')) {
          this.statusChanges.push({
            task,
            new: providerTask,
            existing,
          });
        }
        existing.status = providerTask.status;
      }
    }
    existing.taskDueDate = providerTask.taskDueDate;
    existing.instructions = providerTask.instructions;
    existing.notes = providerTask.notes;
    existing.minCharge = providerTask.minCharge;
    if (!_.isEmpty(_.get(providerTask, 'billDetails')) && this.user.has('TASK-FINANCIAL_UPDATE_ALL')) {
      existing.billDetails = providerTask.billDetails;
    }
    this._processProviderTaskFile(request, existing, providerTask, task, workflow);
  }

  hasTaskApprovedCompletedProviderTasks(originalTask) {
    return originalTask.providerTasks.some((p) => [APPROVED_STATUS, COMPLETED_STATUS].includes(p.status));
  }

  _getWorkflowTaskStatus(newTask) {
    if (newTask.status !== WORKFLOW_TASK_STATUSES.approved) {
      return newTask.status;
    }
    const allStatusesApprovedOrCancelled = _.every(newTask.providerTasks, (providerTask) => !_.isEmpty(providerTask.status.match(`${PROVIDER_STATUS_APPROVED}|${PROVIDER_STATUS_CANCELLED}`)));

    if (allStatusesApprovedOrCancelled) {
      return WORKFLOW_TASK_STATUSES.approved;
    }
    const errorMsg = 'Workflow Task Status=Approved must have provider tasks either approved or canceled';

    this.logger.error(`Error editing request. Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  async _updateTask(request, dbTask, newTask, workflow) {
    if (!this.canUpdateInvoices && !_.isEmpty(newTask.invoiceDetails)) {
      this.logger.debug('User does not have the role for updating invoice details for task');
      throw new Error('User is not allowed to update');
    }
    if (!this.hasTaskApprovedCompletedProviderTasks(dbTask)) {
      dbTask.ability = newTask.ability;
    }
    if (_.has(newTask, 'description')) {
      dbTask.description = newTask.description;
    }
    if (this.canUpdateInvoices
      && (!this.hasTaskApprovedCompletedProviderTasks(dbTask)
      || newTask.status === PENDING_TASK_STATUS
        || TASK_AUTO_TRANSLATE_ABILITIES.includes(newTask.ability))) {
      dbTask.minCharge = newTask.minCharge;
      dbTask.invoiceDetails = newTask.invoiceDetails;
    }
    dbTask.includedInGroup = newTask.includedInGroup;
    dbTask.allSegmentsAssignedToOneProvider = newTask.allSegmentsAssignedToOneProvider;
    const workflowStatus = this._getWorkflowTaskStatus(newTask);

    dbTask.status = workflowStatus;
    if (workflowStatus === WORKFLOW_TASK_STATUSES.approved
      && _.isNil(dbTask.dateOfApproval)) {
      dbTask.dateOfApproval = moment().utc().format();
    }
    const comparison = compareIdentifiableEntities(
      dbTask.providerTasks,
      newTask.providerTasks,
    );

    comparison.missing.forEach((missing) => {
      if (![COMPLETED_STATUS, CANCELLED_STATUS, APPROVED_STATUS].includes(missing.status)) {
        dbTask.providerTasks.pull({ _id: missing._id });
        // Forcing an empty array of files to trigger file delete
        this._processProviderTaskFile(request, missing, { files: [] }, dbTask, workflow);
      }
    });
    comparison.added.forEach((added) => {
      dbTask.providerTasks.push(added);
      // Forcing an empty array of files to trigger file move
      this._processProviderTaskFile(request, { files: [] }, added, dbTask, workflow);
    });
    await Promise.each(comparison.existing, (existing) => {
      // existiing is the original provider task from the database
      // we have to update every field and see if files need to be removed
      // or appended.
      // Since the provider task exists in both the original request and the changes
      // we can seach by id.
      const providerTaskIndex = newTask.providerTasks
        .findIndex((pt) => pt._id.toString() === existing._id.toString());
      const providerTask = newTask.providerTasks[providerTaskIndex];
      return this._updateProviderTask(request, existing, providerTask, newTask, workflow);
    });
  }

  async _applyAllUpdates(request) {
    return new Promise(async (resolve, reject) => {
      let tasksLength = 0;
      let invoicedTasks = 0;
      let cancelledTasks = 0;
      try {
        await Promise.each(this.workflows, async (w) => {
          const workflow = request.workflows.find((rw) => rw._id.toString() === w._id.toString());
          // we will update ONLY the tasks in existing workflows.
          if (!_.isNil(workflow)) {
            const comparison = compareIdentifiableEntities(workflow.tasks, w.tasks);
            comparison.missing.forEach((missing) => {
              workflow.tasks.pull({ _id: missing._id });
              this._removeTaskFilesIfExist(request, missing);
            });
            comparison.added.forEach((added) => {
              // we use push to notify mongoose about this change
              workflow.tasks.push(added);
              this._addTaskFilesIfExist(request, added);
            });
            await Promise.each(comparison.existing, (existing) => {
              // existing is the original task from the database
              // we have to check wether there were changes or file uploads.
              // Since the task exists in both the original request and the changes
              // we can seach by id.
              const workFlowTask = w.tasks
                .find((t) => t._id.toString() === existing._id.toString());
              return this._updateTask(request, existing, workFlowTask, w);
            });

            // re-order
            const tasksOrdered = w.tasks.map((orderedTask) => workflow.tasks.find((uTask) => uTask._id.toString() === orderedTask._id.toString()));
            workflow.tasks = tasksOrdered;
            // update request invoice status
            tasksLength += workflow.tasks.length;
            workflow.tasks.forEach((task) => {
              if (task.status === WORKFLOW_TASK_STATUSES.invoiced) {
                invoicedTasks++;
              } else if (task.status === WORKFLOW_TASK_STATUSES.cancelled) {
                const allCancelled = _.every(task.providerTasks, (pt) => pt.status === PROVIDER_STATUS_CANCELLED);
                if (allCancelled) cancelledTasks++;
              }
            });
          }
        });
      } catch (err) {
        return reject(err);
      }
      if (tasksLength > 0) {
        if (tasksLength === cancelledTasks) {
          request.requestInvoiceStatus = CANCELLED_REQUEST_INVOICE_STATUS;
        } else if (tasksLength === invoicedTasks + cancelledTasks) {
          request.requestInvoiceStatus = INVOICED_STATUS;
        } else if (invoicedTasks > 0) {
          request.requestInvoiceStatus = PARTIALLY_INVOICED_STATUS;
        } else {
          request.requestInvoiceStatus = NOT_INVOICED_STATUS;
        }
      }
      if (!_.isEmpty(this._filePromises)) {
        const fsPromises = this._filePromises.map((fp) => (() => fp));
        return Promise.resolve(fsPromises).mapSeries((f) => f()).then(resolve);
      }
      return resolve();
    });
  }

  _applyStatusUpdate(request) {
    this.workflows.forEach((workflow) => {
      const requestWorkflow = request.workflows
        .find((w) => w._id.toString() === workflow._id.toString());

      workflow.tasks.forEach((t) => {
        const requestTasks = requestWorkflow.tasks
          .find((rt) => rt._id.toString() === t._id.toString());

        if (requestTasks && requestTasks.providerTasks) {
          // grab only the user's tasks
          const editableTasks = t.providerTasks
            .filter((pt) => _.get(pt, 'provider._id', '').toString() === this.user._id.toString());

          if (!_.isEmpty(editableTasks)) {
            editableTasks.forEach((editableTask) => {
              const requestProviderTask = requestTasks.providerTasks
                .find((rpt) => rpt._id.toString() === editableTask._id.toString());

              if (requestProviderTask) {
                // since we were processing arrays of objects, we can update the value here
                // and expect to modify the original object
                if (editableTask.status === APPROVED_STATUS && this.canApproveOwnTask) {
                  requestProviderTask.status = editableTask.status;
                }
                this._processProviderTaskFile(
                  request,
                  requestProviderTask,
                  editableTask,
                  requestTasks,
                );
                requestProviderTask.notes = editableTask.notes;
              }
            });
          }
        }
      });
    });
    // When dealing with files take care concurrency to not block the same paths
    const fsPromises = this._filePromises.map((fp) => (() => fp));
    return Promise.resolve(fsPromises).mapSeries((f) => f());
  }
}

module.exports = WorkflowTaskUpdater;
