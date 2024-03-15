import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import WorkflowOriginalValueMixin from './workflow-original-value-mixin.js';
import TaskService from '../../../services/task-service';
import Flatpickr from '../../form/flatpickr.vue';
import { hasRole } from '../../../utils/user';
import { toOptionFormat } from '../../../utils/select2';
import { isActiveDocument } from '../list-request/request-inline-edit-helper';
import ProviderTaskBill from './provider-task-bill.vue';
import {
  emptyProviderTask,
  emptyBill,
  emptyQuantity,
  getProviderMatchingRateDetail,
  REFLOW_TASK,
  isValidDate,
  emptyBillDetail,
  emptyGenericTransaction,
} from '../../../utils/workflow/workflow-helpers';
import ProviderTaskQuantity from './provider-task-quantity.vue';
import ProviderTaskInstructions from './provider-task-instructions.vue';
import VendorMinimumChargeService from '../../../services/vendor-minimum-charge-service';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import WorkflowProviderTaskService from '../../../services/workflow-provider-task-service';
import UserRoleCheckMixin from '../../../mixins/user-role-check';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import { sum, multiply, ensureNumber } from '../../../utils/bigjs';
import BillCsvParser from '../../../services/csv-parser/bill-csv-parser.js';
import UserService from '../../../services/user-service.js';
import ImportAnalysisButton from '../import-analysis/import-analysis-button.vue';
import ImportAnalysisModal from '../import-analysis/import-analysis-modal.vue';
import { errorNotification, successNotification } from '../../../utils/notifications';
import WorkflowProviderTaskDetailMixin from './workflow-provider-task-detail-mixin';

const userService = new UserService();
const billCsvParser = new BillCsvParser();
const vendorMinimumChargeService = new VendorMinimumChargeService();
const workflowProviderTaskService = new WorkflowProviderTaskService();
const CONTACT_USER_TYPE = 'Contact';
const CUSTOM_LISTENERS = [
  'input',
  'task-delete',
  'task-add',
  'task-move',
  'taskDelete',
  'taskAdd',
  'taskMove',
  'providerTaskQuoteAdd',
  'providerTaskQuoteDelete',
];
const CUSTOM_PROPS = ['value'];
const HUMAN_READABLE_STATUSES = TaskService.humanReadableStatuses;
const TASK_UPDATE_DEFAULT_STATUSES = _.pick(HUMAN_READABLE_STATUSES, [
  'notStarted',
  'inProgress',
  'completed',
]);
const PROVIDER_READ_ONLY_STATUSES = [
  'completed',
  'cancelled',
  'approved',
];
const OFFER_CLOSED_STATUS = 'Closed';
const QUOTE_READ_ROLES = ['QUOTE_READ_OWN', 'QUOTE_READ_ALL'];
const ANALYSIS_IMPORT_TYPE_INVOICE = 'invoice';
const ANALYSIS_IMPORT_TYPE_BILL = 'bill';
const STATUSES = {
  approved: 'approved',
  cancelled: 'cancelled',
  notStarted: 'notStarted',
  inProgress: 'inProgress',
  onHold: 'onHold',
  completed: 'completed',
};
const UNCOMPLETED_STATUSES = [STATUSES.notStarted, STATUSES.inProgress, STATUSES.onHold];
const REQUEST_CANCELLED_STATUS = 'Cancelled';
const TASK_APPROVAL_OWN_ROLE = 'TASK-APPROVAL_UPDATE_OWN';
const TASK_APPROVAL_ALL_ROLE = 'TASK-APPROVAL_UPDATE_ALL';
const IMPORT_MEMOQ_DISABLED_STATUSES = [STATUSES.approved, STATUSES.cancelled];
const buildEmptyProviderRates = () => ({
  provider: '',
  value: [],
});
const LINGUISTIC_TASKS = {
  Translation: 'TRANSLATION',
  QA: 'QA',
  Editing: 'EDITING',
  PEMT: 'EDITING',
};
const ASSIGNEE_TYPE = {
  Translation: 'translator',
  Editing: 'editor',
  PEMT: 'editor',
  QA: 'qaEditor',
};

export default {
  mixins: [
    WorkflowOriginalValueMixin,
    UserRoleCheckMixin,
    WorkflowProviderTaskDetailMixin,
  ],
  components: {
    UserAjaxBasicSelect,
    ProviderTaskQuantity,
    Flatpickr,
    SimpleBasicSelect,
    ProviderTaskBill,
    ImportAnalysisButton,
    ImportAnalysisModal,
    ProviderTaskInstructions,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    breakdowns: {
      type: Array,
      default: () => [],
    },
    currencies: {
      type: Array,
      default: () => [],
    },
    ability: {
      type: Object,
      default: () => ({
        value: '',
        text: '',
        internalDepartmentRequired: false,
        languageCombination: false,
        catTool: false,
        companyRequired: false,
        competenceLevelRequired: false,
      }),
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    canEditWorkflow: {
      type: Boolean,
      default: false,
    },
    company: {
      type: String,
      default: () => '',
    },
    schedulingCompany: {
      type: String,
      default: () => '',
    },
    // passed by workflow-task-detail via v-bind
    companyRates: {
      type: Array,
      default: () => [],
    },
    //  passed by workflow-task-detail via v-bind
    isFollowingTaskStarted: {
      type: Boolean,
      default: false,
    },
    //  passed by workflow-task-detail via v-bind
    workflow: {
      type: Object,
    },
    // passed by workflow-task-detail via v-bind
    requestId: {
      type: String,
    },
    // passed by workflow-task-detail via v-bind
    request: {
      type: Object,
    },
    // passed by workflow-task-detail via v-bind
    workflowId: {
      type: String,
    },
    task: {
      type: Object,
    },
    toggledSections: {
      type: Object,
    },
    originalTask: {
      type: Object,
    },
    workflowTaskFilesModalState: {
      type: Boolean,
      default: false,
    },
    providerTaskIndex: {
      type: Number,
    },
    taskIndex: {
      type: Number,
    },
    hasApprovedCancelledTasks: {
      type: Boolean,
    },
    hasApprovedCompletedProviderTasks: {
      type: Boolean,
    },
    requestStatus: {
      type: String,
    },
    isFutureTask: {
      type: Boolean,
      default: true,
    },
    workflowLanguageCombination: Object,
    canReadRegulatoryFieldsOfWorkflow: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      mounted: false,
      loadingProviders: false,
      previousProvider: null,
      providerTask: emptyProviderTask(),
      analysisImportTypeSelected: '',
      analysisImportTypeInvoice: ANALYSIS_IMPORT_TYPE_INVOICE,
      analysisImportTypeBill: ANALYSIS_IMPORT_TYPE_BILL,
      providerFilterKey: false,
      providerRates: buildEmptyProviderRates(),
      billUnitPriceDeterminant: [],
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.addOrRemoveDefaultBillDetails(newValue);
        Object.assign(this.providerTask, newValue);
        this._setProviderTask(newValue);
      },
    },
    providerTask: {
      deep: true,
      handler(newProviderTask) {
        this.$emit('input', newProviderTask);
        this._setProviderTask(newProviderTask);
      },
    },
    providerFilter: {
      deep: true,
      handler() {
        this.providerFilterKey = !this.providerFilterKey;
      },
    },
    'providerTask.provider._id'(providerId) {
      if (_.isEmpty(providerId)) {
        this.providerTask.minCharge = 0;
        return;
      }
      this.retrieveProviderMinCharge({
        vendorId: providerId,
        ability: _.get(this.workflow, `tasks[${this.taskIndex}].ability`, ''),
        sourceLanguage: _.get(this.workflow, 'srcLang.name', ''),
        targetLanguage: _.get(this.workflow, 'tgtLang.name', ''),
      });
      this.retrieveProviderRates(providerId);
    },
    providerTaskTotal: {
      immediate: true,
      handler() {
        this.$emit('workflow-totals-update');
      },
    },
    'providerTask.status'(newStatus) {
      this.$emit('provider-task-status-update', newStatus);
    },
    requestStatus(newRequestStatus) {
      const isTaskUncompleted = UNCOMPLETED_STATUSES.some((s) => this.providerTask.status === s);
      if (newRequestStatus === REQUEST_CANCELLED_STATUS && isTaskUncompleted) {
        this.providerTask.status = STATUSES.cancelled;
        _.forEach(this.providerTask.billDetails, (billDetail) => {
          billDetail.unitPrice = 0;
          billDetail.quantity = 1;
        });
      }
    },
    ability(newAbility, oldAbility) {
      const providerId = _.get(this.providerTask, 'provider._id');
      const isInit = _.isEmpty(oldAbility.value) && this.originalTask.ability === newAbility.value;
      if (!_.isEmpty(providerId) && !isInit) {
        this.retrieveProviderMinCharge({
          vendorId: providerId,
          ability: _.get(newAbility, 'text', ''),
          sourceLanguage: this.workflowSrcLang,
          targetLanguage: this.workflowTgtLang,
        });
      }
    },
    workflowSrcLang(newLang, oldLang) {
      const providerId = _.get(this.providerTask, 'provider._id');
      if (newLang !== oldLang) {
        this.retrieveProviderMinCharge({
          vendorId: providerId,
          ability: _.get(this.ability, 'text', ''),
          sourceLanguage: newLang,
          targetLanguage: this.workflowTgtLang,
        });
      }
    },
    workflowTgtLang(newLang, oldLang) {
      const providerId = _.get(this.providerTask, 'provider._id');
      if (newLang !== oldLang) {
        this.retrieveProviderMinCharge({
          vendorId: providerId,
          ability: _.get(this.ability, 'text', ''),
          sourceLanguage: this.workflowSrcLang,
          targetLanguage: newLang,
        });
      }
    },
  },
  created() {
    this.$emit('workflows-loading', true);
    this.addOrRemoveDefaultBillDetails();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreateAllRequest() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    isShowNotesDisabled() {
      if ((this.canEditTask && this.canEditNow) || this.canEditAll) {
        return false;
      }
      return !this.hasRole('TASK-NOTES_READ_ALL');
    },
    canUploadMemoq() {
      return !IMPORT_MEMOQ_DISABLED_STATUSES.includes(this.providerTask.status)
      && !(_.get(this.providerTask, 'billDetails.length', 0) === 1
       && _.isEmpty(_.get(this.providerTask, 'billDetails.[0].breakdown._id)'))
       && _.isEmpty(_.get(this.providerTask, 'billDetails.[0].breakdown.name)'))
       && _.isEmpty(_.get(this.providerTask, 'billDetails.[0].translationUnit._id)'))
       && _.isEmpty(_.get(this.providerTask, 'billDetails.[0].translationUnit.name)'))
      );
    },
    isReadOnlyProvider() {
      return PROVIDER_READ_ONLY_STATUSES.includes(this.providerTask.status);
    },
    isDueDateValid() {
      return isValidDate(this.providerTask.taskDueDate);
    },
    canUpdateRegulatoryFields() {
      return this.hasRole('TASK-REGULATORY-FIELDS_UPDATE_ALL');
    },
    canEditProvider() {
      return (this.canEditAll || this.canUpdateRegulatoryFields) && !this.isReadOnlyProvider;
    },
    canReadFinancialSections() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL')
      || (hasRole(this.userLogged, 'TASK-FINANCIAL_READ_OWN') && this.isOwnTask);
    },
    canReadProviderInstructions() {
      return hasRole(this.userLogged, 'PROVIDER-TASK-INSTRUCTIONS_READ_ALL')
      || (hasRole(this.userLogged, 'PROVIDER-TASK-INSTRUCTIONS_READ_OWN') && this.isOwnTask);
    },
    workflowSrcLang() {
      return _.get(this, 'workflow.srcLang.name', '');
    },
    workflowTgtLang() {
      return _.get(this, 'workflow.tgtLang.name', '');
    },
    canReadAllQuote() {
      return QUOTE_READ_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    canReadTask() {
      return (
        hasRole(this.userLogged, 'TASK_READ_OWN')
        && this.isOwnTask
      ) || hasRole(this.userLogged, 'TASK_READ_ALL')
      || this.canReadRegulatoryFieldsOfProviderTask;
    },
    userIsContact() {
      return this.userLogged.type === CONTACT_USER_TYPE;
    },
    canReadProjectedCost() {
      return hasRole(this.userLogged, 'PROJECTED-RATE_READ_ALL') && !this.userIsContact;
    },
    canReadBill() {
      return (hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL') || this.isOwnTask) && !this.userIsContact;
    },
    doTargetAndSourceLanguageExist() {
      return _.isEmpty(this.workflowSrcLang) && _.isEmpty(this.workflowTgtLang);
    },
    canEditTask() {
      return (this.canEditOwnTask || this.canEditAll);
    },
    canEditOwnTask() {
      return hasRole(this.userLogged, 'TASK_UPDATE_OWN') && this.isOwnTask;
    },
    canEditNow() {
      return this.canEditAll || this.isPreviousProviderTaskFinished || this.isTaskIncludedInGroup;
    },
    datepickerOptions() {
      const defaultOptions = {
        onValueUpdate: null,
        disableMobile: 'true',
        enableTime: true,
        allowInput: false,
        dateFormat: 'Y-m-d H:i:S',
      };
      if (this.isApprovedOrCancelled) {
        defaultOptions.clickOpens = false;
      }
      return defaultOptions;
    },
    files() {
      return _.get(this.providerTask, 'files', []).filter(isActiveDocument);
    },
    taskFilesButtonEnabled() {
      const canUploadFiles = !this.lockPreviouslyCompleted
        && !_.isNil(_.get(this, 'providerTask._id'))
        && !this.isPortalCatSupported;
      return !_.isEmpty(_.get(this.ability, 'value')) && (this.canReadTask || canUploadFiles);
    },
    filesUploadDisabled() {
      return !this.ability
        || !this.ability.value
        || _.isNull(_.get(this, 'providerTask._id', null));
    },
    isOwnTask() {
      if (this.taskProvider) {
        return this.taskProvider._id === this.userLogged._id;
      }
      return false;
    },
    canReadAll() {
      return this.hasRole('WORKFLOW_READ_ALL');
    },
    canReadOwn() {
      return this.hasRole('TASK_READ_OWN') && this.isOwnTask;
    },
    canReadNotes() {
      return this.isOwnTask || this.hasRole('TASK-NOTES_READ_ALL');
    },
    canReadRegulatoryFieldsOfProviderTask() {
      return this.canReadRegulatoryFieldsOfWorkflow
        || (this.hasRole('TASK-REGULATORY-FIELDS_READ_OWN') && this.isOwnTask);
    },
    lockPreviouslyCompleted() {
      return this.canEditOwnTask && !this.canEditAll && this.isOriginalCompletedOrCancelled
        && this.isFollowingTaskStarted;
    },
    isOwnTaskCompleted() {
      return this.canEditOwnTask && !this.canEditAll && this.isOriginalCompletedOrCancelled;
    },
    isOriginalCompletedOrCancelled() {
      const originalStatus = _.get(this.originalValue, 'status', '');
      return originalStatus === 'completed' || originalStatus === 'cancelled';
    },
    isOriginalInProgress() {
      const originalStatus = _.get(this.originalValue, 'status', '');
      return originalStatus === 'inProgress';
    },
    providerTaskStatusOptions() {
      let providerTaskStatuses = TASK_UPDATE_DEFAULT_STATUSES;
      if (this.canApproveOwn) {
        providerTaskStatuses.approved = HUMAN_READABLE_STATUSES.approved;
      }
      if (this.canApproveAll) {
        providerTaskStatuses = HUMAN_READABLE_STATUSES;
      }
      return Object.keys(providerTaskStatuses).map((key) => ({
        value: key,
        text: providerTaskStatuses[key],
      }));
    },
    providerFilter() {
      const params = {};
      if (this.ability && this.ability.value) {
        params.ability = this.ability.value;
        const languages = [this.workflowSrcLang, this.workflowTgtLang];
        const isLanguagesEmpty = languages.every((l) => !_.isEmpty(l));
        if (this.ability.languageCombination && isLanguagesEmpty) {
          params.language = `${this.workflowSrcLang} - ${this.workflowTgtLang}`;
        }
        const requestCompetenceLevels = _.get(this, 'request.competenceLevels', []);
        if (this.ability.competenceLevelRequired && !_.isEmpty(requestCompetenceLevels)) {
          params.competenceLevels = requestCompetenceLevels.map((cl) => cl._id);
        }
      }
      if (this.schedulingCompany) {
        params.schedulingCompany = this.schedulingCompany;
      }
      if (this.company) {
        params.company = this.company;
        params.excludedProvidersAreExcluded = true;
      }
      params.terminated = false;
      return params;
    },
    quantity() {
      if (this.providerTask.quantity) {
        return this.providerTask.quantity;
      }
      return [{
        amount: null,
        units: '',
      }];
    },
    status() {
      if (this.providerTask.status) {
        return {
          value: this.providerTask.status,
          text: HUMAN_READABLE_STATUSES[this.providerTask.status],
        };
      }
      return { value: '', text: '' };
    },
    taskProvider() {
      return this.providerTask.provider;
    },
    isProviderEscalated() {
      return _.get(this, 'taskProvider.escalated', false);
    },
    taskProviderName() {
      return _.get(this, 'taskProvider.name', '');
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    isProviderTaskButtonsVisible() {
      const invoiceVisible = _.get(this, 'toggledSections.invoiceVisible');
      const projectedCostVisible = _.get(this, 'toggledSections.projectedCostVisible');
      const billVisible = _.get(this, 'toggledSections.billVisible');
      return invoiceVisible || projectedCostVisible || billVisible;
    },
    isInvoiceTransactionDetailsEmpty() {
      const details = _.get(this, 'providerTask.transactionDetails', []);
      const isEveryDetailEmpty = _.every(details, (detail) => _.isEmpty(_.get(detail, 'invoice.breakdown.name', '')));
      return _.isEmpty(details) || isEveryDetailEmpty;
    },
    isBillTransactionDetailsEmpty() {
      const details = _.get(this, 'providerTask.transactionDetails', []);
      const isEveryDetailEmpty = _.every(details, (detail) => _.isEmpty(_.get(detail, 'bill.breakdown.name', '')));
      return _.isEmpty(details) || isEveryDetailEmpty;
    },
    isTaskInProgress() {
      return this.status.value === 'inProgress';
    },
    providerTaskMinimumChargeRate() {
      let amount = this.providerTask.minCharge;
      if (_.get(this, 'provider.flatRate', false) || this.status.value === STATUSES.cancelled) {
        amount = 0;
      }
      return amount;
    },
    providerTaskTotal() {
      let amount = this.billTotalAmount;
      if (_.get(this, 'provider.flatRate', false) || this.status.value === STATUSES.cancelled) {
        amount = 0;
      } else if (this.providerTask.minCharge > amount) {
        amount = this.providerTask.minCharge;
      }
      return amount;
    },
    billTotalAmount() {
      return _.reduce(
        this.providerTask.billDetails,
        (amount, bill) => _.toNumber(
          sum(
            multiply(_.defaultTo(bill.unitPrice, 0), ensureNumber(bill.quantity)),
            amount,
          ),
        ),
        0,
      );
    },
    canEditStatus() {
      return [
        this.canEditTask,
        this.canEditNow,
        !this.lockPreviouslyCompleted,
        !this.isApprovedOrCancelled,
      ].every((cond) => cond);
    },
    isApprovedOrCancelled() {
      const originalStatus = _.get(this.originalValue, 'status', '');
      return [STATUSES.approved, STATUSES.cancelled].some((status) => originalStatus === status);
    },
    hasQaIssues() {
      return _.get(this, 'originalValue.hasQaIssues', false);
    },
    canApprove() {
      return [TASK_APPROVAL_OWN_ROLE, TASK_APPROVAL_ALL_ROLE].some((r) => this.hasRole(r));
    },
    canApproveOwn() {
      return this.hasRole(TASK_APPROVAL_OWN_ROLE);
    },
    canApproveAll() {
      return this.hasRole(TASK_APPROVAL_ALL_ROLE);
    },
    hasOffer() {
      const offerId = _.get(this, 'providerTask.offer._id');
      if (_.isNil(offerId)) {
        return false;
      }

      const isOfferClosed = this.providerTask.offer.status === OFFER_CLOSED_STATUS;
      const hasOfferExpired = !this.providerTask.offer.isActive
        && this.providerTask.offer.currentRound > 0;

      if (isOfferClosed || hasOfferExpired) {
        return false;
      }
      return true;
    },
    hasActiveOffer() {
      return _.get(this, 'providerTask.offer.isActive', false);
    },
    canComplete() {
      return !this.isLinguisticTask || (_.get(this, 'originalValue.areAllSegmentsConfirmed', true)
        && !this.hasQaIssues);
    },
    targetLanguage() {
      return _.get(this, 'workflow.tgtLang.name', '');
    },
    showGroupTasksButton() {
      return this.providerTaskIndex === 0 && this.isLinguisticTask;
    },
    isLinguisticTask() {
      return _.keys(LINGUISTIC_TASKS).includes(this.ability.value);
    },
    assigneeType() {
      return this.isLinguisticTask && this.ability ? ASSIGNEE_TYPE[this.ability.value] : '';
    },
    providerId() {
      return _.get(this, 'providerTask.provider._id', '');
    },
    isReflowTask() {
      return _.get(this, 'task.ability', null) === REFLOW_TASK;
    },
    workflowIndex() {
      return _.get(this, 'request.workflows', []).findIndex((w) => w._id === this.workflowId);
    },
    areAllPrevTasksCompletedOrApproved() {
      const previousTasks = this.workflow.tasks.slice(0, this.taskIndex);
      return previousTasks.every(
        (task) => task.providerTasks.every(
          (providerTask) => providerTask.status === STATUSES.completed
            || providerTask.status === STATUSES.approved,
        ),
      );
    },
    isProviderPoolingOfferButtonVisible() {
      if (_.isNil(_.get(this, 'providerTask._id'))
        || !hasRole(this.userLogged, 'OFFER_READ_ALL')) {
        return false;
      } if (this.hasOffer) {
        return hasRole(this.userLogged, 'OFFER_UPDATE_ALL');
      }
      return hasRole(this.userLogged, 'OFFER_CREATE_ALL');
    },
    isWorkflowAssignButtonDisabled() {
      return !this.isUserIpAllowed || (this.isPortalCat && !this.hasRole({ oneOf: ['PIPELINE-RUN_UPDATE_ALL', 'PIPELINE_READ_ALL'] }));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    addOrRemoveDefaultBillDetails(newValue) {
      newValue = _.defaultTo(newValue, this.providerTask);
      if (_.isEmpty(newValue.billDetails)) {
        this.providerTask.billDetails = [emptyBill()];
      }
    },
    manageFiles() {
      this.$emit('workflow-file-show', {
        canEditTask: this.canEditOwnTask,
        canEditAll: this.canEditAll,
        canEditNow: this.canEditNow,
        isApprovedOrCancelled: this.isApprovedOrCancelled,
        lockPreviouslyCompleted: this.lockPreviouslyCompleted,
        providerTaskId: this.providerTask._id,
        files: this.files,
        isOwnTaskCompleted: this.isOwnTaskCompleted,
        isReadOnlyProvider: this.isReadOnlyProvider,
        isFutureTask: this.isFutureTask,
        canReadRegulatoryFields: this.canReadRegulatoryFieldsOfProviderTask,
      });
    },
    navigateToProviderPoolingOffer() {
      if (_.isNil(this.task._id) || _.isNil(this.request._id) || _.isNil(this.workflowId)) {
        throw new Error('Not enough data to create provider pooling offer');
      }

      if (this.hasOffer) {
        return this.$router.push({
          name: 'request-provider-pooling-offer-edit',
          params: { entityId: this.providerTask.offer._id },
        });
      }
      return this.$router.push({
        name: 'request-provider-pooling-offer-create',
        query: {
          workflowId: this.workflowId,
          taskId: this.task._id,
          providerTaskId: this.providerTask._id,
          requestId: this.request._id,
          isNewOffer: true,
        },
      });
    },
    onAddProvider() {
      this.$emit('provider-add');
    },
    onDeleteProvider() {
      this.$emit('provider-delete');
    },
    onProviderTaskStatusSelect(newTaskStatus) {
      this.providerTask.status = newTaskStatus.value;
    },
    onUsersLoading(loading) {
      this.loadingProviders = loading;
      const listener = this.$listeners['users-loading'];
      if (listener) {
        listener(loading);
      }
    },
    onQuantityUpdate(index, event) {
      this.$set(this.providerTask.quantity, index, event);
    },
    provider() {
      let provider = {
        value: '',
        text: '',
      };
      if (this.providerTask && this.providerTask.provider) {
        // if this.previousProvider._id === this.providerTask.provider it means that
        // this.providerTask.provider is an objectId, which is the only case in which we want
        // to return the previous provider to avoid the "undefined undefined"
        if (this.previousProvider && this.previousProvider._id === this.providerTask.provider) {
          provider = toOptionFormat(this.previousProvider);
        } else if (this.providerTask.provider.firstName !== undefined
          || this.providerTask.provider.name !== undefined) {
          provider = toOptionFormat(this.providerTask.provider);
        } else if (this.providerTask.provider._id) {
          provider = 'loading';
        }
      }
      return provider;
    },
    onTaskProviderSelect(newTaskProvider) {
      if (newTaskProvider && newTaskProvider.value) {
        this.providerTask.provider = {
          _id: newTaskProvider.value,
          name: newTaskProvider.text,
          deleted: newTaskProvider.deleted,
          terminated: newTaskProvider.terminated,
          providerConfirmed: newTaskProvider.providerConfirmed,
          flatRate: newTaskProvider.flatRate,
          escalated: newTaskProvider.escalated,
        };
        if (_.keys(LINGUISTIC_TASKS).find((task) => task === _.get(this, 'task.ability', null))
           && _.get(this, 'task._id', null) && this.workflowId && this.hasRole('WORKFLOW_UPDATE_ALL')) {
          this.$emit('workflow-linguistic-task-provider-selected', {
            task: this.task,
            workflowId: this.workflowId,
            workflowIndex: this.workflowIndex,
          });
        }
        if (this.isPortalCat && this.isReflowTask && this.areAllPrevTasksCompletedOrApproved) {
          this.pushNotification(successNotification(`Workflow ${this.workflowIndex + 1} files exported. Click the Files icon for the Reflow task to download`));
        }
      } else {
        this.providerTask.provider = null;
      }
    },
    onUnitAdd(index) {
      const len = this.providerTask.quantity.length;
      if (index >= 0 && len > index) {
        const quantityClone = this.providerTask.quantity.slice(0);
        quantityClone.splice(index + 1, 0, emptyQuantity());
        this.providerTask.quantity = quantityClone;
      } else if (len === index) {
        this.providerTask.quantity.push(emptyQuantity());
      }
    },
    onUnitDelete(index) {
      const len = this.providerTask.quantity.length;
      if (index >= 0 && len > index && len > 1) {
        const quantityClone = this.providerTask.quantity.slice(0);
        quantityClone.splice(index, 1);
        this.providerTask.quantity = quantityClone;
      }
    },
    showNotes() {
      const event = {
        canEditTask: this.canEditOwnTask,
        canEditAll: this.canEditAll,
        canEditNow: this.canEditNow,
        isApprovedOrCancelled: this.isApprovedOrCancelled,
        lockPreviouslyCompleted: this.lockPreviouslyCompleted,
        providerTaskId: this.providerTask._id,
        notes: this.providerTask.notes,
      };
      this.$emit('workflow-note-edit', event);
    },
    _setProviderTask(newValue) {
      if (newValue && newValue.provider
        && (newValue.provider.firstName !== undefined || newValue.provider.name !== undefined)) {
        // only assign if provider has a firstName property
        this.previousProvider = newValue.provider;
      }
    },
    onAnalysisImportClick(analysisType) {
      const isDetailsEmpty = analysisType === ANALYSIS_IMPORT_TYPE_INVOICE
        ? this.isInvoiceTransactionDetailsEmpty
        : this.isBillTransactionDetailsEmpty;
      const sectionName = analysisType === ANALYSIS_IMPORT_TYPE_INVOICE ? 'Invoice' : 'Bill';
      if (!isDetailsEmpty) {
        this.$emit('show-confirm-dialog', {
          handler: (result) => {
            if (!result.confirm) {
              return;
            }
            this.pickAnalysisFileForImport(analysisType);
          },
          message: `You are about to replace existing values in the Fuzzy Matches in the ${sectionName} section with ones from the uploaded file. Are you sure you want to do this?`,
          title: 'Warning',
          cancelText: 'Cancel',
        });
      } else {
        this.pickAnalysisFileForImport(analysisType);
      }
    },
    pickAnalysisFileForImport(analysisType) {
      this.analysisImportTypeSelected = analysisType;
      if (!_.isNil(this.$refs.analysisFile)) {
        this.$refs.analysisFile.click();
      }
    },
    updateTransactionDetailPart(fullDetail, detailPart, partName) {
      if (!_.isNil(fullDetail)) {
        if (!_.isNil(detailPart)) {
          return { ...fullDetail, [partName]: detailPart };
        }
        const fullDetailWithoutPart = _.omit(fullDetail, partName);
        return Object.assign(emptyGenericTransaction(), fullDetailWithoutPart);
      }
      return _.set(emptyGenericTransaction(), partName, detailPart);
    },
    applyImportedAnalysis(importedTransactionDetails) {
      if (_.isNil(importedTransactionDetails)) {
        return;
      }
      const transactionDetails = _.cloneDeep(_.get(this, 'providerTask.transactionDetails', []));
      const transactionDetailsToPreserve = _.clone(transactionDetails)
        .filter((detail) => !_.isEmpty(_.get(detail, `${this.analysisImportTypeSelected}.breakdown.name`, '')));
      const newTransactionDetails = [];
      importedTransactionDetails.forEach((importedDetail, index) => {
        const currentDetail = transactionDetails[index];
        const newDetail = this.updateTransactionDetailPart(
          currentDetail,
          importedDetail,
          this.analysisImportTypeSelected,
        );
        newTransactionDetails.push(newDetail);

        const oldBreakdownIndex = _.findIndex(transactionDetailsToPreserve, [
          `${this.analysisImportTypeSelected}.breakdown.name`,
          _.get(importedDetail, 'breakdown.name'),
        ]);
        if (oldBreakdownIndex >= 0) {
          transactionDetailsToPreserve.splice(oldBreakdownIndex, 1);
        }
      });

      for (
        let i = importedTransactionDetails.length, j = 0;
        i < transactionDetails.length || j < transactionDetailsToPreserve.length;
        i++, j++
      ) {
        const detailLeft = transactionDetails[i];
        const detailToPreserve = transactionDetailsToPreserve[j];
        const newDetail = this.updateTransactionDetailPart(
          detailLeft,
          _.get(detailToPreserve, this.analysisImportTypeSelected),
          this.analysisImportTypeSelected,
        );
        newTransactionDetails.push(newDetail);
      }
      this.analysisImportTypeSelected = '';
      this.providerTask.transactionDetails = newTransactionDetails;
    },
    async onAnalysisImportFileChange(event) {
      const analysisFile = _.get(event, 'target.files[0]', null);
      if (_.isNil(analysisFile) || _.isEmpty(this.analysisImportTypeSelected)) {
        return;
      }
      this.$refs.analysisFile.value = null;
      const importedTransactionDetails = await workflowProviderTaskService.generateTransactionDetails(
        analysisFile,
        this.breakdowns,
        this.analysisImportTypeSelected,
      );
      this.applyImportedAnalysis(importedTransactionDetails);
    },
    retrieveProviderMinCharge(filters) {
      const {
        vendorId, ability, sourceLanguage, targetLanguage,
      } = filters;
      const params = { vendorId };
      if (!_.isEmpty(ability)) {
        params.ability = ability;
      }
      if (!_.isEmpty(sourceLanguage) && !_.isEmpty(targetLanguage)) {
        params.languageCombination = `${sourceLanguage} - ${targetLanguage}`;
      }
      vendorMinimumChargeService.retrieveProviderMinimumCharge(params).then((response) => {
        this.providerTask.minCharge = _.get(response, 'body.data.providerMinimumCharge.rate', 0);
      }).catch(() => {
        this.providerTask.minCharge = 0;
      });
    },
    retrieveProviderRates(providerId, billIndex) {
      userService.retrieveProviders({ id: providerId }).then((res) => {
        this.providerRates = {
          billIndex,
          provider: providerId,
          value: _.get(res, 'data.user.vendorDetails.rates', []),
        };
      }).catch(() => {
        this.providerRates = {
          billIndex,
          provider: providerId,
          value: [],
        };
      });
    },
    onNewRatesRequest(billIndex) {
      const providerId = _.get(this.providerTask, 'provider._id');
      if (!_.isEmpty(providerId)) {
        this.retrieveProviderRates(providerId, billIndex);
      }
    },
    isStatusOptionFiltered(option) {
      return option.value !== STATUSES.approved;
    },
    filterStatusOption(option) {
      if (option.value === STATUSES.approved) {
        return this.canApprove;
      }
      if (option.value === STATUSES.completed) {
        return this.canComplete;
      }
      return true;
    },
    async parseBill({
      file,
      csvType,
      statistics,
      shouldImportPortalCat,
    }) {
      let parsedBillDetails = [];
      const rates = await this.getVendorRates();
      try {
        if (shouldImportPortalCat) {
          parsedBillDetails = await this.importPortalCAT(statistics);
        } else {
          parsedBillDetails = await this.importCsvFile(file, csvType);
        }
      } catch (err) {
        this.pushNotification(errorNotification(err.message, null, err));
        return;
      }
      const clonedProviderTask = _.cloneDeep(this.providerTask);
      const activeBillDetails = this.providerTask.billDetails
        .map((activeBillDetail) => {
          const billDetailIndex = parsedBillDetails.findIndex((billDetail) => _.get(billDetail, 'breakdown.name') === _.get(activeBillDetail, 'breakdown.name'));
          if (billDetailIndex >= 0) {
            _.set(activeBillDetail, 'quantity', _.get(parsedBillDetails[billDetailIndex], 'quantity', 0));
          }
          if (!_.isEmpty(rates)) {
            const {
              breakdown: { name: breakdown },
              translationUnit: { name: translationUnit },
            } = activeBillDetail;
            const filters = {
              ability: this.ability,
              breakdown,
              translationUnit,
              sourceLanguage: this.workflowSrcLang,
              targetLanguage: this.workflowTgtLang,
              company: this.company,
              internalDepartment: _.get(this, 'request.internalDepartment'),
              catTool: _.get(this, 'request.catTool'),
            };
            const billPopulated = getProviderMatchingRateDetail(filters, rates);
            const unitPrice = _.get(billPopulated, 'price', 0);
            _.set(activeBillDetail, 'unitPrice', unitPrice);
          }
          return activeBillDetail;
        });
      clonedProviderTask.billDetails = activeBillDetails;
      this.providerTask = clonedProviderTask;
    },
    async importCsvFile(file, csvType) {
      return billCsvParser.parse(file, csvType, this.breakdowns);
    },
    async importPortalCAT(statistics) {
      const breakdownMap = {
        '101%': 'match101',
        '100%': 'match100',
        '95-99%': 'match95to99',
        '85-94%': 'match85to94',
        '75-84%': 'match75to84',
        'No Match': 'noMatch',
        Repetitions: 'repetitions',
      };
      const billDetails = Object.keys(breakdownMap)
        .map((matchName) => {
          const foundBreakdown = _.pick(this.breakdowns.find((breakdown) => breakdown.name === matchName), ['_id', 'name']);
          if (_.isEmpty(foundBreakdown)) {
            throw new Error(`Breakdown '${matchName}' is not available.`);
          }
          const billDetail = emptyBillDetail();
          _.set(billDetail, 'breakdown', foundBreakdown);
          const matchKey = breakdownMap[matchName];
          _.set(billDetail, 'quantity', _.get(statistics, `${matchKey}.numWords`));
          return billDetail;
        });
      return billDetails;
    },
    async getVendorRates() {
      let rates = [];
      try {
        const vendorId = _.get(this.taskProvider, '_id', '');
        if (!_.isEmpty(vendorId)) {
          const response = await userService
            .getVendorRates(vendorId);
          rates = _.get(response, 'data.rates', []);
        }
      } catch (error) {
        const message = _.get(error, 'message', 'Failed to retrieve vendor rates');
        const notification = {
          title: 'Error',
          message,
          state: 'danger',
          response: null,
        };
        this.pushNotification(notification);
      }
      return rates;
    },
    onSetBillUnitPrice({ index, price }) {
      this.billUnitPriceDeterminant.push(price);
      this.providerTask.billDetails[index].unitPrice = price;
      if (this.billUnitPriceDeterminant.length < this.providerTask.billDetails.length) return;
      const hasAnyRateMatch = this.billUnitPriceDeterminant.some((p) => p > 0);
      this.billUnitPriceDeterminant = [];
      if (hasAnyRateMatch) return;
      this.providerTask.provider = null;
    },
  },
};
