import _ from 'lodash';
import WorkflowProviderTaskDetailReadOnly from './workflow-provider-task-detail-read-only.vue';
import TaskInvoiceReadOnly from './task-invoice-read-only.vue';
import TaskProjectedCostReadOnly from './task-projected-cost-read-only.vue';
import UserRoleCheckMixin from '../../../mixins/user-role-check.js';
import WorkflowTaskDetailMixin from './workflow-task-detail-mixin';

export default {
  mixins: [UserRoleCheckMixin, WorkflowTaskDetailMixin],
  components: {
    WorkflowProviderTaskDetailReadOnly,
    TaskInvoiceReadOnly,
    TaskProjectedCostReadOnly,
  },
  props: {
    request: {
      type: Object,
      required: true,
    },
    workflow: {
      type: Object,
      required: true,
    },
    task: {
      type: Object,
      required: true,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    loadComponents: {
      type: Boolean,
      default: false,
    },
    isForeignCurrencyRequest: {
      type: Boolean,
    },
    toggledSections: {
      type: Object,
    },
    taskIndex: {
      type: Number,
    },
    requestId: {
      type: String,
    },
    workflowId: {
      type: String,
    },
    isPortalCat: {
      type: Boolean,
      default: false,
    },
    canReadRegulatoryFieldsOfWorkflow: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    this.canReadFinancialSections = this.hasRole('TASK-FINANCIAL_READ_ALL');
    this.canReadTaskStatus = this.hasRole('WORKFLOW_READ_ALL');
    this.canReadTaskDescription = this.hasRole('WORKFLOW_READ_ALL');
    this.canReadRegulatoryFieldsOfTask = this.canReadRegulatoryFieldsOfWorkflow ||
      (this.hasRole('TASK-REGULATORY-FIELDS_READ_OWN') && this.isOwnTask(this.task));
    this.fetchTaskProgress();
  },
  methods: {
    isOwnTask(task) {
      const providerTasks = _.get(task, 'providerTasks', []);
      const userId = _.get(this, 'userLogged._id');
      return providerTasks.some(providerTask =>
        _.get(providerTask, 'provider._id', providerTask.provider) === userId);
    },
  },
};
