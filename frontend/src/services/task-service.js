import Vue from 'vue';
import _ from 'lodash';
import moment from 'moment';
import taskResource from '../resources/task';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';
import { hasRole } from '../utils/user';

const DEFAULT_COLUMNS = ['Request No.', 'Language', 'Ability'];
const ALL_BUCKET_COLUMNS = [...DEFAULT_COLUMNS, 'Task Due'];
const PROVIDER_OFFERS_COLUMNS = [...DEFAULT_COLUMNS, 'Task Due', 'Provider Task Instructions'];
const COMPLETED_BUCKET_COLUMNS = [...DEFAULT_COLUMNS, 'Status'];
const HUMAN_READABLE_STATUS = {
  notStarted: 'Not Started',
  onHold: 'On Hold',
  inProgress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  approved: 'Approved',
};

const BILL_HUMAN_READABLE_STATUSES = {
  posted: 'Posted',
  paid: 'Paid',
  partiallyPaid: 'Partially Paid',
};

const WORKFLOW_TASK_STATUSES = {
  pending: 'Pending',
  approved: 'Approved',
  cancelled: 'Cancelled',
  invoiced: 'Invoiced',
  partiallyInvoiced: 'Partially Invoiced',
};

const TASK_READ_OWN_COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: 'workflows.tasks._id', val: (i) => _.get(i, 'taskId', ''), visible: false,
  },
  {
    name: 'Provider Task ID',
    type: 'string',
    prop: 'providerTaskId',
    visible: false,
  },
  {
    name: 'Request No.', type: 'string', prop: 'no', visible: true,
  },
  {
    name: 'Request Title', type: 'string', prop: 'title', visible: true,
  },
  {
    name: 'Reference No.', type: 'string', prop: 'referenceNumber', visible: true,
  },
  {
    name: 'Provider', type: 'string', prop: 'provider', visible: true, disabled: true,
  },
  {
    name: 'Task', type: 'string', prop: 'task', visible: true,
  },
  {
    name: 'Task Status', prop: 'status', type: 'string', visible: false,
  },
  {
    name: 'Project Managers', prop: 'projectManagers', type: 'string', visible: false,
  },
  {
    name: 'Task Due', type: 'dateRange', prop: 'taskDueDate', visible: true,
  },
  {
    name: 'Request Status', type: 'string', prop: 'requestStatus', visible: false,
  },
  {
    name: 'Provider Task Status', type: 'string', prop: 'providerTaskStatus', visible: true,
  },
  {
    name: 'Provider Task Instructions', type: 'string', prop: 'providerTaskInstructions', visible: true,
  },
  {
    name: 'Provider Task Billed Status', type: 'string', prop: 'providerTaskBilled', visible: true,
  },
  {
    name: 'Location Of The Request', type: 'string', prop: 'location', val: (item) => _.get(item, 'location.name', ''), visible: false,
  },
  {
    name: 'Translation Tools', type: 'string', prop: 'catTool', visible: false,
  },
  {
    name: 'Internal Comments', type: 'string', prop: 'internalComments', visible: false, sortable: false, hideHeaderFilter: true,
  },
  {
    name: 'Bill Id', type: 'string', prop: 'billId', visible: false,
  },
  {
    name: 'Bill No.', type: 'string', prop: 'billNo', visible: false,
  },
  {
    name: 'Bill Date', type: 'dateRange', prop: 'billDate', visible: false,
  },
  {
    name: 'Bill Status', type: 'string', prop: 'billStatus', visible: false,
  },
  {
    name: 'Language Combination',
    type: 'string',
    prop: 'languageCombination',
    visible: true,
  },
  {
    name: 'Source Documents',
    type: 'string',
    prop: 'sourceDocumentsList',
    visible: false,
  },
  {
    name: 'Bill Creation Error', type: 'string', prop: 'billCreationError', visible: false,
  },
  {
    name: 'Approved at', prop: 'approvedAt', type: 'dateRange', visible: false,
  },
  {
    name: 'Approved by', prop: 'approvedBy', type: 'string', visible: false,
  },
  {
    name: 'Task Amount', prop: 'taskAmount', type: 'currency', visible: false,
  },
  {
    name: 'Recipient', prop: 'recipient', type: 'string', visible: false,
  },
]);
const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: 'workflows.tasks._id', val: (i) => _.get(i, 'taskId', ''), visible: false,
  },
  {
    name: 'Provider Task ID',
    type: 'string',
    prop: 'providerTaskId',
    visible: false,
  },
  {
    name: 'Request No.', type: 'string', prop: 'no', visible: true,
  },
  {
    name: 'Reference No.', type: 'string', prop: 'referenceNumber', visible: true,
  },
  {
    name: 'Request Status', type: 'string', prop: 'requestStatus', visible: false,
  },
  {
    name: 'Location Of The Request', type: 'string', prop: 'location', val: (item) => _.get(item, 'location.name', ''), visible: false,
  },
  {
    name: 'Translation Tools', type: 'string', prop: 'catTool', visible: false,
  },
  {
    name: 'Internal Comments', type: 'string', prop: 'internalComments', visible: false, sortable: false, hideHeaderFilter: true,
  },
  {
    name: 'Company', type: 'string', prop: 'companyName', visible: true,
  },
  {
    name: 'Bill Id', type: 'string', prop: 'billId', visible: false,
  },
  {
    name: 'Bill No.', type: 'string', prop: 'billNo', visible: false,
  },
  {
    name: 'Bill Status', type: 'string', prop: 'billStatus', visible: false,
  },
  {
    name: 'Bill Date', type: 'dateRange', prop: 'billDate', visible: false,
  },
  {
    name: 'Language Combination',
    type: 'string',
    prop: 'languageCombination',
    visible: true,
  },
  {
    name: 'Source Documents',
    type: 'string',
    prop: 'sourceDocumentsList',
    visible: true,
  },
  {
    name: 'Request Title', type: 'string', prop: 'title', visible: true,
  },
  {
    name: 'Scheduling Contact',
    type: 'string',
    prop: 'schedulingContact',
    visible: true,
  },
  {
    name: 'Scheduling Company',
    type: 'string',
    prop: 'schedulingCompanyName',
    visible: true,
  },
  {
    name: 'Task', type: 'string', prop: 'task', visible: true,
  },
  {
    name: 'Task Status',
    prop: 'status',
    type: 'string',
    visible: false,
  },
  {
    name: 'Provider', type: 'string', prop: 'provider', visible: true,
  },
  {
    name: 'Task Due', type: 'dateRange', prop: 'taskDueDate', visible: true,
  },
  {
    name: 'Provider Task Status', prop: 'providerTaskStatus', type: 'string', visible: true,
  },
  {
    name: 'Provider Task Instructions', type: 'string', prop: 'providerTaskInstructions', visible: true,
  },
  {
    name: 'Provider Task Billed Status', type: 'string', prop: 'providerTaskBilled', visible: true,
  },
  {
    name: 'Bill Status', prop: 'billStatus', type: 'string', visible: true,
  },
  {
    name: 'Scheduling Status',
    type: 'string',
    prop: 'schedulingStatus',
    visible: true,
  },
  {
    name: 'Cancelled at',
    prop: 'cancelledAt',
    type: 'dateRange',
    visible: false,
  }, {
    name: 'Contact',
    prop: 'contact',
    type: 'string',
    visible: false,
  }, {
    name: 'Approved at',
    prop: 'approvedAt',
    type: 'dateRange',
    visible: false,
  }, {
    name: 'Approved by',
    prop: 'approvedBy',
    type: 'string',
    visible: false,
  }, {
    name: 'Project Overdue',
    prop: 'projectOverdue',
    type: 'string',
    visible: false,
  }, {
    name: 'Project Managers',
    prop: 'projectManagers',
    type: 'string',
    visible: false,
  }, {
    name: 'Bill Creation Error',
    type: 'string',
    prop: 'billCreationError',
    visible: false,
  }, {
    name: 'Request Expected Start',
    prop: 'expectedStartDate',
    type: 'dateRange',
    visible: false,
  }, {
    name: 'Completed At',
    prop: 'completedAt',
    type: 'dateRange',
    visible: false,
  }, {
    name: 'Task Amount',
    prop: 'taskAmount',
    type: 'currency',
    visible: false,
  },
  {
    name: 'Recipient', prop: 'recipient', type: 'string', visible: false,
  },
]);

const flattenTaskForGrid = (tasksRequestFound) => {
  const flattenedTasks = [];
  tasksRequestFound.forEach((tr) => {
    const taskKeys = [
      '_id',
      'no',
      'title',
      'status',
      'location',
      'catTool',
      'internalComments',
      'schedulingStatus',
      'expectedStartDate',
      'projectManagers',
      'projectOverdue',
      'referenceNumber',
      'createdBy',
      'createdAt',
      'cancelledAt',
      'completedAt',
      'taskAmount',
      'recipient',
    ];
    const taskRequest = _.pick(tr, taskKeys);
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
    taskRequest.languageCombination = `${_.get(tr, 'languageCombination')}`;
    taskRequest.sourceDocumentsList = `${_.get(tr, 'sourceDocumentsList')}`;
    taskRequest.providerTaskStatus = _.get(HUMAN_READABLE_STATUS, tr.providerTaskStatus);
    taskRequest.billStatus = tr.billStatus;
    taskRequest.providerTaskInstructions = tr.providerTaskInstructions;
    taskRequest.providerTaskBilled = tr.providerTaskBilled;
    taskRequest.providerTaskId = tr.providerTaskId;
    taskRequest.taskId = _.get(tr, 'workflows.tasks._id');
    taskRequest.task = _.get(tr, 'workflows.tasks.ability');
    const provTask = _.get(tr, 'workflows.tasks.providerTasks');
    taskRequest.status = _.get(HUMAN_READABLE_STATUS, provTask.status);
    taskRequest.requestStatus = tr.status;
    taskRequest.taskDueDate = _.get(provTask, 'taskDueDate');
    taskRequest.cancelledAt = _.get(provTask, 'cancelledAt');
    if (taskRequest.taskDueDate) {
      taskRequest.taskDueDate = moment.utc(taskRequest.taskDueDate).local().format('MM-DD-YYYY HH:mm');
    }
    if (taskRequest.expectedStartDate) {
      taskRequest.expectedStartDate = moment.utc(taskRequest.expectedStartDate).local().format('MM-DD-YYYY HH:mm');
    }
    if (taskRequest.cancelledAt) {
      taskRequest.cancelledAt = moment.utc(taskRequest.cancelledAt).local().format('MM-DD-YYYY HH:mm');
    }
    if (taskRequest.completedAt) {
      taskRequest.completedAt = moment.utc(taskRequest.completedAt).local().format('MM-DD-YYYY HH:mm');
    }
    if (!_.isEmpty(_.get(provTask, 'approvedAt', ''))) {
      taskRequest.approvedAt = moment.utc(provTask.approvedAt).local().format('MM-DD-YYYY HH:mm');
    }
    if (!_.isEmpty(_.get(provTask, 'approvedBy', ''))) {
      taskRequest.approvedBy = provTask.approvedBy;
    }
    if (!_.isEmpty(_.get(provTask, 'billId', ''))) {
      taskRequest.billId = provTask.billId;
    }
    if (!_.isEmpty(_.get(provTask, 'billNo', ''))) {
      taskRequest.billNo = provTask.billNo;
      taskRequest.billStatus = _.get(BILL_HUMAN_READABLE_STATUSES, provTask.billStatus);
    }
    if (!_.isEmpty(_.get(provTask, 'billDate', ''))) {
      taskRequest.billDate = moment.utc(provTask.billDate).local().format('MM-DD-YYYY');
    }
    if (provTask.provider) {
      taskRequest.provider = provTask.provider.name;
    } else {
      taskRequest.provider = '';
    }
    if (!_.isEmpty(_.get(provTask, 'billCreationError', ''))) {
      taskRequest.billCreationError = provTask.billCreationError;
    }
    flattenedTasks.push(taskRequest);
  });
  return { data: { list: flattenedTasks, total: flattenedTasks.length } };
};

export default class TaskService {
  constructor(userLogged, options, resource = taskResource) {
    this.resource = resource(options);
    this.endpointBuilder = lspAwareUrl;
    this.userLogged = userLogged;
  }

  static get humanReadableStatuses() {
    return HUMAN_READABLE_STATUS;
  }

  static get workflowTaskStatuses() {
    return WORKFLOW_TASK_STATUSES;
  }

  get columns() {
    if (hasRole(this.userLogged, 'TASK_READ_OWN') && !hasRole(this.userLogged, 'TASK_READ_ALL')) {
      return TASK_READ_OWN_COLUMNS;
    }
    return COLUMNS;
  }

  getColumns(priorityStatus) {
    // TODO: Special case
    if (priorityStatus === 'completed') {
      return COMPLETED_BUCKET_COLUMNS;
    }
    if (priorityStatus === 'offers') {
      return PROVIDER_OFFERS_COLUMNS;
    }
    return ALL_BUCKET_COLUMNS;
  }

  retrieveCsv() {
    return lspAwareUrl('task/export');
  }

  retrieve(params) {
    const strippedParams = _.pick(params, ['filter', 'limit', 'page', 'sort']);
    return resourceWrapper(this.resource.get(strippedParams)).then((response) => {
      const requestsWithTasks = _.get(response, 'data.list', []);
      return flattenTaskForGrid(requestsWithTasks);
    });
  }

  retrieveUserTasks(providerId, priorityStatus) {
    const params = {
      provider: 'provider',
      providerId,
    };
    if (priorityStatus) {
      params.priorityStatus = priorityStatus;
    }
    return resourceWrapper(this.resource.get(params), false);
  }

  getDocumentUrl(requestId, companyId, taskId, documentId) {
    const documentEndpoint = `company/${companyId}/request/${encodeURIComponent(requestId)}/task/${encodeURIComponent(taskId)}/`;
    return this.endpointBuilder(`${documentEndpoint}/document/${documentId}`);
  }

  getDocumentDownloadUrl(documentUrl) {
    return resourceWrapper(Vue.http.get(documentUrl));
  }

  deleteDocument(documentId, requestId, taskId, providerTaskId) {
    if (!_.isEmpty(documentId) && !_.isEmpty(requestId) && !_.isEmpty(taskId)) {
      const endpointUrl = lspAwareUrl(`request/${requestId}/task/${taskId}/providerTask/${providerTaskId}/document/${documentId}`);
      return resourceWrapper(Vue.http.delete(endpointUrl));
    }
  }
}

