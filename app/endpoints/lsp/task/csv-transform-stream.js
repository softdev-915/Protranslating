const { Transform } = require('stream');
const _ = require('lodash');
const moment = require('moment');
const { transformExportData } = require('../../../utils/csvExporter/csv-exporter-helper');

const TASK_STATUS_VALUES = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  onHold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  approved: 'Approved',
};

const BILL_HUMAN_READABLE_STATUSES = {
  posted: 'Posted',
  paid: 'Paid',
  partiallyPaid: 'Partially Paid',
};

class TaskCSVTransform extends Transform {
  constructor(humanReadableStatuses, offset) {
    super({ readableObjectMode: true, writableObjectMode: true });
    this._humanReadableStatuses = humanReadableStatuses;
    this.offset = offset;
  }

  get humanReadableStatuses() {
    return this._humanReadableStatuses;
  }

  _transform(task, encoding, cb) {
    this.push(this._transformTask(task, this.offset));
    cb();
  }

  _final(cb) {
    this.push(null);
    if (cb) {
      cb();
    }
  }

  _transformTask(tr, offset) {
    const taskRequest = _.pick(tr, ['_id', 'no', 'title', 'status', 'sourceDocumentsList', 'schedulingStatus', 'expectedStartDate', 'projectManagers', 'projectOverdue', 'referenceNumber', 'catTool', 'internalComments', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'deletedBy', 'deletedAt', 'restoredBy', 'restoredAt', 'cancelledAt', 'completedAt', 'providerTaskStatus', 'taskAmount', 'providerTaskBilled', 'recipient']);
    taskRequest.requestStatus = _.get(tr, 'status', '');
    taskRequest.location = _.get(tr, 'location.name', '');
    taskRequest.schedulingStatus = _.get(taskRequest, 'schedulingStatus.name');
    taskRequest.companyName = _.get(tr, 'company.name');
    taskRequest.schedulingCompanyName = _.get(tr, 'schedulingCompany.name');
    if (tr.contact) {
      taskRequest.contact = `${_.get(tr, 'contact.firstName')} ${_.get(tr, 'contact.lastName')}`;
    } else {
      taskRequest.contact = '';
    }
    if (tr.schedulingCompany) {
      taskRequest.schedulingCompany = _.get(tr, 'schedulingCompany.name');
    } else {
      taskRequest.schedulingCompany = '';
    }
    if (tr.schedulingContact) {
      taskRequest.schedulingContact = `${_.get(tr, 'schedulingContact.firstName')} ${_.get(tr, 'schedulingContact.lastName')}`;
    } else {
      taskRequest.schedulingContact = '';
    }
    taskRequest.languageCombination = `${_.get(tr, 'workflows.srcLang.name')} - ${_.get(tr, 'workflows.tgtLang.name')}`;
    taskRequest.taskId = _.get(tr, 'workflows.tasks._id');
    taskRequest.task = _.get(tr, 'workflows.tasks.ability');
    const provTask = _.get(tr, 'workflows.tasks.providerTasks');
    taskRequest.status = _.get(this.humanReadableStatuses, provTask.status);
    taskRequest.providerTaskStatus = _.get(TASK_STATUS_VALUES, taskRequest.providerTaskStatus);
    taskRequest.taskDueDate = _.get(provTask, 'taskDueDate');
    if (taskRequest.taskDueDate) {
      taskRequest.taskDueDate = moment.utc(taskRequest.taskDueDate).utcOffset(offset).format('MM-DD-YYYY HH:mm');
    }
    if (taskRequest.expectedStartDate) {
      taskRequest.expectedStartDate = moment.utc(taskRequest.expectedStartDate).utcOffset(offset).format('MM-DD-YYYY HH:mm');
    }
    if (taskRequest.cancelledAt) {
      taskRequest.cancelledAt = moment.utc(taskRequest.cancelledAt).utcOffset(offset).format('MM-DD-YYYY HH:mm');
    }
    if (taskRequest.completedAt) {
      taskRequest.completedAt = moment.utc(taskRequest.completedAt).utcOffset(offset).format('MM-DD-YYYY HH:mm');
    }
    taskRequest.providerTaskId = _.get(provTask, '_id');
    if (_.get(provTask, 'provider._id')) {
      taskRequest.provider = provTask.provider.name;
    } else {
      taskRequest.provider = '';
    }
    if (_.get(provTask, 'approvedAt')) {
      taskRequest.approvedAt = moment.utc(provTask.approvedAt).utcOffset(offset).format('MM-DD-YYYY HH:mm');
    }
    if (_.get(provTask, 'approvedBy')) {
      taskRequest.approvedBy = provTask.approvedBy;
    }
    if (_.get(provTask, 'billCreationError')) {
      taskRequest.billCreationError = provTask.billCreationError;
    }
    if (_.get(provTask, 'billDate')) {
      taskRequest.billDate = moment.utc(provTask.billDate).utcOffset(offset).format('MM-DD-YYYY HH:mm');
    }
    if (_.get(provTask, 'billId')) {
      taskRequest.billId = provTask.billId;
    }
    if (_.get(provTask, 'billNo')) {
      taskRequest.billNo = provTask.billNo;
    }
    if (_.has(provTask, 'billStatus')) {
      taskRequest.billStatus = _.get(BILL_HUMAN_READABLE_STATUSES, provTask.billStatus);
    }
    if (_.has(provTask, 'billed')) {
      taskRequest.providerTaskBilled = provTask.billed;
    }
    return transformExportData(taskRequest);
  }
}

module.exports = TaskCSVTransform;
