import _ from 'lodash';
import { mapGetters } from 'vuex';
import moment from 'moment-timezone';
import WorkflowHeader from './workflow-header.vue';
import WorkflowDetailButtons from './workflow-detail-buttons.vue';
import WorkflowTaskDetailReadOnly from './workflow-task-detail-read-only.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { READ_ALL_WORKFLOW_ROLES } from '../../../utils/workflow/workflow-helpers';
import WorkflowDetailMixin from './workflow-detail-mixin';
import RequestService from '../../../services/request-service';

const requestStatuses = RequestService.mappedStatuses;
const VALID_WORKFLOW_EDITION_ADMIN_ROLES = [
  'WORKFLOW_UPDATE_ALL',
  'WORKFLOW_CREATE_ALL',
];

const VALID_WORKFLOW_EDITION_ROLES = [
  'WORKFLOW_UPDATE_OWN',
  'WORKFLOW_CREATE_OWN',
  'TASK_UPDATE_OWN',
];

export default {
  components: {
    WorkflowHeader,
    WorkflowDetailButtons,
    WorkflowTaskDetailReadOnly,
  },
  mixins: [userRoleCheckMixin, WorkflowDetailMixin],
  props: {
    workflow: {
      type: Object,
      required: true,
    },
    request: {
      type: Object,
      required: true,
    },
    isValidRequest: {
      type: Boolean,
      default: false,
    },
    isRequestWithoutWorkflowsValid: {
      type: Boolean,
      default: false,
    },
    isValidWorkflowList: {
      type: Boolean,
      default: false,
    },
    isValid: {
      type: Boolean,
      default: false,
    },
    // passed to workflow-task-detail-read-only via v-bind
    abilities: {
      type: Array,
      default: () => [],
    },
    isCollapsed: {
      type: Boolean,
      default: true,
    },
    isForeignCurrencyRequest: {
      type: Boolean,
      default: false,
    },
    workflowSelected: {
      type: Boolean,
      default: false,
    },
    originalRequest: {
      type: Object,
    },
    toggledSections: {
      type: Object,
    },
    isWorkflowInEditMode: {
      type: Boolean,
      default: false,
    },
    isPortalCat: {
      type: Boolean,
    },
    isCatImportRunning: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      collapsed: this.isCollapsed,
      copyWorkflowSelected: false,
    };
  },
  watch: {
    isCollapsed(collapsed) {
      if (!collapsed) {
        this.collapsed = false;
      }
    },
    collapsed(isCollapsed) {
      this.$emit('workflow-collapsed', isCollapsed);
    },
    copyWorkflowSelected(newValue) {
      this.$emit('workflow-selected', newValue);
    },
    workflowSelected(newWorkflowSelected) {
      this.copyWorkflowSelected = newWorkflowSelected;
    },
  },
  created() {
    this.canEditAll = this.hasRole({ oneOf: VALID_WORKFLOW_EDITION_ADMIN_ROLES });
    this.canEditOwnWorkflow = this.hasRole({ oneOf: VALID_WORKFLOW_EDITION_ROLES });
    this.canEditWorkflow = this.canEditOwnWorkflow || this.canEditAll;
    this.canReadAll = this.hasRole('WORKFLOW_READ_ALL');
    this.canReadFinancialSections = this.hasRole('TASK-FINANCIAL_READ_ALL');
    this.workflowSrcLangName = _.get(this.workflow, 'srcLang.name');
    this.workflowTgtLangName = _.get(this.workflow, 'tgtLang.name');
    this.copyWorkflowSelected = this.workflowSelected;
    this.canReadAllWorkflow = this.hasRole({ oneOf: READ_ALL_WORKFLOW_ROLES });
    this.tasks = _.get(this, 'workflow.tasks', []);
    const providerHasAnyTask = _.some(this.workflow.tasks, this.isOwnTask);
    this.hasAnyVisibleTask = _.map(this.workflow.tasks, (task) => {
      if (this.canReadAllWorkflow || (this.hasRole('TASK_READ_WORKFLOW') && providerHasAnyTask)) {
        return true;
      }
      return this.isOwnTask(task);
    });
    this.canReadOwnWorkflow = this.hasRole('WORKFLOW_READ_OWN');
  },
  computed: {
    ...mapGetters('features', ['mockTimezone']),
    ...mapGetters('app', ['userLogged']),
    hasMultipleWorkflows() {
      return _.get(this.request, 'workflows.length', 0) > 1;
    },
    isRequestCompleted() {
      const requestStatus = _.get(this.request, 'status', '');
      return requestStatuses.completed === requestStatus;
    },
    isRequestCompletedOrDelivered() {
      const requestStatus = _.get(this.request, 'status', '');
      return requestStatuses.completed === requestStatus
        || requestStatuses.delivered === requestStatus;
    },
    timezone() {
      const localTimezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      return !_.isEmpty(this.mockTimezone)
        ? this.mockTimezone
        : _.get(this.userLogged, 'timeZone.value', localTimezone);
    },
    workflowDueDateReadOnly() {
      return moment.tz(this.workflow.workflowDueDate, this.timezone).format('YYYY-MM-DD HH:mm');
    },
    canReadRegulatoryFieldsOfWorkflow() {
      return this.hasRole('TASK-REGULATORY-FIELDS_READ_ALL') ||
        (this.hasRole('TASK-REGULATORY-FIELDS_READ_WORKFLOW') && this.isOwnWorkflow(this.workflow));
    },
    showCollapseIcon() {
      return this.canReadAll || !(this.isOwnWorkflow(this.workflow) && this.canReadOwnWorkflow);
    },
    isEditDisabled() {
      return !this.isRequestWithoutWorkflowsValid ||
        this.isCatImportRunning;
    },
  },
  methods: {
    moveWorkflow(direction) {
      this.$emit('workflow-move', direction);
    },
    isOwnTask(task) {
      const providerTasks = _.get(task, 'providerTasks', []);
      const userId = _.get(this, 'userLogged._id');
      return providerTasks.some(providerTask =>
        _.get(providerTask, 'provider._id', providerTask.provider) === userId);
    },
    isOwnWorkflow(workflow) {
      const tasks = _.get(workflow, 'tasks', []);
      return tasks.some(task => this.isOwnTask(task));
    },
  },
};
