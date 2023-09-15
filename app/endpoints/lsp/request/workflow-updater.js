const _ = require('lodash');
const { compareIdentifiableEntities } = require('../../../utils/document/document-helper');
const { areObjectIdsEqual } = require('../../../utils/schema');

const APPROVED_STATUS = 'approved';
const COMPLETED_STATUS = 'completed';
const CANCELLED_STATUS = 'cancelled';
const IN_PROGRESS_STATUS = 'inProgress';
const ON_HOLD_STATUS = 'onHold';
const NOT_STARTED_STATUS = 'notStarted';
const CURRENT_TASKS_STATUSES = [ON_HOLD_STATUS, IN_PROGRESS_STATUS];
const FUTURE_AND_PENDING_TASKS_STATUSES = [NOT_STARTED_STATUS];
const CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS = [
  COMPLETED_STATUS, CANCELLED_STATUS, APPROVED_STATUS,
];
const EXTENDED_CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS = [
  COMPLETED_STATUS, CANCELLED_STATUS, APPROVED_STATUS, IN_PROGRESS_STATUS,
];
const FUTURE_TASKS_PREVIOUS_STATUS = [IN_PROGRESS_STATUS, ON_HOLD_STATUS, NOT_STARTED_STATUS];
const _isCurrentTask = (previousTask, currentTask) => {
  if (CURRENT_TASKS_STATUSES.some(s => s === currentTask.status)) {
    if (!previousTask) {
      return true;
    } else if (EXTENDED_CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS.indexOf(previousTask.status) !==
      -1) {
      return true;
    }
  }
  return false;
};

const _isPendingTask = (previousTask, isPreviousTaskCompleted, currentTask) => {
  if (FUTURE_AND_PENDING_TASKS_STATUSES.some(s => s === currentTask.status)) {
    if (!previousTask || isPreviousTaskCompleted) {
      return true;
    } else if (CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS.indexOf(previousTask.status) !== -1) {
      return true;
    }
  }
  return false;
};

const _isFutureTask = (previousTask, currentTask) => {
  if (FUTURE_AND_PENDING_TASKS_STATUSES.some(s => s === currentTask.status)) {
    if (previousTask) {
      if (FUTURE_TASKS_PREVIOUS_STATUS.some(s => s === previousTask.status)) {
        return true;
      }
    }
  }
  return false;
};

class WorkflowUpdater {
  constructor(user, newRequest, originalRequest, { workflowTaskUpdater }) {
    this.user = user;
    this.newRequest = newRequest;
    this.originalRequest = originalRequest;
    this.taskUpdater = workflowTaskUpdater;
  }

  canUpdateWorkflowLanguages(dbWorkflow) {
    return !dbWorkflow.tasks.some(t =>
      t.providerTasks.some(p =>
        [COMPLETED_STATUS, APPROVED_STATUS].includes(p.status)));
  }

  applyUpdate(request) {
    const requestWorkflows = _.get(request, 'workflows', []);
    const newRequestWorkflows = _.get(this.newRequest, 'workflows', []).filter(w => !w.deleted);
    const comparison = compareIdentifiableEntities(requestWorkflows, newRequestWorkflows);
    comparison.missing.forEach((missing) => {
      // I don't need to cascade any changes to tasks
      // because the workflow-task-updater does that.
      request.workflows.pull({ _id: missing._id });
      _.get(missing, 'tasks', [])
        .forEach(t => this.taskUpdater._removeTaskFilesIfExist(request, t));
    });
    comparison.added.forEach((added) => {
      // I don't need to cascade any new file to tasks
      // because the workflow-task-updater does that.
      // just adds a flat and a counter
      request.workflows.push(added);
    });
    comparison.existing.forEach((existing) => {
      // existing is the original workflow
      // since it exist I can seach it by id
      const workflow = newRequestWorkflows.find(w => w._id.toString() === existing._id.toString());
      if (this.canUpdateWorkflowLanguages(existing)) {
        existing.srcLang = workflow.srcLang;
        existing.tgtLang = workflow.tgtLang;
      }
      existing.workflowDueDate = workflow.workflowDueDate;
      existing.description = _.get(workflow, 'description', '');
      existing.useMt = _.get(workflow, 'useMt');
      // tasks are updated by workflow-task-updater.
    });
  }

  updateExistingWorkflow(workflow, request) {
    const workflows = _.get(request, 'workflows', []);
    const workflowInDb = workflows.find(w => areObjectIdsEqual(w._id, workflow._id));
    if (this.canUpdateWorkflowLanguages(workflowInDb)) {
      workflowInDb.srcLang = workflow.srcLang;
      workflowInDb.tgtLang = workflow.tgtLang;
    }
    workflowInDb.workflowDueDate = workflow.workflowDueDate;
    workflowInDb.description = _.get(workflow, 'description', '');
    workflowInDb.useMt = _.get(workflow, 'useMt', false);
    workflowInDb.updatedAt = new Date();
  }

  sortWorkflows(dbRequest, newRequest) {
    const sortedWorkflows = {};
    let hasSortingChanged = false;
    dbRequest.workflows.forEach((originalWorkflow) => {
      const newIndex = newRequest.workflows
        .filter(w => !w.deleted).findIndex(w => w._id === originalWorkflow.id);
      if (newIndex >= 0) {
        hasSortingChanged = true;
        Object.assign(sortedWorkflows, {
          [newIndex]: originalWorkflow,
        });
      }
    });
    if (hasSortingChanged && Object.keys(sortedWorkflows).length === dbRequest.workflows.length) {
      dbRequest.workflows = [];
      Object.keys(sortedWorkflows).forEach((newWorkflowIndex) => {
        dbRequest.workflows[_.toNumber(newWorkflowIndex)] =
          sortedWorkflows[_.toNumber(newWorkflowIndex)];
      });
      dbRequest.markModified('workflows');
    }
  }

  setProviderTasksPriorityStatus(request) {
    request.workflows.forEach((workflow) => {
      if (workflow.tasks) {
        workflow.tasks.forEach((task, tIndex, allTasks) => {
          if (task.providerTasks) {
            let isPreviousTaskCompleted = true;
            task.providerTasks.forEach((providerTask, pIndex, allProviderTasks) => {
              let previousTask = null;
              // Previous providerTask
              /* If task changed, previousProviderTask is the last item in providerTasks of the
              previous task
              */
              if (tIndex > 0 && pIndex === 0) {
                const providerTasksLen = allTasks[tIndex - 1].providerTasks.length;
                previousTask = allTasks[tIndex - 1].providerTasks[providerTasksLen - 1];
                isPreviousTaskCompleted = allTasks[tIndex - 1].providerTasks
                  .every(
                    pt => CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS.indexOf(pt.status) !== -1);
              }
              // If providerTask changed, previousProviderTask is the previous providerTask
              if (pIndex > 0) {
                previousTask = allProviderTasks[pIndex - 1];
              }
              if (providerTask.status === CANCELLED_STATUS) {
                providerTask.priorityStatus = 'cancelled';
              } else if (providerTask.status.match(`${COMPLETED_STATUS}|${APPROVED_STATUS}`)) {
                providerTask.priorityStatus = 'completed';
              } else if (_isCurrentTask(previousTask, providerTask)) {
                providerTask.priorityStatus = 'current';
              } else if (_isPendingTask(previousTask, isPreviousTaskCompleted, providerTask)) {
                providerTask.priorityStatus = 'pending';
              } else if (_isFutureTask(previousTask, providerTask)) {
                providerTask.priorityStatus = 'future';
              }
            });
          }
        });
      }
    });
    return request;
  }
}

module.exports = WorkflowUpdater;
