const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const CURRENT_TASKS_STATUSES = ['onHold', 'inProgress'];
const FUTURE_AND_PENDING_TASKS_STATUSES = ['notStarted'];
const CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS = ['completed', 'cancelled'];
const EXTENDED_CURRENT_AND_PENDING_TASKS_PREVIOUS_STATUS = ['completed', 'cancelled', 'inProgress'];
const FUTURE_TASKS_PREVIOUS_STATUS = ['inProgress', 'onHold', 'notStarted'];
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

const setProviderTasksPriorityStatus = (request) => {
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
            let bucketFound = false;
            bucketFound = _isCurrentTask(previousTask, providerTask);
            if (bucketFound) {
              providerTask.priorityStatus = 'current';
            }
            if (!bucketFound) {
              const isPending = _isPendingTask(previousTask, isPreviousTaskCompleted,
                providerTask);
              if (isPending) {
                providerTask.priorityStatus = 'pending';
              }
              bucketFound = bucketFound || isPending;
            }
            if (!bucketFound) {
              const isFuture = _isFutureTask(previousTask, providerTask);
              if (isFuture) {
                providerTask.priorityStatus = 'future';
              }
              bucketFound = bucketFound || isFuture;
            }
            if (providerTask.status === 'completed') {
              providerTask.priorityStatus = 'completed';
            }
          });
        }
      });
    }
  });
  return request;
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    return requests.find({
      status: { $ne: 'Cancelled' },
      'workflows.tasks': { $exists: true },
    }).toArray().then((requestList) => {
      const promises = [];
      requestList.forEach((request) => {
        const taggedRequest = setProviderTasksPriorityStatus(request);
        promises.push(() => requests.update({ _id: request._id },
          { $set: { workflows: taggedRequest.workflows } }));
      });
      return Promise.mapSeries(promises, promise => promise());
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
