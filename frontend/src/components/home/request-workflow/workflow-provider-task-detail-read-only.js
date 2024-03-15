import _ from 'lodash';
import { mapGetters } from 'vuex';
import moment from 'moment-timezone';
import ProviderTaskBillReadOnly from './provider-task-bill-read-only.vue';
import UserRoleCheckMixin from '../../../mixins/user-role-check';
import TaskService from '../../../services/task-service.js';
import WorkflowProviderTaskDetailMixin from './workflow-provider-task-detail-mixin';

const HUMAN_READABLE_STATUSES = TaskService.humanReadableStatuses;

export default {
  mixins: [UserRoleCheckMixin, WorkflowProviderTaskDetailMixin],
  components: {
    ProviderTaskBillReadOnly,
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
    workflow: {
      type: Object,
      required: true,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    toggledSections: {
      type: Object,
    },
    providerTask: {
      type: Object,
      required: true,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    toggledSections: {
      type: Object,
    },
    providerTask: {
      type: Object,
      required: true,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    toggledSections: {
      type: Object,
    },
    canReadRegulatoryFieldsOfWorkflow: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    this.providerName = _.get(this.providerTask, 'provider.name');
    this.isOwnTask = _.get(this.providerTask, 'provider._id', '') === this.userLogged._id;
    this.canReadRegulatoryFieldsOfProviderTask = this.canReadRegulatoryFieldsOfWorkflow ||
     (this.hasRole('TASK-REGULATORY-FIELDS_READ_OWN') && this.isOwnTask);
    this.canReadFinancialSections = this.hasRole('TASK-FINANCIAL_READ_ALL') ||
        (this.hasRole('TASK-FINANCIAL_READ_OWN') && this.isOwnTask);
    this.canReadProviderInstructions = this.hasRole('PROVIDER-TASK-INSTRUCTIONS_READ_ALL') ||
    (this.hasRole('PROVIDER-TASK-INSTRUCTIONS_READ_OWN') && this.isOwnTask);
    this.isOriginalInProgress = _.get(this.providerTask, 'status', '') === 'inProgress';
    this.originalValue = this.providerTask;
    this.workflowId = _.get(this, 'workflow._id');
    this.hasQaIssues = _.get(this, 'providerTask.hasQaIssues', false);
    this.canReadNotes = this.isOwnTask || this.hasRole('TASK-NOTES_READ_ALL');
  },
  computed: {
    ...mapGetters('features', ['mockTimezone']),
    ...mapGetters('app', ['userLogged']),
    statusText() {
      return _.get(HUMAN_READABLE_STATUSES, this.providerTask.status, '');
    },
    timezone() {
      const localTimezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      return !_.isEmpty(this.mockTimezone)
        ? this.mockTimezone
        : _.get(this.userLogged, 'timeZone.value', localTimezone);
    },
    taskDueDateReadOnly() {
      return moment.tz(this.providerTask.taskDueDate, this.timezone).format('YYYY-MM-DD HH:mm');
    },
  },
};
