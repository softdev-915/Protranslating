import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import WorkflowDetailButtons from './workflow-detail-buttons.vue';
import CompanyService from '../../../services/company-service';
import WorkflowHeader from './workflow-header.vue';
import WorkflowOriginalValueMixin from './workflow-original-value-mixin.js';
import WorkflowTaskDetail from './workflow-task-detail.vue';
import LanguageSelect from '../../language-select/language-select.vue';
import Flatpickr from '../../form/flatpickr.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import { hasRole } from '../../../utils/user';
import { swapArrayElements } from '../../../utils/arrays';
import {
  emptyWorkflow,
  emptyTask,
  READ_ALL_WORKFLOW_ROLES,
  isValidWorkflow,
  compareWorkflows,
  isValidDate,
  emptyGenericTransaction,
} from '../../../utils/workflow/workflow-helpers';
import TaskService from '../../../services/task-service';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import WorkflowDetailMixin from './workflow-detail-mixin';
import RequestService from '../../../services/request-service';

const requestStatuses = RequestService.mappedStatuses;
const WORKFLOW_TASK_STATUSES = TaskService.workflowTaskStatuses;
const TASK_APPROVED_STATUS = 'approved';
const TASK_CANCELLED_STATUS = 'cancelled';
const TASK_COMPLETED_STATUS = 'completed';
const VALID_WORKFLOW_EDITION_ADMIN_ROLES = [
  'WORKFLOW_UPDATE_ALL',
  'WORKFLOW_CREATE_ALL',
];

const VALID_WORKFLOW_EDITION_ROLES = [
  'WORKFLOW_UPDATE_OWN',
  'WORKFLOW_CREATE_OWN',
  'TASK_UPDATE_OWN',
];
const CUSTOM_PROPS = ['value'];
const CUSTOM_LISTENERS = [
  'input',
  'provider-task-note',
  'workflow-delete',
  'workflow-add',
  'workflow-file-show',
  'workflow-note-edit',
  'providerTaskNote',
  'workflowDelete',
  'workflowAdd',
  'workflowFileShow',
  'workflowNoteEdit',
];
const LINGUISTIC_TASKS = {
  Translation: 'TRANSLATION',
  QA: 'QA',
  Editing: 'EDITING',
  PEMT: 'EDITING',
};
const companyService = new CompanyService();

export default {
  inject: ['$validator'],
  components: {
    Flatpickr,
    WorkflowHeader,
    WorkflowDetailButtons,
    WorkflowTaskDetail,
    SimpleBasicSelect,
    LanguageSelect,
  },
  mixins: [
    WorkflowOriginalValueMixin,
    userRoleCheckMixin,
    WorkflowDetailMixin,
  ],
  props: {
    value: {
      type: Object,
      required: true,
    },
    breakdowns: {
      type: Array,
      default: () => [],
    },
    // passed to workflow-task-detail via v-bind
    abilities: {
      type: Array,
      default: () => [],
    },
    translationUnits: {
      type: Array,
      default: () => [],
    },
    // passed to workflow-task-detail via v-bind
    companyRates: {
      type: Array,
      default: () => [],
    },
    company: {
      type: String,
      default: () => '',
    },
    schedulingCompany: {
      type: String,
      default: () => '',
    },
    isCollapsed: {
      type: Boolean,
      default: true,
    },
    isForeignCurrencyRequest: {
      type: Boolean,
    },
    workflowSelected: {
      type: Boolean,
      default: false,
    },
    // passed to workflow-task-detail via v-bind
    requestDeliveryDate: {
      type: String,
    },
    // passed to workflow-task-detail via v-bind
    requestId: {
      type: String,
    },
    // passed to workflow-task-detail via v-bind
    request: {
      type: Object,
    },
    originalRequest: {
      type: Object,
    },
    requestSourceLanguageList: {
      type: Array,
    },
    requestTargetLanguageList: {
      type: Array,
    },
    toggledSections: {
      type: Object,
    },
    workflowTaskFilesModalState: {
      type: Boolean,
      default: false,
    },
    isPortalCat: {
      type: Boolean,
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    workflowIndex: Number,
  },
  data() {
    return {
      cached: false,
      collapsed: this.isCollapsed,
      workflow: emptyWorkflow(),
    };
  },
  watch: {
    isCollapsed(collapsed) {
      if (!collapsed) {
        this.collapsed = false;
      }
    },
    value: {
      immediate: true,
      handler(newValue) {
        this.workflow = newValue;
      },
    },
    collapsed(isCollapsed) {
      this.$emit('workflow-collapsed', isCollapsed);
    },
    workflow: {
      deep: true,
      handler(newWorkflow, oldWorkflow) {
        if (!_.isEqual(newWorkflow, oldWorkflow)) {
          this.$emit('input', newWorkflow);
        }
      },
    },
    hasWorkflowChanged: {
      immediate: true,
      handler(newValue) {
        this.$emit('workflow-changed', newValue);
      },
    },
    srcLangName: function () {
      this.checkMtUsage();
    },
    tgtLangName: function () {
      this.checkMtUsage();
    },
    workflowSelected(newWorkflowSelected) {
      this.copyWorkflowSelected = newWorkflowSelected;
    },
    'workflow.tasks': function (newTasks, oldTasks = []) {
      if (!_.isEmpty(newTasks) && newTasks.length !== oldTasks.length) {
        this.$emit('workflow-totals-update');
      }
    },
    'request.competenceLevels': {
      deep: true,
      handler(newCompetenceLevels, oldCompetenceLevels) {
        if (!_.isEqual(newCompetenceLevels, oldCompetenceLevels) && this.isCollapsed) {
          const workflow = _.cloneDeep(this.workflow);
          _.each(workflow.tasks, (task) => {
            _.each(task.providerTasks, (providerTask) => {
              providerTask.transactionDetails = _.map(
                providerTask.transactionDetails,
                () => emptyGenericTransaction(),
              );
            });
          });
          this.workflow = workflow;
        }
      },
    },
    isValid: {
      handler(newValue) {
        this.$emit('workflow-validation', newValue);
      },
      immediate: true,
    },
  },
  beforeDestroy() {
    this.$emit('workflow-changed', false);
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'localCurrency']),
    isValid() {
      return isValidWorkflow(
        this.workflow,
        this.abilities,
        this.canReadFinancialSections,
        this.canReadTranslationUnit,
      );
    },
    canReadFinancialSections() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL');
    },
    canReadAll() {
      return this.hasRole('WORKFLOW_READ_ALL');
    },
    canReadOwnWorkflow() {
      return this.hasRole('WORKFLOW_READ_OWN');
    },
    hasNoNewWorkflows() {
      return _.get(this.request, 'workflows').every((w) => !_.isNil(w._id));
    },
    hasMultipleWorkflows() {
      return _.get(this.request, 'workflows.length', 0) > 1;
    },
    originalWorkflow() {
      if (this.isNew) {
        return null;
      }
      return _.find(
        this.originalRequest.workflows,
        (workflow) => workflow._id === this.workflow._id,
      );
    },
    hasWorkflowChanged() {
      return compareWorkflows(this.workflow, this.originalWorkflow);
    },
    languageCombinations() {
      return _.get(this, 'request.languageCombinations', []);
    },
    workflowLanguageCombination() {
      return this.languageCombinations.find((combination) => {
        const isSrcLangMatched = combination.srcLangs.some(
          (srcLang) => srcLang.isoCode === this.srcLangIsoCode,
        );
        const isTgtLangMatched = combination.tgtLangs.some(
          (tgtLang) => tgtLang.isoCode === this.tgtLangIsoCode,
        );
        return isSrcLangMatched && isTgtLangMatched;
      });
    },
    srcLang() {
      return _.get(this, 'workflow.srcLang', {});
    },
    tgtLang() {
      return _.get(this, 'workflow.tgtLang', {});
    },
    srcLangName() {
      return _.get(this, 'workflow.srcLang.name', '');
    },
    tgtLangName() {
      return _.get(this, 'workflow.tgtLang.name', '');
    },
    srcLangIsoCode() {
      return _.get(this, 'workflow.srcLang.isoCode', '');
    },
    tgtLangIsoCode() {
      return _.get(this, 'workflow.tgtLang.isoCode', '');
    },
    isStatusInvoiced() {
      const tasks = _.get(this.workflow, 'tasks', []);
      if (_.isEmpty(tasks)) {
        return false;
      }
      return tasks.some((task) => task.status === WORKFLOW_TASK_STATUSES.invoiced);
    },
    isValidSrcLanguage() {
      return this.srcLangName !== '';
    },
    isValidTargetLanguage() {
      return this.tgtLangName !== '';
    },
    isValidDueDate() {
      return isValidDate(this.workflow.workflowDueDate);
    },
    hasApprovedCompletedProviderTasks() {
      if (_.isEmpty(_.get(this.value, 'tasks'))) {
        return false;
      }
      return this.value.tasks.some((task) => task.providerTasks.some(
        (providerTask) => [TASK_APPROVED_STATUS, TASK_COMPLETED_STATUS].includes(providerTask.status),
      ));
    },
    availableSourceLanguages() {
      const list = [];
      if (_.isEmpty(_.get(this.workflow.tgtLang, 'isoCode'))) {
        return this.requestSourceLanguageList;
      }
      this.request.languageCombinations.forEach((l) => {
        l.tgtLangs.forEach((tgtLang) => {
          if (tgtLang.isoCode === this.workflow.tgtLang.isoCode) {
            list.push(l.srcLangs);
          }
        });
      });
      return _.uniqBy(_.flatten(list), 'isoCode');
    },
    availableTargetLanguages() {
      const list = [];
      if (_.isEmpty(_.get(this.workflow.srcLang, 'isoCode'))) {
        return this.requestTargetLanguageList;
      }
      this.request.languageCombinations.forEach((l) => {
        l.srcLangs.forEach((srcLang) => {
          if (srcLang.isoCode === this.workflow.srcLang.isoCode) {
            list.push(l.tgtLangs);
          }
        });
      });
      return _.uniqBy(_.flatten(list), 'isoCode');
    },
    canEditOwnWorkflow() {
      return VALID_WORKFLOW_EDITION_ROLES.some((role) => hasRole(this.userLogged, role));
    },
    canEditAll() {
      return VALID_WORKFLOW_EDITION_ADMIN_ROLES.some((role) => hasRole(this.userLogged, role));
    },
    canEditWorkflow() {
      return this.canEditOwnWorkflow || this.canEditAll;
    },
    datepickerOptions() {
      return {
        onValueUpdate: null,
        enableTime: true,
        allowInput: false,
        disableMobile: 'true',
        dateFormat: 'Y-m-d H:i',
      };
    },
    hasAnyVisibleTask() {
      const readAll = _.some(READ_ALL_WORKFLOW_ROLES, (role) => hasRole(this.userLogged, role));
      const providerHasAnyTask = _.some(
        this.tasks,
        this.isOwnTask,
      );
      return _.map(this.tasks, (task) => {
        if (readAll || (this.hasRole('TASK_READ_WORKFLOW') && providerHasAnyTask)) {
          return true;
        }
        return this.isOwnTask(task);
      });
    },
    isFollowingTaskStarted() {
      const len = this.tasks.length;
      return _.map(this.tasks, (task, index) => {
        if (index < len) {
          for (let i = index + 1; i < len; i++) {
            const nextTask = this.tasks[i];
            if (nextTask && nextTask.providerTasks) {
              if (_.findIndex(nextTask.providerTasks, (pt) => pt.status !== 'notStarted') !== -1) {
                return true;
              }
            }
          }
        }
        return false;
      });
    },
    hasApprovedCancelledTasks() {
      const statuses = [TASK_APPROVED_STATUS, TASK_CANCELLED_STATUS];
      return _.some(
        this.workflow.tasks,
        (workflowTask) => _.some(
          workflowTask.providerTasks,
          (providerTask) => statuses.some((status) => status === providerTask.status),
        ),
      );
    },
    isFutureTask() {
      return _.map(
        this.tasks,
        (t, i) => _.some([i, i - 1], (index) => {
          if (index < 0) {
            return false;
          }
          const key = `originalValue.tasks[${index}]`;
          const task = _.get(this, key, []);
          if (
            !_.isEmpty(task)
            && task.providerTasks
            && _.every(
              task.providerTasks,
              (pt) => this.isFinishedStatus(pt.status),
            )
          ) {
            return false;
          }
          return true;
        }),
      );
    },
    tasks() {
      return _.get(this.workflow, 'tasks', []);
    },
    taskToggleIconClass() {
      return this.collapsed ? 'fa-expand' : 'fa-compress';
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    isNew() {
      return _.isNil(_.get(this, 'workflow._id'));
    },
    subtotal() {
      return this.workflow.subtotal;
    },
    workflows() {
      return _.get(this, 'request.workflows', []);
    },
    previousWorkflows() {
      return this.workflows.slice(0, this.workflowIndex);
    },
    canReadTranslationUnit() {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_READ_ALL');
    },
    isRequestCompletedOrDelivered() {
      const requestStatus = _.get(this.request, 'status', '');
      return requestStatuses.completed === requestStatus
        || requestStatuses.delivered === requestStatus;
    },
    canReadRegulatoryFieldsOfWorkflow() {
      return this.hasRole('TASK-REGULATORY-FIELDS_READ_ALL')
      || (this.hasRole('TASK-REGULATORY-FIELDS_READ_WORKFLOW') && this.isOwnWorkflow(this.workflow));
    },
    showCollapseIcon() {
      return this.canReadAll || !(this.isOwnWorkflow(this.workflow) && this.canReadOwnWorkflow);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onWorkflowUpdate() {
      this.$emit('workflow-totals-update');
    },
    onBasicCatTool() {
      if (_.has(this.workflow, 'tgtLang.isoCode')) {
        this.$emit('basic-cat-tool', this.workflow.tgtLang.isoCode);
      }
    },
    onTaskAdd(index) {
      const len = this.workflow.tasks.length;
      const newTask = emptyTask();
      newTask.providerTasks[0].taskDueDate = this.requestDeliveryDate;
      if (!this.canReadFinancialSections) {
        if (_.has(newTask, 'invoiceDetails')) {
          delete newTask.invoiceDetails;
        }
        if (_.has(newTask, 'providerTasks.0.billDetails')) {
          delete newTask.providerTasks[0].billDetails;
        }
      }
      if (index >= 0 && len > index) {
        // clone the array but not the inner objects
        const taskArrayClone = this.workflow.tasks.slice(0);
        taskArrayClone.splice(index + 1, 0, newTask);
        this.workflow.tasks = taskArrayClone;
      } else if (len === index) {
        this.workflow.tasks.push(newTask);
      }
      this.$emit('input', this.workflow);
    },
    onTaskDelete(index) {
      const { tasks } = this.workflow;
      if (index <= tasks.length) {
        // clone the array (but not the inner objects)
        const taskArrayClone = tasks.slice(0);
        taskArrayClone.splice(index, 1);
        this.workflow.tasks = taskArrayClone;
        // TODO check if input is not firing twice by the watcher
        this.$emit('input', this.workflow);
      }
    },
    onTaskMove(index, direction) {
      const newIndex = index + direction;
      const { tasks } = this.workflow;
      if (newIndex >= 0 && newIndex < tasks.length) {
        const taskArrayClone = swapArrayElements(tasks, index, newIndex);
        this.workflow.tasks = taskArrayClone;
        // TODO check if input is not firing twice by the watcher
        this.$emit('input', this.workflow);
      }
    },
    cancelWorkflowUpdate() {
      this.$emit('workflow-cancel', this.isNew);
    },
    moveWorkflow(direction) {
      this.$emit('workflow-move', direction);
    },
    onTaskUpdate(index, event) {
      this.$set(this.workflow.tasks, index, event);
    },
    onWorkflowFileShow(taskIndex, event) {
      event.taskIndex = taskIndex;
      event.workflowId = this.workflow._id;
      this.$emit('workflow-file-show', event);
    },
    onWorkflowNoteEdit(taskIndex, event) {
      event.taskIndex = taskIndex;
      event.workflowId = this.workflow._id;
      this.$emit('workflow-note-edit', event);
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },
    onSave() {
      if (!this.isValid) {
        return;
      }
      if (this.isNew) {
        return this.$emit('workflow-create');
      }
      this.$emit('workflow-save');
    },
    isOwnTask(task) {
      const providerTasks = _.get(task, 'providerTasks', []);
      const userId = _.get(this, 'userLogged._id');
      return providerTasks.some((providerTask) => _.get(providerTask, 'provider._id', providerTask.provider) === userId);
    },
    isOwnWorkflow(workflow) {
      const tasks = _.get(workflow, 'tasks', []);
      return tasks.some((task) => this.isOwnTask(task));
    },
    showAnalysisModal(parseFunc) {
      this.$emit('show-analysis-modal', parseFunc);
    },
    async checkMtUsage() {
      const srcLangIsoCode = _.get(this, 'workflow.srcLang.isoCode');
      const tgtLangIsoCode = _.get(this, 'workflow.tgtLang.isoCode');
      if (!_.isNil(srcLangIsoCode) && !_.isNil(tgtLangIsoCode)) {
        this.loading = true;
        try {
          const response = await companyService.get(this.company);
          const { languageCombinations = [], useMt } = _.get(response, 'data.company.mtSettings', {});
          const languageCombination = languageCombinations.find(
            (combination) => combination.srcLang === srcLangIsoCode && combination.tgtLang === tgtLangIsoCode,
          );
          this.workflow.useMt = useMt && !_.isNil(languageCombination);
        } finally {
          this.loading = false;
        }
      }
    },
    taskInGroupToggle(currentTaskPosition) {
      const groupedTasks = this.tasks
        .map((t, i) => ({ ...t, position: i }))
        .filter((t) => t.includedInGroup);
      if (this.tasks[currentTaskPosition].includedInGroup) {
        const taskIndex = groupedTasks.findIndex((t) => t.position === currentTaskPosition);
        if (taskIndex === 0 || taskIndex === groupedTasks.length - 1) {
          this.workflow.tasks[currentTaskPosition].includedInGroup = false;
        } else {
          for (let t = 0; t < this.workflow.tasks.length; t++) {
            this.workflow.tasks[t].includedInGroup = false;
          }
        }
      } else {
        if (this.tasks.find((t) => t.includedInGroup)) {
          const newTaskIndex = currentTaskPosition;
          const firstInGroupIndex = groupedTasks[0].position;
          const lastInGroupIndex = groupedTasks[groupedTasks.length - 1].position;
          const groupTasksInBetweenFromTop = (newTaskIndex - lastInGroupIndex) > 1;
          const groupTasksInBetweenFromBottom = (newTaskIndex - firstInGroupIndex) < -1;
          if (groupTasksInBetweenFromTop || groupTasksInBetweenFromBottom) {
            for (
              let i = groupTasksInBetweenFromTop ? lastInGroupIndex : firstInGroupIndex;
              groupTasksInBetweenFromTop
                ? i < newTaskIndex
                : i > newTaskIndex;
              groupTasksInBetweenFromTop ? i++ : i--
            ) {
              const task = this.tasks[i];
              if (!_.keys(LINGUISTIC_TASKS).includes(task.ability)) {
                for (let t = 0; t < this.workflow.tasks.length; t++) {
                  this.workflow.tasks[t].includedInGroup = false;
                }
                return;
              }
              this.workflow.tasks[i].includedInGroup = true;
            }
          }
        }
        this.workflow.tasks[currentTaskPosition].includedInGroup = true;
      }
    },
    onWorkflowLinguisticTaskProviderSelected(e) {
      this.$emit('workflow-linguistic-task-provider-selected', e);
    },
    onWorkflowAssignTriggerModal(e) {
      this.$emit('workflow-assign-trigger-modal', e);
    },
  },
};
