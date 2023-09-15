const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { compareFileArray } = require('../../../utils/document/document-helper');
const { isEqualArray } = require('../../../utils/arrays');
const { areObjectIdsEqual } = require('../../../utils/schema');
const logger = require('../../../components/log/logger');

const WORKFLOW_TASK_STATUSES = {
  pending: 'Pending',
  approved: 'Approved',
  invoiced: 'Invoiced',
  cancelled: 'Cancelled',
  partiallyInvoiced: 'Partially Invoiced',
};
const PENDING_TASK_STATUS = 'Pending';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const PROVIDER_TASK_CANCELLED_STATUS = 'cancelled';
const PROVIDER_TASK_COMPLETED_STATUS = 'completed';
const LINGUISTIC_TASKS = {
  Translation: 'TRANSLATION',
  QA: 'QA',
  Editing: 'EDITING',
  PEMT: 'EDITING',
};

const _findPTaskInPTasks = (pTask, pTasks) => {
  const pTaskLen = pTasks.length;
  const pTaskId = pTask._id.toString();

  for (let i = 0; i < pTaskLen; i++) {
    const originalPTask = pTasks[i];

    if (originalPTask._id.toString() === pTaskId) {
      return originalPTask;
    }
  }
  return null;
};

const _findPTaskInTasks = (pTask, tasks) => {
  if (tasks) {
    const taskLen = tasks.length;

    for (let i = 0; i < taskLen; i++) {
      const task = tasks[i];
      const pTaskFound = _findPTaskInPTasks(pTask, task.providerTasks);

      if (pTaskFound) {
        return pTaskFound;
      }
    }
  }
  return null;
};

const _findPTaskInWorkflows = (pTask, workflows) => {
  const workflowsLen = workflows.length;

  for (let i = 0; i < workflowsLen; i++) {
    const w = workflows[i];
    const pTaskFound = _findPTaskInTasks(pTask, w.tasks);

    if (pTaskFound) {
      return pTaskFound;
    }
  }
  return null;
};

const findPreviousTask = (providerTask, allTasks) => {
  if (providerTask) {
    let providerTaskIndex;
    const taskIndex = allTasks.findIndex((task) => {
      if (task.providerTasks) {
        providerTaskIndex = task.providerTasks
          .findIndex((ptTask) => areObjectIdsEqual(ptTask._id, providerTask._id));
        return providerTaskIndex >= 0;
      }
      return false;
    });

    if (taskIndex > 0) {
      return allTasks[taskIndex - 1];
    }
  }
  return null;
};

const findPreviousProviderTask = (providerTask, allTasks) => {
  if (providerTask) {
    let providerTaskIndex;
    const taskIndex = allTasks.findIndex((task) => {
      if (task.providerTasks) {
        providerTaskIndex = task.providerTasks
          .findIndex((ptTask) => areObjectIdsEqual(ptTask._id, providerTask._id));
        return providerTaskIndex >= 0;
      }
      return false;
    });

    if (taskIndex > 0) {
      return allTasks[taskIndex - 1].providerTasks.every((pt) => pt.status === 'completed');
    }
  }
  return null;
};

const hasDifferentProvider = (originalProviderTask, providerTask) => {
  const op = _.get(originalProviderTask, 'provider');
  const p = _.get(providerTask, 'provider');

  if (op && p) {
    // op can be an object, a string or an ObjectId
    // we try to obtain something comparable by string.
    const opId = _.get(op, '_id', op) || '';
    const pId = _.get(p, '_id', p) || '';
    return opId.toString() !== pId.toString();
  } if ((!op && p) || (op && !p)) {
    return true;
  }
  return false;
};

const findOriginalProviderTask = (task, workflows) => {
  if (workflows) {
    return _findPTaskInWorkflows(task, workflows);
  }
  return null;
};

const findAllOriginalTasks = (providerTask, workflows) => {
  let allTasks = [];

  if (workflows) {
    workflows.findIndex((w) => {
      if (w.tasks) {
        const taskIndex = w.tasks.findIndex((t) => {
          if (t.providerTasks) {
            const ptIndex = t.providerTasks.findIndex((pt) => areObjectIdsEqual(pt._id, providerTask._id));
            return ptIndex !== -1;
          }
          return false;
        });

        if (taskIndex !== -1) {
          allTasks = w.tasks;
          return true;
        }
        return false;
      }
      return false;
    });
  }
  return allTasks;
};

const isPreviousStatusCompleted = (providerTask, allTasks) => {
  if (providerTask) {
    let providerTaskIndex;
    const taskIndex = allTasks.findIndex((task) => {
      if (task.providerTasks) {
        providerTaskIndex = task.providerTasks
          .findIndex((ptTask) => areObjectIdsEqual(ptTask._id, providerTask._id));
        return providerTaskIndex >= 0;
      }
      return false;
    });

    if (taskIndex > 0) {
      return allTasks[taskIndex - 1].providerTasks.every((pt) => pt.status === 'completed' || pt.status === 'cancelled');
    }
  }
  return null;
};

const diffPropExistance = (one, other, prop) => (_.hasIn(one, prop) && !_.hasIn(other, prop))
|| (!_.hasIn(one, prop) && _.hasIn(other, prop));

const isEqualProviderTask = (original, other) => {
  const providerTaskId = _.get(original, '_id', '').toString();

  if (_.get(original, 'provider._id') && _.get(other, 'provider._id')) {
    // in case provider is a populated doc
    if (original.provider._id && other.provider._id
      && original.provider._id.toString() !== other.provider._id.toString()) {
      logger.debug(`Original provider differs from new provider. Provider task id: ${providerTaskId}`);
      return false;
    } if (diffPropExistance(original, other, 'provider')) {
      return false;
    }
  }
  if (diffPropExistance(original, other, 'taskDueDate')) {
    logger.debug(`Original provider task due date differs from new task due date. Provider task id: ${providerTaskId}`);
    return false;
  }
  if (original.taskDueDate) {
    const varType = typeof original.taskDueDate;

    // eslint-disable-next-line valid-typeof
    if (varType !== typeof other.taskDueDate) {
      return false;
    }
    switch (varType) {
      case 'string': {
        if (original.taskDueDate !== other.taskDueDate) {
          return false;
        }
        break;
      }
      case 'object': {
        if (moment.isMoment(original.taskDueDate) && original.taskDueDate.diff(other.taskDueDate, 'seconds') !== 0) {
          return false;
        } if (original.taskDueDate instanceof Date
            && other.taskDueDate instanceof Date) {
          if (original.taskDueDate.getTime() !== other.taskDueDate.getTime()) {
            logger.debug(`Original provider task due date  instanceof Date differs from new task due date. Provider task id: ${providerTaskId}`);
            return false;
          }
        } else {
          logger.debug(`Cannot determine task due date type for provider task ${providerTaskId}`);
          // cannot determine variable type
          return false;
        }
        break;
      }
      default:
        // if not object nor string then we cannot compare dates.
        return false;
    }
  }
  if (original.status !== other.status) {
    logger.debug(`Original provider task status ${original.status} differs from new status ${other.status}`);
    return false;
  }
  if (diffPropExistance(original, other, 'files')) {
    logger.debug(`Original provider task files differ from new files. ${providerTaskId}`);
    return false;
  }
  const comparison = compareFileArray(_.get(original, 'files', []), _.get(other, 'files', []));

  if (comparison.missing.length !== 0 || comparison.added.length !== 0) {
    logger.debug(`Original provider task files differ from new files: Added: ${comparison.added.length}. Provider task Id: ${providerTaskId}`);
    return false;
  }
  if (diffPropExistance(original, other, 'notes') || _.get(original, 'notes') !== _.get(other, 'notes')) {
    logger.debug(`Original provider task notes differ from new notes. Provider task Id: ${providerTaskId}`);
    return false;
  }
  if (diffPropExistance(original, other, 'quantity')) {
    logger.debug(`Original provider quantity differ from new notes. Provider task Id: ${providerTaskId}`);
    return false;
  }
  const comparisonOptions = {
    comparison: (q1, q2) => _.isEqual(_.pick(q1, ['amount', 'units']), _.pick(q2, ['amount', 'units'])),
    matchByIndex: true,
  };

  if (original.quantity && !isEqualArray(original.quantity, other.quantity, comparisonOptions)) {
    logger.debug(`Original provider quantity differ from new quantity. Provider task Id: ${providerTaskId}`);
    return false;
  }
  logger.debug(`Original provider is equal to the new provider task. Provider task Id: ${providerTaskId}`);
  return true;
};

const hasNextTaskStarted = (tasks, index) => {
  logger.debug(`Checking if task with index: ${index} has a next task with status !== notStarted`);
  const len = tasks.length;

  if (index + 1 < len) {
    for (let i = index + 1; i < len; i++) {
      const nextTask = tasks[i];

      if (!_.isEmpty(nextTask.ability)) {
        logger.debug(`Checking nextTask with ability ${nextTask.ability}`);
      }
      if (nextTask && nextTask.providerTasks) {
        logger.debug('Searching for a provider task with status different than notStarted');
        const nextProviderTaskIndex = nextTask.providerTasks.findIndex((pt) => pt.status !== 'notStarted');

        if (nextProviderTaskIndex !== -1) {
          logger.debug(`Found a next task, provider task index: ${nextProviderTaskIndex}. Task id is ${_.get(nextTask, '_id', '').toString()}`);
          return true;
        }
      }
    }
  }
  return false;
};

const isProviderTaskChangeAllowed = (originalProviderTask, newProviderTask, tasks, j) =>
  // If task was previously completed, we need to check the following task status
  originalProviderTask.status === 'completed'
    && !isEqualProviderTask(originalProviderTask, newProviderTask)
    && hasNextTaskStarted(tasks, j);

const _hasWorkflowDifferentProviderTask = (workflow, originalWorkflows) => workflow.tasks.some((task) => {
  if (_.isEmpty(task.providerTasks)) {
    return false;
  }
  return task.providerTasks.some((providerTask) => {
    const originalPT = _findPTaskInWorkflows(providerTask, originalWorkflows);
    if (!isEqualProviderTask(providerTask, originalPT)) {
      return true;
    }
    return false;
  });
});

const validateWorkflowProviderTasks = (request, originalRequest, workflowTaskStatusValidator) => {
  const originalWorkflows = _.get(originalRequest, 'workflows', []);
  const requestWorkflows = _.get(request, 'workflows', []);
  return requestWorkflows.some((workflow, workflowIndex) => {
    if (_.isEmpty(workflow.tasks)) {
      return false;
    }
    if (_hasWorkflowDifferentProviderTask(workflow, originalWorkflows)
        && workflowTaskStatusValidator(workflow.tasks, workflowIndex)) {
      return true;
    }
    return false;
  });
};
const hasNextTaskStartedChange = (request, originalRequest) => validateWorkflowProviderTasks(request, originalRequest, hasNextTaskStarted);
const hasPreviousIncompleteTask = (tasks, index) => {
  for (let i = index - 1; i >= 0; i--) {
    const previousTask = tasks[i];

    if (previousTask && previousTask.providerTasks) {
      if (!previousTask.providerTasks.every((pt) => pt.status === 'completed' || pt.status !== 'cancelled')) {
        return true;
      }
    }
  }
  return false;
};
const hasPreviousIncompleteTaskChange = (request, originalRequest) => validateWorkflowProviderTasks(request, originalRequest, hasPreviousIncompleteTask);
const _hasTaskPreviousCompletedTaskStatusChange = (tasks, originalWorkflows, workflowIndex) => tasks.some((task) => {
  if (_.isEmpty(task.providerTasks)) {
    return false;
  }
  return task.providerTasks.some((providerTask) => {
    const originalPT = _findPTaskInWorkflows(providerTask, originalWorkflows);
    if (originalPT && originalPT.status === 'completed') {
      return isProviderTaskChangeAllowed(originalPT, providerTask, tasks, workflowIndex);
    }
    return false;
  });
});

/**
 * @param {object} request the updated request.
 * @param {array} request.workflows the array of workflows.
 * @param {object} originalRequest the original request.
 * @param {array} originalRequest.workflows the array of workflows.
 */
const hasPreviousCompletedTaskStatusChange = (request, originalRequest) => {
  const originalWorkflows = _.get(originalRequest, 'workflows', []);
  const requestWorkflows = _.get(request, 'workflows', []);
  return requestWorkflows.some((workflow, workflowIndex) => _hasTaskPreviousCompletedTaskStatusChange(workflow.tasks, originalWorkflows, workflowIndex));
};

const _hasTaskMissedCompletedProviderTask = (workflow, requestWorkflows) => {
  if (_.isEmpty(workflow.tasks)) {
    return false;
  }
  return workflow.tasks.some((task) => {
    if (_.isEmpty(task.providerTasks)) {
      return false;
    }
    return task.providerTasks.some((providerTask) => {
      if (providerTask.status === 'completed') {
        const originalPT = _findPTaskInWorkflows(providerTask, requestWorkflows);
        if (!originalPT) {
          return true;
        }
      }
      return false;
    });
  });
};
/**
 * @param {object} request the updated request.
 * @param {array} request.workflows the array of workflows.
 * @param {object} originalRequest the original request.
 * @param {array} originalRequest.workflows the array of workflows.
 */
const isCompletedTaskMissing = (request, originalRequest) => {
  const originalWorkflows = _.get(originalRequest, 'workflows', []);
  const requestWorkflows = _.get(request, 'workflows', []);
  return originalWorkflows.some((workflow) => _hasTaskMissedCompletedProviderTask(workflow, requestWorkflows));
};

const findWorkflowTasks = (request, { workflowId, taskId, providerTaskId }) => {
  const workflow = request.workflows.find((w) => areObjectIdsEqual(w._id, workflowId));

  if (_.isNil(workflow)) {
    throw new Error(`Workflow with _id ${workflowId} was not found`);
  }
  const task = workflow.tasks.find((t) => areObjectIdsEqual(t._id, taskId));

  if (_.isNil(task)) {
    throw new Error(`Task with _id ${taskId} was not found`);
  }
  const providerTask = task.providerTasks.find((pt) => areObjectIdsEqual(pt._id, providerTaskId));

  if (_.isNil(providerTask)) {
    throw new Error(`Provider task with _id ${providerTaskId} was not found`);
  }
  return {
    workflow,
    task,
    providerTask,
  };
};

const forEachProviderTask = (request, callback) => {
  const workflows = _.get(request, 'workflows', []);

  _.forEach(workflows, (w, wi) => {
    const tasks = _.get(w, 'tasks', []);

    _.forEach(tasks, (t, ti) => {
      const providerTasks = _.get(t, 'providerTasks', []);

      _.forEach(providerTasks, (pt, pti) => {
        callback({
          request,
          workflow: w,
          workflowIndex: wi,
          task: t,
          taskIndex: ti,
          providerTask: pt,
          providerTaskIndex: pti,
        });
      });
    });
  });
};
const isUserPartOfTask = (task, userId) => _.get(task, 'providerTasks', []).some(
  (providerTask) => areObjectIdsEqual(_.get(providerTask, 'provider._id'), userId),
);
const isUserPartOfWorkflow = (workflow, userId) => workflow.tasks.some(
  (task) => isUserPartOfTask(task, userId),
);
const forEachTask = (request, callback) => {
  const workflows = _.get(request, 'workflows', []);

  _.forEach(workflows, (w, wi) => {
    const tasks = _.get(w, 'tasks', []);

    _.forEach(tasks, (t, ti) => {
      callback({
        request,
        workflow: w,
        workflowIndex: wi,
        task: t,
        taskIndex: ti,
      });
    });
  });
};

const resetMissingLanguageInWorkflow = (newWorkflow, request) => {
  const doesMatchingExist = request.languageCombinations.some((l) => {
    const matchedSrcLang = l.srcLangs.find((lang) => lang.isoCode === newWorkflow.srcLang.isoCode);
    const matchedTgtLang = l.tgtLangs.find((lang) => lang.isoCode === newWorkflow.tgtLang.isoCode);
    if (!_.isNil(matchedSrcLang) && !_.isNil(matchedTgtLang)) {
      newWorkflow.srcLang = { ...matchedSrcLang };
      newWorkflow.tgtLang = { ...matchedTgtLang };
      return true;
    }
    return false;
  });
  if (!doesMatchingExist) {
    newWorkflow.srcLang = {
      isoCode: '',
      name: '',
    };
    newWorkflow.tgtLang = {
      isoCode: '',
      name: '',
    };
  }
};

const copyWorkflow = async (workflow) => {
  const workflowToCopy = _.cloneDeep(_.omit(workflow, ['_id']));
  await Promise.map(workflowToCopy.tasks, async (task) => {
    delete task._id;
    task.status = PENDING_TASK_STATUS;
    if (_.has(task, 'invoiceDetails')) {
      await Promise.map(task.invoiceDetails, (invoiceDetail) => {
        delete invoiceDetail.invoice._id;
        invoiceDetail.invoice.isInvoiced = false;
      });
    }
    if (!_.isEmpty(task.providerTasks)) {
      await Promise.map(task.providerTasks, async (providerTask) => {
        await Promise.map(['_id', 'approvedAt', 'approvedBy', 'billCreationError', 'offer'], (key) => _.unset(providerTask, key));
        Object.assign(providerTask, {
          provider: null,
          minCharge: 0,
          total: '',
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [{
            units: '',
            amount: 0,
          }],
        });
        await Promise.map(providerTask.billDetails, (bill) => {
          delete bill._id;
          bill.unitPrice = 0;
        });
      });
    }
  });
  return workflowToCopy;
};

const _areAllProviderTasksApprovedOrCancelled = (task) => {
  const statuses = [PROVIDER_TASK_APPROVED_STATUS, PROVIDER_TASK_CANCELLED_STATUS];
  return _.every(
    task.providerTasks,
    (providerTask) => statuses.some((status) => status === providerTask.status),
  );
};
const _areAllProviderTasksCancelled = (task) => task.providerTasks.every(
  (providerTask) => providerTask.status === PROVIDER_TASK_CANCELLED_STATUS,
);

const _areAllProviderTasksApproved = (task) => task.providerTasks.every(
  (providerTask) => providerTask.status === PROVIDER_TASK_APPROVED_STATUS,
);
const _hasApprovedProviderTask = (task) => task.providerTasks.some((providerTask) => providerTask.status === PROVIDER_TASK_APPROVED_STATUS);
const _updateTaskStatus = (dbRequest) => {
  forEachTask(dbRequest, ({ task }) => {
    const isTaskInvoiced = [WORKFLOW_TASK_STATUSES.invoiced,
      WORKFLOW_TASK_STATUSES.partiallyInvoiced].includes(task.status);
    if (isTaskInvoiced) {
      return;
    }
    if (
      _areAllProviderTasksApproved(task)
      || (_hasApprovedProviderTask(task) && _areAllProviderTasksApprovedOrCancelled(task))
    ) {
      task.status = WORKFLOW_TASK_STATUSES.approved;
    } else if (_areAllProviderTasksCancelled(task)) {
      task.status = WORKFLOW_TASK_STATUSES.cancelled;
    } else {
      task.status = WORKFLOW_TASK_STATUSES.pending;
    }
  });
};

const _cancelProviderTask = (request) => {
  forEachProviderTask(request, ({ providerTask }) => {
    const isProviderTaskFinished = [
      PROVIDER_TASK_APPROVED_STATUS,
      PROVIDER_TASK_CANCELLED_STATUS,
      PROVIDER_TASK_COMPLETED_STATUS,
    ].includes(providerTask.status);
    if (!isProviderTaskFinished) {
      providerTask.status = PROVIDER_TASK_CANCELLED_STATUS;
      providerTask.billDetails.forEach((bill) => {
        bill.unitPrice = 0;
        bill.quantity = 1;
        bill.total = 0;
      });
      providerTask.minCharge = 0;
      providerTask.total = 0;
    }
  });
};

const cancelWorkflowProviderTaskStatus = (request) => {
  _cancelProviderTask(request);
  _updateTaskStatus(request);
};

const findWorkflowsByLangs = (request, srcLang, tgtLang) => {
  const srcIsoCode = _.get(srcLang, 'isoCode', srcLang);
  const tgtIsoCode = _.get(tgtLang, 'isoCode', tgtLang);
  const workflows = _.get(request, 'workflows', []);
  return workflows.filter(
    (workflow) => _.get(workflow, 'srcLang.isoCode', '') === srcIsoCode
      && _.get(workflow, 'tgtLang.isoCode', '') === tgtIsoCode,
  );
};
const isLinguisticTask = (ability) => _.keys(LINGUISTIC_TASKS).includes(ability);

module.exports = {
  findAllOriginalTasks,
  findWorkflowTasks,
  findOriginalProviderTask,
  findPreviousProviderTask,
  findPreviousTask,
  forEachProviderTask,
  forEachTask,
  isCompletedTaskMissing,
  isPreviousStatusCompleted,
  hasDifferentProvider,
  hasNextTaskStartedChange,
  hasPreviousIncompleteTaskChange,
  hasPreviousCompletedTaskStatusChange,
  resetMissingLanguageInWorkflow,
  copyWorkflow,
  cancelWorkflowProviderTaskStatus,
  WORKFLOW_TASK_STATUSES,
  findWorkflowsByLangs,
  isLinguisticTask,
  isUserPartOfWorkflow,
  isUserPartOfTask,
};
