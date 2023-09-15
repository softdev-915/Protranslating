const _ = require('lodash');
const { findAllOriginalTasks,
  findPreviousTask,
  findOriginalProviderTask,
  isPreviousStatusCompleted,
  hasDifferentProvider,
} = require('./workflow-helpers');

const IN_PROGRESS = 'In progress';
const DELIVERED = 'Delivered';
class WorkflowEmailTriggerFactory {
  constructor(originalRequest) {
    this.originalRequest = originalRequest;
  }

  _findTriggers(providerTask, allTasks, originalProviderTask, statusChanged) {
    let firstEmail = statusChanged;
    const originalAllTasks = findAllOriginalTasks(providerTask, this.originalRequest.workflows);
    const previousTask = findPreviousTask(providerTask, allTasks);
    const previousCompleted = isPreviousStatusCompleted(providerTask, allTasks);
    const originalPreviousCompleted = isPreviousStatusCompleted(originalProviderTask,
      originalAllTasks);
    if ((providerTask && providerTask.status === 'notStarted') &&
      (!previousTask || previousCompleted)) {
      const prevProviderTaskChangeCompleted = originalPreviousCompleted !== previousCompleted;
      const triggerReason = {
        firstEmail: firstEmail,
        differentProvider: hasDifferentProvider(originalProviderTask, providerTask),
        statusChange: prevProviderTaskChangeCompleted,
        notStarted: true,
        shouldSend() {
          // The email should be sent if the request status has changed to in progress
          // and this is the first provider task with status not started (firstEmail).
          // OR The email should be sent if the providerTask's
          // provider is changed (differentProvider)
          // OR The email should be sent if all provider tasks' status
          // of the previous task are 'completed'
          return this.firstEmail || this.differentProvider || this.statusChange;
        },
      };
      if (firstEmail) {
        firstEmail = false;
      }
      return triggerReason;
    }
    return {
      notStarted: providerTask && providerTask.status === 'notStarted',
      shouldSend() { return false; },
    };
  }

  findTriggersInWorkflow(workflow, sendFirstEmail, emailTriggers = []) {
    if (_.isNil(workflow.tasks)) {
      const originalWorkflow = this.originalRequest.workflows.find(w => w._id.toString() ===
        workflow._id);
      if (!_.isNil(originalWorkflow)) {
        workflow.tasks = originalWorkflow.tasks;
      }
    }
    if (workflow.tasks) {
      workflow.tasks.forEach((task) => {
        // if the first trigger is a status change, then send emails to all provider tasks
        let statusTriggerChange = false;
        if (task.providerTasks) {
          task.providerTasks.forEach((providerTask, index) => {
            const originalProviderTask =
              findOriginalProviderTask(providerTask, this.originalRequest.workflows);
            const trigger = this._findTriggers(providerTask, workflow.tasks,
              originalProviderTask, sendFirstEmail);
            if ((statusTriggerChange && trigger.notStarted) || trigger.shouldSend()) {
              if ((trigger.statusChange || trigger.firstEmail) && index === 0) {
                statusTriggerChange = true;
              }
              emailTriggers.push({
                originalProviderTask,
                modifiedProviderTask: providerTask,
                workflow: workflow,
                task,
              });
            }
          });
        }
      });
    }
  }

  findEmailsToSend(request) {
    // only send workflow emails if request status is 'In Progress'
    if (request.status !== IN_PROGRESS && request.status !== DELIVERED) {
      return [];
    }
    // when the status changes we need to force to send the first email available,
    // because the provider might not have change nor the previous status
    // but the request status might have changed from "To be processed" to "In progress"
    const sendFirstEmail = request.status !== this.originalRequest.status;
    if (request.workflows) {
      const emailTriggers = [];
      request.workflows.forEach((workflow) => {
        this.findTriggersInWorkflow(workflow, sendFirstEmail, emailTriggers);
      });
      return emailTriggers;
    }
    return [];
  }
  findWorkflowEmailsToSend(workflow) {
    if (this.originalRequest.status !== IN_PROGRESS && this.originalRequest.status !== DELIVERED) {
      return [];
    }
    const emailTriggers = [];
    this.findTriggersInWorkflow(workflow, false, emailTriggers);
    return emailTriggers;
  }
}

module.exports = WorkflowEmailTriggerFactory;
