import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import CompanyMinChargeService from '../../../services/company-minimum-charge-service';
import WorkflowOriginalValueMixin from './workflow-original-value-mixin.js';
import WorkflowProviderTaskDetail from './workflow-provider-task-detail.vue';
import {
  emptyProviderTask,
  emptyInvoiceDetail,
  emptyQuantity,
  emptyAbilitySelected,
  emptyBillDetail,
  emptyTask,
} from '../../../utils/workflow/workflow-helpers';
import { hasRole } from '../../../utils/user';
import AbilityAjaxBasicSelect from '../../ability-ajax-basic-select/ability-ajax-basic-select.vue';
import TaskInvoice from './task-invoice.vue';
import TaskProjectedCost from './task-projected-cost.vue';
import TaskService from '../../../services/task-service';
import UserRoleCheckMixin from '../../../mixins/user-role-check';
import InvoiceCsvParser from '../../../services/csv-parser/invoice-csv-parser';
import ImportAnalysisButton from '../../../components/home/import-analysis/import-analysis-button.vue';
import WorkflowTaskDetailMixin from './workflow-task-detail-mixin';
import { errorNotification } from '../../../utils/notifications';

const invoiceCsvParser = new InvoiceCsvParser();
const WORKFLOW_TASK_STATUSES = TaskService.workflowTaskStatuses;
const VALIDATION_DELIVERY = 'Validation and Delivery';
const CUSTOM_LISTENERS = [
  'input',
  'task-delete',
  'task-add',
  'provider-task-note',
  'workflow-file-show',
  'workflow-note-edit',
  'task-move',
  'taskDelete',
  'taskAdd',
  'taskMove',
  'providerTaskNote',
  'workflowFileShow',
  'workflowNoteEdit',
];
const CUSTOM_PROPS = ['value', 'abilities', 'task-index'];
const companyMinChargeService = new CompanyMinChargeService();
const CONTACT_USER_TYPE = 'Contact';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const PROVIDER_TASK_CANCELLED_STATUS = 'cancelled';
const PROVIDER_TASK_COMPLETED_STATUS = 'completed';

export default {
  mixins: [
    WorkflowOriginalValueMixin,
    UserRoleCheckMixin,
    WorkflowTaskDetailMixin,
  ],
  components: {
    WorkflowProviderTaskDetail,
    AbilityAjaxBasicSelect,
    TaskInvoice,
    TaskProjectedCost,
    ImportAnalysisButton,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    // passed from workflow-detail via v-bind
    abilities: {
      type: Array,
      default: () => [],
    },
    breakdowns: {
      type: Array,
      default: () => [],
    },
    translationUnits: {
      type: Array,
      default: () => [],
    },
    currencies: {
      type: Array,
      default: () => [],
    },
    // passed from workflow-detail via v-bind
    companyRates: {
      type: Array,
      default: () => [],
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
    previousTask: Object,
    // passed to workflow-provider-task-detail via v-bind
    isFollowingTaskStarted: {
      type: Boolean,
      default: true,
    },
    // passed to workflow-provider-task-detail via v-bind
    isForeignCurrencyRequest: {
      type: Boolean,
    },
    originalWorkflow: {
      type: Object,
    },
    workflow: {
      type: Object,
    },
    // passed from workflow-detail via v-bind
    requestDeliveryDate: {
      type: String,
    },
    // passed from workflow-detail via v-bind
    requestId: {
      type: String,
    },
    // passed to workflow-provider-task-detail via v-bind
    request: {
      type: Object,
    },
    originalRequest: {
      type: Object,
    },
    // passed to workflow-provider-task-detail via v-bind
    workflowId: {
      type: String,
    },
    workflowSubtotals: {
      type: Object,
    },
    loadComponents: {
      type: Boolean,
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
    taskIndex: {
      type: Number,
    },
    hasApprovedCancelledTasks: {
      type: Boolean,
      default: false,
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
      srcLangChangedToOriginal: false,
      tgtLangChangedToOriginal: false,
      taskDescription: '',
      workflowTgtLang: '',
      workflowSrcLang: '',
      task: {
        _id: '',
        ability: null,
        description: '',
        status: '',
        invoiceDetails: [],
        includedInGroup: false,
        providerTasks: [emptyProviderTask()],
        total: 0,
      },
      originalValue: emptyTask(),
      abilitySelected: emptyAbilitySelected(),
      unitPriceFilter: {
        ability: {
          text: '',
        },
        breakdown: {
          text: '',
          value: null,
        },
        translationUnit: {
          text: '',
          value: null,
        },
        workflowLanguage: '',
        companyDepartmentsIds: [],
        requestInternalDepartmentId: '',
      },
      userIsContact: false,
    };
  },
  watch: {
    'request.quoteCurrency._id'() {
      this.getCompanyMinCharge();
    },
    'abilitySelected.value': function (newValue) {
      if (_.isEmpty(newValue)) {
        this.task.ability = null;
      } else if (newValue !== this.task.ability) {
        this.task.ability = newValue;
      }
    },
    abilities() {
      this.setAbility();
    },
    value(newValue) {
      this.addOrRemoveDefaultInvoiceDetails(newValue);
      this.task = newValue;
      this.taskDescription = this.task.description;
      this.workflowSrcLang = _.get(this, 'workflow.srcLang.name', '');
      this.workflowTgtLang = _.get(this, 'workflow.tgtLang.name', '');
      this.setAbility();
    },
    'task.invoiceDetails': {
      handler: function () {
        this.$emit('workflow-totals-update');
      },
      deep: true,
    },
    'task.total': function () {
      this.$emit('workflow-totals-update');
    },
    'task.ability': {
      handler(newAbility, oldAbility) {
        if (newAbility !== oldAbility) {
          this.taskDescription = _.get(this, 'abilitySelected.description', '');
          this.$emit('input', this.task);
          if (this.isTaskIncludedInGroup && oldAbility) {
            this.$emit('task-in-group-toggle', this.taskIndex);
          }
          this.fetchTaskProgress();
        }
      },
      deep: true,
    },
    taskDescription: function (newValue) {
      this.task.description = newValue;
      this.$emit('input', this.task);
    },
    'task.providerTasks'() {
      const { invoiced, partiallyInvoiced } = WORKFLOW_TASK_STATUSES;
      if ([invoiced, partiallyInvoiced].includes(this.task.status)) {
        return;
      }
      if (
        this.areAllProviderTasksApproved
        || (this.hasApprovedProviderTask && this.areAllProviderTasksApprovedOrCancelled)
      ) {
        this.task.status = WORKFLOW_TASK_STATUSES.approved;
      } else if (this.areAllProviderTasksCancelled) {
        this.task.status = WORKFLOW_TASK_STATUSES.cancelled;
      } else {
        this.task.status = WORKFLOW_TASK_STATUSES.pending;
      }
    },
    'task.status': function (newStatus, oldStatus) {
      if (newStatus !== oldStatus) {
        this.$emit('input', this.task);
      }
    },
    'workflow.srcLang': {
      handler: function (newValue, oldValue) {
        this.onLanguageChange('srcLang', newValue, oldValue);
      },
    },
    'workflow.tgtLang': {
      handler: function (newValue, oldValue) {
        this.onLanguageChange('tgtLang', newValue, oldValue);
      },
    },
    areAllProviderTasksCancelled(areCancelled) {
      if (areCancelled) this.cancelTask();
    },
    abilitySelected(newAbility, oldAbility) {
      const newAbilityValue = _.get(newAbility, 'value');
      const oldAbilityValue = _.get(oldAbility, 'value');
      if (newAbilityValue !== oldAbilityValue && (this.isNew || !_.isEmpty(oldAbilityValue))) {
        this.getCompanyMinCharge();
        if (this.originalValue && this.originalValue.ability === newAbilityValue) {
          // restores the original values
          // FIXME: Currently if any provider task has changed it will restore with the
          // server's version but not the working copy.
          // We clone the object to avoid having the same instance in value and originalValue.
          this.$emit('input', _.cloneDeep(this.originalValue));
        } else {
          // when the ability changes, clear all provider task values
          // cloning the array but not the inner objects
          const providerTaskArrayClone = this.task.providerTasks.slice(0);
          providerTaskArrayClone.forEach((pt) => {
            pt.files = [];
            pt.provider = null;
            pt.notes = '';
            _.forEach(pt.quantity, (q) => {
              Object.assign(q, emptyQuantity());
            });
          });
          this.task.providerTasks = providerTaskArrayClone;
        }
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isAnySectionVisible() {
      const invoiceVisible = _.get(this, 'toggledSections.invoiceVisible');
      const projectedCostVisible = _.get(this, 'toggledSections.projectedCostVisible');
      const billVisible = _.get(this, 'toggledSections.billVisible');
      return invoiceVisible || projectedCostVisible || billVisible;
    },
    isOwnTask() {
      const providerTasks = _.get(this.task, 'providerTasks', []);
      const userId = _.get(this.userLogged, '_id', '');
      return providerTasks.some(providerTask =>
        _.get(providerTask, 'provider._id', providerTask.provider) === userId);
    },
    canReadRegulatoryFieldsOfTask() {
      return this.canReadRegulatoryFieldsOfWorkflow ||
        (this.hasRole('TASK-REGULATORY-FIELDS_READ_OWN') && this.isOwnTask);
    },
    canCreateAllRequest() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    canUploadMemoq() {
      return !this.areAllProviderTasksApprovedOrCancelled;
    },
    canReadFinancialSections() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL');
    },
    canReadProjectedCost() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL') && !this.userIsContact;
    },
    providerTasks() {
      return _.get(this.task, 'providerTasks', []);
    },
    taskAbility() {
      return _.get(this.task, 'ability', '');
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    hasFilesUploaded() {
      return _.get(this, 'task.providerTasks', [])
        .some((pt) => _.get(pt, 'files', []).length > 0);
    },
    isTaskStatusPending() {
      const status = _.get(this.task, 'status', WORKFLOW_TASK_STATUSES.pending);
      return status === WORKFLOW_TASK_STATUSES.pending;
    },
    canEditTask() {
      return this.isTaskStatusPending && this.canEditAll;
    },
    isAbilitySelectDisabled() {
      if (this.hasApprovedCompletedProviderTasks) {
        return true;
      }
      return this.taskAbility === VALIDATION_DELIVERY && this.hasFilesUploaded;
    },
    isAbilityValid() {
      return !_.isEmpty(_.get(this, 'abilitySelected.value', ''));
    },
    canReadAll() {
      return ['WORKFLOW_READ_ALL', 'TASK_READ_ALL'].some((r) => hasRole(this.userLogged, r));
    },
    areAllProviderTasksApprovedOrCancelled() {
      const statuses = [PROVIDER_TASK_APPROVED_STATUS, PROVIDER_TASK_CANCELLED_STATUS];
      return _.every(
        this.task.providerTasks,
        (providerTask) => statuses.some((status) => status === providerTask.status),
      );
    },
    hasApprovedProviderTask() {
      return this.task.providerTasks.some((providerTask) => providerTask.status === PROVIDER_TASK_APPROVED_STATUS);
    },
    allApprovedCompletedTasks() {
      return this.task.providerTasks.every((providerTask) => [PROVIDER_TASK_APPROVED_STATUS, PROVIDER_TASK_COMPLETED_STATUS]
        .includes(providerTask.status));
    },
    areAllProviderTasksApproved() {
      return _.every(this.providerTasks, (pTask) => _.capitalize(pTask.status) === _.capitalize(PROVIDER_TASK_APPROVED_STATUS));
    },
    areAllProviderTasksCancelled() {
      return _.every(this.providerTasks, (pTask) => _.capitalize(pTask.status) === _.capitalize(PROVIDER_TASK_CANCELLED_STATUS));
    },
    hasApprovedCompletedProviderTasks() {
      return this.task.providerTasks.some((providerTask) => [PROVIDER_TASK_APPROVED_STATUS, PROVIDER_TASK_COMPLETED_STATUS]
        .includes(providerTask.status));
    },
    canEditStatus() {
      return ['WORKFLOW_UPDATE_ALL', 'TASK-FINANCIAL_UPDATE_ALL'].some((r) => this.hasRole(r));
    },
    canReadTaskDescription() {
      return this.hasRole('WORKFLOW_READ_ALL');
    },
    canReadTaskStatus() {
      return this.hasRole('WORKFLOW_READ_ALL');
    },
    isNew() {
      return _.isEmpty(this.task._id);
    },
  },
  created() {
    this.emptyAbilitySelectedOption = { text: '', value: emptyAbilitySelected() };
    this.task = _.cloneDeep(this.value);
    this.userIsContact = this.userLogged.type === CONTACT_USER_TYPE;
    this.addOrRemoveDefaultInvoiceDetails();
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onLanguageChange(type, newValue, oldValue) {
      const newIsoCode = _.get(newValue, 'isoCode', '');
      const oldIsoCode = _.get(oldValue, 'isoCode', null);
      let originalIsoCode;
      if (type === 'srcLang') {
        originalIsoCode = _.get(this, 'originalWorkflow.srcLang.isoCode');
        this.srcLangChangedToOriginal = (newIsoCode !== oldIsoCode && !_.isNil(oldIsoCode)
          && (newIsoCode === originalIsoCode));
        this.workflowSrcLang = newValue.name;
      } else {
        originalIsoCode = _.get(this, 'originalWorkflow.tgtLang.isoCode');
        this.tgtLangChangedToOriginal = (newIsoCode !== oldIsoCode
          && !_.isNil(oldIsoCode) && (newIsoCode === originalIsoCode));
        this.workflowTgtLang = newValue.name;
      }
      if (this.areAllProviderTasksCancelled) {
        return;
      }
      if (newIsoCode !== oldIsoCode) {
        this.getCompanyMinCharge();
      }
    },
    addOrRemoveDefaultInvoiceDetails(newValue) {
      newValue = _.defaultTo(newValue, this.task);
      if (!this.canReadFinancialSections) {
        _.unset(newValue, 'invoiceDetails');
      } else if (_.isEmpty(newValue.invoiceDetails)) {
        const newInvoiceDetail = emptyInvoiceDetail();
        const invoiceDetails = _.get(newValue, 'invoiceDetails', []);
        invoiceDetails.push(newInvoiceDetail);
        newValue.invoiceDetails = invoiceDetails;
      }
    },
    getCompanyMinCharge() {
      if (!_.get(this, 'toggledSections.invoiceVisible', false)) {
        return;
      }
      if (!_.isNil(this.company)
        && !_.isEmpty(this.task.ability)) {
        const filters = {
          company: this.company,
          ability: this.task.ability,
          currencyId: _.get(this, 'request.quoteCurrency._id'),
        };
        Object.assign(filters, {
          languageCombination: `${this.workflowSrcLang} - ${this.workflowTgtLang}`,
        });
        return companyMinChargeService.getMinCharge(filters)
          .then((response) => {
            this.task.minCharge = _.toNumber(_.get(response, 'data.minCharge', 0));
            this.$emit('workflow-totals-update');
          });
      }
    },
    setAbility() {
      if (!_.isEmpty(this.task.ability)) {
        if (_.isEmpty(this.abilities)) {
          return;
        }
        const ability = this.abilities.find(({ value }) => value === this.task.ability);
        if (!_.isNil(ability)) {
          this.abilitySelected = ability;
        }
      }
    },
    onAbilitySelect(newValue) {
      this.abilitySelected = newValue;
    },
    cancelTask() {
      Object.assign(this.task, {
        status: WORKFLOW_TASK_STATUSES.cancelled,
        total: 0.00,
        minCharge: 0.00,
      });
    },
    cloneProviderTask(providerTask) {
      providerTask.taskDueDate = this.requestDeliveryDate;
      if (this.canReadFinancialSections) {
        const lastProviderTask = _.cloneDeep(_.last(this.task.providerTasks));
        const lastProviderTaskBillDetails = lastProviderTask.billDetails.map((b) => {
          b.quantity = 0;
          b.unitPrice = 0;
          return b;
        });
        providerTask.billDetails = lastProviderTaskBillDetails;
      }
    },
    onProviderAdd(index) {
      const len = this.task.providerTasks.length;
      const newProviderTask = emptyProviderTask();
      this.cloneProviderTask(newProviderTask);
      if (index >= 0 && len > index) {
        // clone the array but not the inner objects
        const providerTaskArrayClone = _.cloneDeep(this.task.providerTasks.slice(0));
        providerTaskArrayClone.splice(index + 1, 0, newProviderTask);
        this.task.providerTasks = providerTaskArrayClone;
        if (_.capitalize(this.task.status) === _.capitalize(PROVIDER_TASK_CANCELLED_STATUS)) {
          this.task.status = WORKFLOW_TASK_STATUSES.pending;
          this.getCompanyMinCharge();
        }
      } else if (len === index) {
        this.task.providerTasks.push(newProviderTask);
      }
    },
    onProviderDelete(index) {
      const len = this.task.providerTasks.length;
      if (index >= 0 && len > index && len > 1) {
        // clone the array but not the inner objects
        const providerTaskArrayClone = this.task.providerTasks.slice(0);
        providerTaskArrayClone.splice(index, 1);
        this.task.providerTasks = providerTaskArrayClone;
      }
    },
    onProviderTaskUpdate(index, event) {
      // arrays must be updated using $set
      this.$set(this.task.providerTasks, index, event);
      // when provider updates trigger notify the workflow-detail by sending
      // the input event
      this.$emit('input', this.task);
    },
    onProviderTaskStatusUpdate(newStatus) {
      if (newStatus === PROVIDER_TASK_CANCELLED_STATUS) return;
      this.getCompanyMinCharge();
    },
    onWorkflowFileShow(providerTaskIndex, event) {
      event.providerTaskIndex = providerTaskIndex;
      event.canEditAll = this.canEditAll;
      event.taskId = this.task._id;
      this.$emit('workflow-file-show', event);
    },
    onWorkflowNoteEdit(providerTaskIndex, event) {
      event.providerTaskIndex = providerTaskIndex;
      event.taskId = this.task._id;
      this.$emit('workflow-note-edit', event);
    },
    onDocumentUpload(isUploading) {
      this.$emit('document-upload', isUploading);
    },
    addTask() {
      this.$emit('task-add');
    },
    deleteTask() {
      if (this.workflow.tasks.length > 1) {
        this.$emit('task-delete');
      }
    },
    onUnitPriceFilterChange(newValue) {
      this.unitPriceFilter = newValue;
    },
    moveTask(direction) {
      this.$emit('task-move', direction);
    },
    formatAbilitySelectedOption: (option) => ({
      text: _.get(option, 'text', ''),
      value: option,
    }),
    onInvoiceDetailAdd(index) {
      const len = this.task.invoiceDetails.length;
      const newInvoiceDetail = emptyInvoiceDetail();
      if (index > 0 && len > index && len >= 0) {
        const invoiceDetailsClone = this.task.invoiceDetails.slice(0);
        invoiceDetailsClone.splice(index + 1, 0, newInvoiceDetail);
        this.task.invoiceDetails = invoiceDetailsClone;
      } else {
        this.task.invoiceDetails.push(newInvoiceDetail);
      }
      this.task.providerTasks.forEach((p) => {
        p.billDetails.push(emptyBillDetail());
      });
      this.$emit('input', this.task);
    },
    onInvoiceDetailDelete(key) {
      const len = this.task.invoiceDetails.length;
      if (len > 1) {
        const invoiceDetailsClone = this.task.invoiceDetails.slice(0);
        const index = this.task.invoiceDetails.findIndex((i) => i.invoice.key === key);
        invoiceDetailsClone.splice(index, 1);
        const { providerTasks } = this.task;
        providerTasks.forEach((p) => {
          const billDetailsClone = p.billDetails.slice(0);
          billDetailsClone.splice(index, 1);
          p.billDetails = billDetailsClone;
        });
        this.task.invoiceDetails = invoiceDetailsClone;
        this.task.providerTasks = providerTasks;
        this.$emit('input', this.task);
      }
    },
    hideTaskDescription() {
      if (this.$refs.descriptionModal) {
        this.$refs.descriptionModal.hide();
      }
    },
    showTaskDescription() {
      if (this.$refs.descriptionModal) {
        this.$refs.descriptionModal.show();
      }
    },
    async parseInvoice({
      file,
      csvType,
      statistics,
      shouldImportPortalCat }) {
      let parsedInvoiceDetails = [];
      try {
        if (shouldImportPortalCat) {
          parsedInvoiceDetails = await this.importPortalCAT(statistics);
        } else {
          parsedInvoiceDetails = await this.importCsvFile(file, csvType);
        }
      } catch (err) {
        this.pushNotification(errorNotification(err.message, null, err));
        return;
      }
      this.task.invoiceDetails.forEach((invoiceDetail) => {
        const parsedInvoiceDetailIdx = parsedInvoiceDetails.findIndex(parsedInvoiceDetail => _.get(invoiceDetail, 'invoice.breakdown.name') ===
            _.get(parsedInvoiceDetail, 'invoice.breakdown.name')
        );
        if (parsedInvoiceDetailIdx >= 0 && _.get(invoiceDetail, 'invoice.pdfPrintable', false)) {
          _.set(parsedInvoiceDetails[parsedInvoiceDetailIdx], 'invoice.pdfPrintable', true);
        }
      });
      this.task.invoiceDetails = parsedInvoiceDetails;
      const providerTasks = this.task.providerTasks.map((providerTask) => {
        const billDetails = parsedInvoiceDetails.map((invoiceDetail) => {
          let billDetail = providerTask.billDetails
            .find(bill => _.get(bill, 'breakdown.name') ===
              _.get(invoiceDetail, 'invoice.breakdown.name'));
          if (_.isEmpty(billDetail)) {
            billDetail = emptyBillDetail();
            _.set(billDetail, 'breakdown._id', _.get(invoiceDetail, 'invoice.breakdown._id'));
            _.set(billDetail, 'breakdown.name', _.get(invoiceDetail, 'invoice.breakdown.name'));
          }
          return billDetail;
        });
        providerTask.billDetails = billDetails;
        return providerTask;
      });
      this.task.providerTasks = providerTasks;
    },
    async importCsvFile(file, csvType) {
      const wordsUnit = this.getUnit('Words');
      const parsedInvoiceDetails = await invoiceCsvParser
        .parse(file, csvType, wordsUnit, this.breakdowns);
      return parsedInvoiceDetails;
    },
    async importPortalCAT(statistics) {
      const wordsUnit = this.getUnit('Words');
      const breakdownMap = {
        '101%': 'match101',
        '100%': 'match100',
        '95-99%': 'match95to99',
        '85-94%': 'match85to94',
        '75-84%': 'match75to84',
        'No Match': 'noMatch',
        Repetitions: 'repetitions',
      };
      const invoiceDetails = Object.keys(breakdownMap)
        .map((matchName) => {
          const foundBreakdown = _.pick(this.breakdowns.find(breakdown => breakdown.name === matchName), ['_id', 'name']);
          const invoiceDetail = emptyInvoiceDetail();
          if (_.isEmpty(foundBreakdown)) {
            throw new Error(`Breakdown '${matchName}' is not available.`);
          }
          _.set(invoiceDetail, 'invoice.breakdown', foundBreakdown);
          _.set(invoiceDetail, 'invoice.translationUnit', wordsUnit);
          const matchKey = breakdownMap[matchName];
          _.set(invoiceDetail, 'invoice.quantity', _.get(statistics, `${matchKey}.numWords`));
          return invoiceDetail;
        });
      return invoiceDetails;
    },
    getUnit(name) {
      return this.translationUnits
        .find((unit) => !_.isEmpty(unit.name) && unit.name.toLowerCase() === name.toLowerCase());
    },
    showAnalysisModal(parseFunc) {
      this.$emit('show-analysis-modal', parseFunc);
    },
    onWorkflowAssignTriggerModal(e) {
      this.$emit('workflow-assign-trigger-modal', e);
    },
    onWorkflowLinguisticTaskProviderSelected(e) {
      this.$emit('workflow-linguistic-task-provider-selected', e);
    },
    isLastProviderTask(index) {
      return index === this.task.providerTasks.length - 1;
    },
  },
};
