import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import { mapGetters, mapActions } from 'vuex';
import WorkflowService from '../../../services/workflow-service';
import WorkflowButtons from './workflow-buttons.vue';
import WorkflowDetail from './workflow-detail.vue';
import WorkflowDetailReadOnly from './workflow-detail-read-only.vue';
import WorkflowDetailContactView from './workflow-detail-contact-view.vue';
import WorkflowFilesDownload from './workflow-files-download.vue';
import WorkflowFilesModal from './modals/workflow-files-modal.vue';
import WorkflowNotesModal from './modals/workflow-notes-modal.vue';
import WorkflowAssignModal from './modals/workflow-assign-modal.vue';
import WorkflowAssignSegmentsEvenlyModal from './modals/workflow-assign-segments-evenly-modal.vue';
import WorkflowReflowModal from './modals/workflow-reflow-modal.vue';
import AbilityService from '../../../services/ability-service';
import CompanyService from '../../../services/company-service';
import BreakdownService from '../../../services/breakdown-service';
import TranslationUnitService from '../../../services/translation-unit-service';
import { hasRole } from '../../../utils/user';
import {
  emptyWorkflow, emptyWorkflowFiles, emptyWorkflowNote, isValidWorkflow, transformWorkflow,
} from '../../../utils/workflow/workflow-helpers';
import { extractChildArray, swapArrayElements } from '../../../utils/arrays';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import { errorNotification, successNotification } from '../../../utils/notifications';
import LocalStorageWorkflow from '../../../utils/workflow/local-storage-workflow';
import importAnalysisModal from '../import-analysis/import-analysis-modal.vue';
import { div } from '../../../utils/bigjs';
import { requestErrorMixin } from '../../../mixins/request-error-mixin';
import RequestService from '../../../services/request-service';
import PortalCatService from '../../../services/portalcat-service';
import { isActiveDocument } from '../list-request/request-inline-edit-helper';
import WorkflowTemplatesSection from './workflow-templates/workflow-templates-section.vue';

const requestStatuses = RequestService.mappedStatuses;
const VALID_CONTACT_READ_WORKFLOW_ROLES = ['CONTACT-WORKFLOW_READ_OWN', 'CONTACT-WORKFLOW_READ_COMPANY'];
const QUOTE_READ_ROLES = ['QUOTE_READ_OWN', 'QUOTE_READ_ALL'];
const READ_IMPORT_PIPLINES_ROLES = ['PIPELINE-RUN_UPDATE_ALL', 'PIPELINE_READ_ALL'];
const APPROVED_STATUS = 'approved';
const COMPLETED_STATUS = 'completed';
const abilityService = new AbilityService();
const companyService = new CompanyService();
const translationUnitService = new TranslationUnitService();
const breakdownService = new BreakdownService();
const CANCELLED_STATUS = 'cancelled';
const CONTACT_TYPE = 'Contact';
const VALID_WORKFLOW_EDITION_ADMIN_ROLES = [
  'WORKFLOW_UPDATE_ALL',
  'WORKFLOW_CREATE_ALL',
];
const VALID_WORKFLOW_EDITION_ROLES = [
  'WORKFLOW_UPDATE_OWN',
  'WORKFLOW_CREATE_OWN',
  'TASK_UPDATE_OWN',
];
const PORTALCAT_PIPELINE_STATUS_SUCCEEDED = 'succeeded';
const workflowService = new WorkflowService();
const portalCatService = new PortalCatService();

export default {
  mixins: [requestErrorMixin],
  components: {
    WorkflowButtons,
    WorkflowDetail,
    WorkflowDetailReadOnly,
    WorkflowDetailContactView,
    WorkflowFilesDownload,
    WorkflowFilesModal,
    WorkflowNotesModal,
    WorkflowAssignModal,
    WorkflowAssignSegmentsEvenlyModal,
    WorkflowReflowModal,
    ConfirmDialog,
    importAnalysisModal,
    WorkflowTemplatesSection,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    isValidRequest: {
      type: Boolean,
    },
    areWorkflowsLoading: {
      type: Boolean,
    },
    isRequestWithoutWorkflowsValid: {
      type: Boolean,
    },
    editedWorkflowInd: {
      type: Number,
    },
    originalRequest: {
      type: Object,
    },
    isForeignCurrencyRequest: {
      type: Boolean,
    },
    hasRequestChanged: {
      type: Boolean,
      default: false,
    },
    pcErrors: {
      type: Array,
      default: () => [],
    },
    saveRequest: {
      type: Function,
      default: () => {},
    },
    isPortalCat: {
      type: Boolean,
      default: false,
    },
    isCatImportRunning: {
      type: Boolean,
      default: false,
    },
    isUserIpAllowed: {
      type: Boolean,
      default: false,
    },
    // passed
    requestAnalysis: {
      type: Array,
      default: (() => []),
    },
  },
  data() {
    return {
      workflowTotals: {
        invoice: 0,
        bill: 0,
        projectedCost: 0,
        workflowSubTotal: 0,
      },
      areEntitiesLoading: false,
      areUsersLoading: false,
      dataLoaded: false,
      workflowTaskFilesModalState: false,
      abilities: [],
      abilityList: [],
      translationUnits: [],
      breakdowns: [],
      toggledSections: {
        invoiceVisible: true,
        projectedCostVisible: true,
        billVisible: true,
      },
      downloadingDocs: [],
      workflowsCollapsed: [],
      request: {
        _id: null,
        company: null,
        status: '',
        tgtLangs: [],
        workflows: [],
      },
      workflowFiles: emptyWorkflowFiles(),
      workflowNote: emptyWorkflowNote(),
      workflowsSelected: [],
      companyRates: [],
      confirmDialogOptions: {
        title: '',
        handler: null,
        message: '',
        cancelText: 'Cancel',
      },
      isAnalysisModalVisible: false,
      parseFunc: () => {},
      editedWorkflowIndex: null,
      hasWorkflowChanged: false,
      segmentsModalData: null,
      assignSegmentsEvenlyModalData: null,
      workflowReflowModalData: null,
      areWorkflowImportedFilesLoading: false,
      workflowImportedFiles: [],
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        // The reason I'm doing this is to force vuejs
        // to create observers on new properties.
        // otherwise it will only observe the workflows array.
        // the first time request received
        this.$set(this, 'request', newValue);
      },
    },
    hasWorkflowChanged(value) {
      this.$emit('workflow-changed', value);
    },
    editedWorkflowIndex(newValue) {
      this.$emit('workflow-update', newValue);
      if (!_.isNil(newValue)) {
        const workflowId = _.get(this.workflows, `[${newValue}]._id`);
        this.getWorkflowImportedFiles(workflowId);
      }
    },
    isValid(isValid) {
      this.$emit('workflows-validation', isValid);
    },
    'request.workflows': function () {
      this.$emit('input', this.request);
    },
    isLoading(value) {
      if (this.areWorkflowsLoading !== value) {
        this.onWorkflowsLoading(value);
      }
    },
    editedWorkflowInd(newValue) {
      this.editedWorkflowIndex = newValue;
    },
    'request.status': {
      handler(newStatus) {
        // FIXME upon marking the request as cancelled all provider tasks are cancelled
        // but if the user regrets this action, the frontend will not put the provider
        // tasks status to the original values.
        if (newStatus === CANCELLED_STATUS && this.workflows) {
          this.workflows.forEach((w) => {
            if (w.tasks) {
              w.tasks.forEach((t) => {
                if (t.providerTasks) {
                  const newProvTasks = t.providerTasks
                    .map((pt) => ({ ...pt, status: CANCELLED_STATUS }));
                  // update all provider tasks and set it state to cancelled.
                  t.providerTasks = newProvTasks;
                }
              });
            }
          });
        }
      },
    },
  },
  created() {
    this.workflowTotals = {
      invoice: _.toNumber(this.request.invoiceTotal),
      projectedCost: _.toNumber(this.request.projectedCostTotal),
      bill: _.toNumber(this.request.billTotal),
    };
    this.localStorageWorkflow = new LocalStorageWorkflow(this.userLogged.sessionUUID);
    this.expandWorkflows();
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'getExchangeRate', 'localCurrency']),
    hasUndeletableSelectedWorkflows() {
      if (this.isRequestCompleted) {
        return true;
      }
      return _.some(this.workflowsSelected, (index) => {
        const workflow = this.workflows[index];
        if (!_.isNil(workflow) && !_.isNil(workflow.tasks)) {
          return _.some(workflow.tasks, (t) => _.some(t.providerTasks, (p) => [APPROVED_STATUS, COMPLETED_STATUS].some((s) => s === p.status)));
        }
        return false;
      });
    },
    quoteCurrency() {
      return _.get(this.request, 'quoteCurrency.isoCode', 'USD');
    },
    requestSourceLanguageList() {
      return extractChildArray(this.request.languageCombinations, 'srcLangs');
    },
    requestTargetLanguageList() {
      return extractChildArray(this.request.languageCombinations, 'tgtLangs');
    },
    confirmDialogHandler() {
      return _.get(this, 'confirmDialogOptions.handler', null);
    },
    confirmDialogMessage() {
      return _.get(this, 'confirmDialogOptions.message', '');
    },
    confirmDialogTitle() {
      return _.get(this, 'confirmDialogOptions.title', '');
    },
    confirmDialogCancelText() {
      return _.get(this, 'confirmDialogOptions.cancelText', '');
    },
    isGrandTotalsVisible() {
      return this.canReadFinancialFields
        && !this.workflowContactView
        && !_.isEmpty(this.notDeletedWorkflows);
    },
    isLoading() {
      return this.areEntitiesLoading
              || this.areUsersLoading
              || this.areWorkflowImportedFilesLoading;
    },
    workflowContactView() {
      return this.isContact
        && hasRole(this.userLogged, { oneOf: VALID_CONTACT_READ_WORKFLOW_ROLES })
        && !hasRole(this.userLogged, 'REQUEST_READ_ASSIGNED-TASK');
    },
    isContact() {
      return this.userLogged.type === CONTACT_TYPE;
    },
    canReadFinancialFields() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL');
    },
    canReadAllQuote() {
      return QUOTE_READ_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    canReadFinancialSections() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL');
    },
    canReadCompanyQuote() {
      return hasRole(this.userLogged, 'QUOTE_READ_COMPANY');
    },
    canReadBreakdown() {
      return hasRole(this.userLogged, 'BREAKDOWN_READ_ALL');
    },
    canReadTranslationUnit() {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_READ_ALL');
    },
    allWorkflowsSelected() {
      return this.workflowsSelected.length === _.get(this.request, 'workflows', []).length;
    },
    canEditOwnWorkflow() {
      return _.some(VALID_WORKFLOW_EDITION_ROLES, (role) => hasRole(this.userLogged, role))
        && !this.readOnlyWorkflow;
    },
    canEditAll() {
      return _.some(VALID_WORKFLOW_EDITION_ADMIN_ROLES, (role) => hasRole(this.userLogged, role))
        && !this.readOnlyWorkflow;
    },
    canEditWorkflow() {
      return this.canEditOwnWorkflow || this.canEditAll;
    },
    isValid() {
      return _.every(this.validState);
    },
    validState() {
      if (this.request.workflows.length > 0 && this.abilities) {
        return _.map(this.request.workflows, (workflow, idx) => {
          if (this.workflowsCollapsed.includes(idx)) {
            return true;
          }
          return isValidWorkflow(
            workflow,
            this.abilityList,
            this.canReadFinancialFields,
            this.canReadTranslationUnit,
          );
        });
      }
      return [];
    },

    readOnlyWorkflow() {
      return this.isRequestCancelled;
    },
    isRequestCompleted() {
      return this.request.status === requestStatuses.completed;
    },
    isRequestCancelled() {
      return this.request.status === requestStatuses.cancelled;
    },
    isRequestDelivered() {
      return this.request.status === requestStatuses.delivered;
    },
    requestCompany() {
      return _.get(this.request, 'company._id', this.request.company);
    },
    schedulingCompany() {
      return _.get(this.request, 'schedulingCompany._id', _.get(this.request, 'schedulingCompany'));
    },
    requestDeliveryDate() {
      let requestDeliveryDate = _.get(this.request, 'deliveryDate');
      // workflow have the request delivery date as due date by default;
      if (requestDeliveryDate instanceof moment) {
        requestDeliveryDate = requestDeliveryDate.format();
      }
      return requestDeliveryDate;
    },
    utcRequestDeliveryDate() {
      return moment(this.requestDeliveryDate).utc().format();
    },
    requestStatus() {
      return _.get(this.request, 'status', '');
    },
    notDeletedWorkflows() {
      return _.get(this.request, 'workflows', [])
        .filter((w) => !_.get(w, 'deleted', false));
    },
    workflows() {
      return _.get(this.request, 'workflows', []);
    },
    isWorkflowInEditMode() {
      return this.editedWorkflowIndex !== null;
    },
    workflowsCollapsedState() {
      return _.range(this.request.workflows.length).map((i) => this.workflowsCollapsed.includes(i));
    },
    canShowAddWorkflowButton() {
      return !this.workflowContactView && this.canEditAll && !_.isEmpty(this.workflows);
    },
    companyId() {
      return _.get(this, 'value.company._id');
    },
    canAddWorkflow() {
      return !this.isWorkflowInEditMode
              && this.isValidRequest
              && !this.isRequestCompleted
              && !this.isCatImportRunning;
    },
    allDocuments() {
      const files = [];
      _.get(this, 'request.languageCombinations', []).forEach((lc) => files.push(...lc.documents));
      return files;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    copyWorkflows(payload) {
      this.localStorageWorkflow.save(payload, 'copied-workflows');
    },
    workflowsClipboard() {
      return this.localStorageWorkflow.getWorkflows('copied-workflows');
    },
    expandWorkflows() {
      this.workflowsCollapsed = [];
      this.loadData();
    },
    onWorkflowTaskFilesModalStateChange(state) {
      this.workflowTaskFilesModalState = state;
    },
    onWorkflowMove(index, direction) {
      const newIndex = index + direction;
      const workflowIds = this.request.workflows.map((workflow) => workflow._id);
      if (newIndex >= 0 && newIndex < workflowIds.length) {
        const workflowsIdToClone = swapArrayElements(workflowIds, index, newIndex);
        workflowService.setOrder(this.request._id, {
          workflowIds: workflowsIdToClone,
        }, { withCATData: true })
          .then((response) => {
            this.onRequestRefresh(response);
            this.pushNotification(successNotification('Workflow was moved successfully'));
            this.editedWorkflowIndex = null;
          }).catch((err) => {
            this._onUpdateError(err);
          });
      }
    },
    _handleRequestChangeConfirmation(index) {
      const message = 'You have made changes on the request level. Do you want to save them before you continue?';
      const dialogOptions = {
        handler: (result) => {
          if (!result.confirm) {
            this.resetRequest();
            this.editedWorkflowIndex = index;
            return;
          }
          this.onRequestSave();
          this.$parent.$once('request-saved', () => {
            this.editedWorkflowIndex = index;
          });
        },
        message,
        title: 'Warning',
        cancelText: 'No',
      };
      this.onConfirmDialogShow(dialogOptions);
    },
    resetRequest() {
      const originalRequestWithoutWorkflows = _.omit(this.originalRequest, 'workflows');
      Object.assign(this.request, originalRequestWithoutWorkflows);
    },
    _handleWorkflowChangeConfirmation(index) {
      const message = 'You have made changes to a workflow, Do you want to save them before you continue?';
      const dialogOptions = {
        handler: (result) => {
          if (!result.confirm) {
            this.request.workflows = _.cloneDeep(this.originalRequest.workflows);
            this.editedWorkflowIndex = index;
            return;
          }
          const workflowId = _.get(this.workflows, `[${this.editedWorkflowIndex}]._id`);
          const isNew = _.isNil(workflowId);
          if (isNew) {
            return this.onWorkflowCreate(this.editedWorkflowIndex).then(() => {
              this.editedWorkflowIndex = index;
            });
          }
          this.onWorkflowSave(this.editedWorkflowIndex).then(() => {
            this.editedWorkflowIndex = index;
          });
        },
        message,
        title: 'Warning',
        cancelText: 'No',
      };
      this.onConfirmDialogShow(dialogOptions);
    },
    onWorkflowEdit(index) {
      if (!this.hasWorkflowChanged && !this.hasRequestChanged) {
        this.editedWorkflowIndex = index;
        return;
      }

      if (this.hasRequestChanged) {
        return this._handleRequestChangeConfirmation(index);
      }

      this._handleWorkflowChangeConfirmation(index);
    },
    onWorkflowCancel(index, isNew) {
      this.editedWorkflowIndex = null;
      if (!isNew) {
        const originalWorkflow = _.get(this.originalRequest, `workflows[${index}]`);
        this.$set(this.request.workflows, index, _.cloneDeep(originalWorkflow));
        return;
      }
      this.request.workflows.splice(index, 1);
      this.workflowsCollapsed = this.workflowsCollapsed.filter((i) => i !== index);
    },
    onWorkflowSave(index) {
      const workflow = _.get(this.workflows, index);
      if (_.isEmpty(workflow)) {
        return;
      }
      const isValid = isValidWorkflow(
        workflow,
        this.abilityList,
        this.canReadFinancialSections,
      );
      if (!isValid) {
        const notification = {
          title: 'Workflow can not be saved',
          state: 'danger',
        };
        this.pushNotification(notification);
        return;
      }
      const transformedWorkflow = transformWorkflow(workflow);
      return workflowService.edit(this.request._id, workflow._id, {
        workflow: transformedWorkflow,
      }, { withCATData: true })
        .then((response) => {
          this.onRequestRefresh(response);
          this.pushNotification(successNotification('Workflow was updated successfully'));
          this.editedWorkflowIndex = null;
        }).catch((err) => {
          this._onUpdateError(err);
        });
    },
    onWorkflowChange(value) {
      this.hasWorkflowChanged = value;
    },
    loadBreakdowns() {
      if (this.canReadBreakdown) {
        return breakdownService.retrieve()
          .then((response) => {
            this.breakdowns = _.get(response, 'data.list', []).filter((b) => !b.deleted);
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Breakdown list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          });
      }
    },
    loadTranslationUnits() {
      if (this.canReadTranslationUnit) {
        return translationUnitService.retrieve()
          .then((response) => {
            this.translationUnits = _.get(response, 'data.list', []);
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Unit list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          });
      }
    },
    loadCompanyRates() {
      const company = _.get(this, 'request.company');
      const companyId = _.get(company, '_id', company);
      if (companyId) {
        return companyService.retrieveCompanyRates(companyId).then((response) => {
          this.companyRates = _.get(response, 'data.rates', []);
        });
      }
    },
    loadAbilities() {
      return abilityService.retrieve().then((response) => {
        const abilityList = _.get(response, 'data.list', []);
        this.abilityList = abilityList;
        this.$emit('on-ability-list', this.abilityList);
        this.abilities = _.filter(abilityList, (ab) => !ab.deleted)
          .map((a) => ({
            value: a.name,
            text: a.name,
            description: _.get(a, 'description', ''),
            languageCombination: _.get(a, 'languageCombination', false),
            internalDepartmentRequired: _.get(a, 'internalDepartmentRequired', false),
            competenceLevelRequired: _.get(a, 'competenceLevelRequired', false),
            catTool: _.get(a, 'catTool', false),
          }));
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Error retrieving abilities',
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      });
    },
    loadData() {
      this.areEntitiesLoading = true;
      const promises = [
        this.loadAbilities(),
        this.loadCompanyRates(),
        this.loadTranslationUnits(),
        this.loadBreakdowns(),
      ];
      return Promise.all(promises).finally(() => {
        this.areEntitiesLoading = false;
        this.dataLoaded = true;
      });
    },
    onBasicCatTool(languageIsoCode) {
      const requestId = this.request._id;
      this.$router.push({
        name: 'basic-cat-tool',
        params: {
          requestId,
          language: languageIsoCode,
        },
      }).catch((err) => { console.log(err); });
    },
    onUsersLoading(loading) {
      this.areUsersLoading = loading;
    },
    onWorkflowProviderTaskSectionToggle(toggledSections) {
      this.toggledSections = toggledSections;
    },
    onWorkflowsLoading(loading) {
      this.$emit('workflows-loading', loading);
    },
    onCollapseChange(workflowIndex, collapsed) {
      if (!collapsed && !this.dataLoaded) {
        this.loadData();
      }

      if (collapsed) {
        if (!this.workflowsCollapsed.includes(workflowIndex)) {
          this.workflowsCollapsed.push(workflowIndex);
        }
      } else {
        this.workflowsCollapsed = this.workflowsCollapsed.filter((idx) => idx !== workflowIndex);
      }
    },
    onDocumentUpload(isUploading) {
      this.$emit('document-upload', isUploading);
    },
    onRequestSave(notifyWhenDone = false) {
      this.$emit('request-save');
      if (notifyWhenDone) {
        this.$parent.$once('request-saved', () => this.$emit('request-saved'));
      }
    },
    onRequestRefresh(request) {
      this.$emit('request-refresh', request);
    },
    onDocumentDelete(doc, cb) {
      this.$emit('document-delete', doc, cb);
    },
    onWorkflowNoteEdit(workflowIndex, event) {
      event.workflowIndex = workflowIndex;
      this.workflowNote = event;
    },
    onWorkflowNoteUpdate(workflowNote) {
      const {
        workflowIndex,
        taskIndex,
        providerTaskIndex,
      } = workflowNote;
      const providerTasks = _.clone(this.request.workflows[workflowIndex].tasks[taskIndex].providerTasks);
      providerTasks[providerTaskIndex] = { ...providerTasks[providerTaskIndex], notes: workflowNote.notes };
      this.request.workflows[workflowIndex].tasks[taskIndex].providerTasks = providerTasks;
    },
    onWorkflowSelected(index, selected) {
      const idx = _.findIndex(this.workflowsSelected, (el) => el === index);
      if (selected && idx === -1) {
        this.workflowsSelected.push(index);
      } else if (!selected && idx !== -1) {
        this.workflowsSelected.splice(idx, 1);
      }
    },
    onWorkflowUpdate(index, workflow) {
      this.$set(this.request.workflows, index, workflow);
    },
    addWorkflow(index) {
      const len = this.request.workflows.length;
      const newWorkflow = emptyWorkflow();
      const requestDeliveryDate = this.utcRequestDeliveryDate;
      newWorkflow.workflowDueDate = requestDeliveryDate;
      newWorkflow.tasks[0].providerTasks[0].taskDueDate = requestDeliveryDate;
      if (!this.canReadFinancialSections) {
        if (_.has(newWorkflow.tasks[0], 'invoiceDetails')) {
          delete newWorkflow.tasks[0].invoiceDetails;
        }
        if (_.has(newWorkflow.tasks[0], 'providerTasks.0.billDetails')) {
          delete newWorkflow.tasks[0].providerTasks[0].billDetails;
        }
      }
      if (index >= 0 && len > index) {
        const workflowArrayClone = this.request.workflows.slice(0);
        workflowArrayClone.splice(index, 0, newWorkflow);
        this.request.workflows = workflowArrayClone;
        this.editedWorkflowIndex = index;
        return;
      }

      const workflowsCollapsed = [];
      this.workflowsCollapsed.forEach((workflowIndex) => {
        if (workflowIndex < index) {
          workflowsCollapsed.push(workflowIndex);
        } else {
          workflowsCollapsed.push(workflowIndex + 1);
        }
      });
      this.workflowsCollapsed = workflowsCollapsed;

      this.editedWorkflowIndex = this.request.workflows.length;
      this.request.workflows.push(newWorkflow);
    },
    onWorkflowAdd(index) {
      if (!this.hasRequestChanged) {
        return this.addWorkflow(index);
      }
      const dialogOptions = {
        handler: (result) => {
          if (result.confirm) {
            this.onRequestSave();
          } else {
            this.onRequestRefresh();
          }
          this.$parent.$once('request-refreshed', () => {
            this.addWorkflow(index);
          });
        },
        message: 'You have made changes on the request level. Do you want to save them before you continue?',
        title: 'Warning',
        cancelText: 'No',
      };
      this.onConfirmDialogShow(dialogOptions);
    },

    onWorkflowDelete(index) {
      if (index === -1 && _.isEmpty(this.workflowsSelected)) {
        return;
      }
      const workflowsSelected = this.workflowsSelected
        .map((selectedIndex) => {
          const workflow = _.get(this.request, `workflows[${selectedIndex}]`);
          return _.pick(workflow, ['_id', 'readDate']);
        })
        .filter((workflow) => !_.isEmpty(workflow));
      const selectedCount = workflowsSelected.length;

      if (selectedCount > 0) {
        const workflowsNumberText = selectedCount > 1 ? `${selectedCount} workflows` : 'a workflow';
        const dialogOptions = {
          handler: (result) => {
            if (!result.confirm) {
              return;
            }
            let workflowCollapsedState = _.range(this.request.workflows.length)
              .map((workflowIndex) => ({
                collapsed: this.workflowsCollapsed.includes(workflowIndex),
                workflowIndex,
              }));
            workflowService.delete(this.request._id, {
              workflows: workflowsSelected,
            }, { withCATData: true })
              .then((response) => {
                this.onRequestRefresh(response);
                this.pushNotification(successNotification('Workflows were deleted successfully'));
                this.editedWorkflowIndex = null;

                workflowCollapsedState = workflowCollapsedState
                  .filter((state) => !this.workflowsSelected.includes(state.workflowIndex))
                  .map((state, i) => ({ collapsed: state.collapsed, workflowIndex: i }));
                this.workflowsCollapsed = workflowCollapsedState
                  .filter((state) => state.collapsed).map((state) => state.workflowIndex);

                this.workflowsSelected = [];
              }).catch((err) => {
                this._onUpdateError(err);
              });
          },
          message: `You are about to delete ${workflowsNumberText} and all information in it. This action is irreversible once you click 'Yes'. Are you sure?`,
          title: 'Warning',
          cancelText: 'No',
        };
        this.onConfirmDialogShow(dialogOptions);
      }
    },
    onWorkflowCopy() {
      const workflows = _.get(this.request, 'workflows', []);
      if (workflows.length && this.workflowsSelected.length) {
        const workflowsSelected = this.workflowsSelected
          .map((selectedIndex) => {
            const workflow = _.get(this.request, `workflows[${selectedIndex}]`);
            return _.pick(workflow, ['_id', 'readDate']);
          })
          .filter((workflow) => !_.isEmpty(workflow));

        const copiedWorkflows = this.workflowsSelected
          .map((selectedIndex) => _.get(workflows, `[${selectedIndex}]`))
          .filter((workflow) => !_.isNil(workflow));
        const lines = _.sum(_.map(copiedWorkflows, (w) => _.sum(_.map(
          w.tasks,
          (t) => _.get(t, 'invoiceDetails', []).length * _.get(t, 'providerTasks', []).length,
        ))));
        this.copyWorkflows({
          sourceRequestId: this.request._id,
          workflows: workflowsSelected,
          lines,
        });
        this.onWorkflowSelectAll(false);
      }
    },
    getLocalPrice(currency, foreignUnitPrice) {
      const exchangeRate = this.getExchangeRate(currency);
      const localUnitPrice = div(foreignUnitPrice, exchangeRate);
      return parseFloat(localUnitPrice.toFixed(10));
    },
    async onWorkflowPaste() {
      const clipboard = this.workflowsClipboard();
      const sourceRequestId = _.get(clipboard, 'sourceRequestId');
      const workflows = _.get(clipboard, 'workflows', []);
      const workflowCount = workflows.length;
      if (_.isNil(sourceRequestId) || workflows.length === 0) {
        return;
      }
      const workflowsNumberText = workflowCount > 1 ? `${workflowCount} workflows` : 'a workflow';
      const dialogOptions = {
        handler: (result) => {
          if (!result.confirm) {
            return;
          }
          workflowService.paste(this.request._id, {
            sourceRequestId,
            workflows,
          }, { withCATData: true })
            .then((response) => {
              this.onRequestRefresh(response);
              const message = workflowCount > 1
                ? 'Workflows were pasted successfully' : 'Workflow was pasted successfully';
              this.pushNotification(successNotification(message));
              this.editedWorkflowIndex = null;
            }).catch((err) => {
              this._onUpdateError(err);
            });
        },
        message: `You are about to paste ${workflowsNumberText}(${clipboard.lines} lines). Are you sure?`,
        title: 'Warning',
        cancelText: 'No',
      };
      this.onConfirmDialogShow(dialogOptions);
    },
    onWorkflowCreate(index) {
      const workflow = _.get(this.workflows, index);
      if (_.isEmpty(workflow)) return;
      const isValid = isValidWorkflow(
        workflow,
        this.abilityList,
        this.canReadFinancialSections,
      );
      if (!isValid) {
        const notification = {
          title: 'Workflow can not be saved',
          state: 'danger',
        };
        this.pushNotification(notification);
        return;
      }
      const transformedWorkflow = transformWorkflow(workflow);
      return workflowService.create(this.request._id, {
        workflow: transformedWorkflow,
      }, { withCATData: true })
        .then((response) => {
          this.onRequestRefresh(response);
          this.pushNotification(successNotification('Workflow was created successfully'));
          this.editedWorkflowIndex = null;
        }).catch((err) => {
          this._onUpdateError(err);
        });
    },
    onWorkflowSelectAll(selectedAll) {
      if (selectedAll) {
        const allWorkflowsLen = _.get(this.request, 'workflows.length', 0);
        // select all
        const allSelected = [];
        for (let i = 0; i < allWorkflowsLen; i++) {
          allSelected.push(i);
        }
        this.workflowsSelected = allSelected;
      } else {
        // unselect all
        this.workflowsSelected = [];
      }
    },
    onWorkflowFileShow(workflowIndex, event) {
      event.workflowIndex = workflowIndex;
      this.workflowFiles = event;
    },
    onConfirmDialogShow(event) {
      if (!_.isNil(this.$refs.confirmDialog)) {
        this.$refs.confirmDialog.show(_.get(event, 'payload', {}));
        this.confirmDialogOptions = event;
      }
    },
    onDialogConfirm(event) {
      if (!_.isNil(this.confirmDialogHandler)) {
        this.confirmDialogHandler(event);
      }
    },
    onShowAnalysisModal(parseFunc) {
      this.isAnalysisModalVisible = true;
      this.parseFunc = parseFunc;
    },
    onWorkflowAssignTriggerModal(modalData = null) {
      this.segmentsModalData = modalData;
    },
    async onWorkflowLinguisticTaskProviderSelected({ task, workflowId, workflowIndex }) {
      if (!this.assignSegmentsEvenlyModalData) {
        this.assignSegmentsEvenlyModalData = { loading: true };
        const firstProviderTask = _.get(task, 'providerTasks[0]', '');
        const hasMoreThanOneProvider = task.providerTasks.length > 1;
        if (task.allSegmentsAssignedToOneProvider && hasMoreThanOneProvider) {
          this.assignSegmentsEvenlyModalData = {
            workflowId,
            workflowIndex,
            taskId: task._id,
            onlyProviderName: _.get(firstProviderTask, 'provider.name', ''),
          };
        } else {
          this.assignSegmentsEvenlyModalData = null;
        }
      }
    },
    onWorkflowReflowTriggerModal({ workflowIndex, workflowLanguageCombination }) {
      const workflow = this.workflows[workflowIndex];
      if (workflow) {
        this.workflowReflowModalData = {
          requestId: this.request._id,
          workflow,
          workflowLanguageCombination,
        };
      }
    },
    async getWorkflowImportedFiles(workflowId) {
      if (!this.isPortalCat || !hasRole(this.userLogged, { oneOf: READ_IMPORT_PIPLINES_ROLES })) {
        return;
      }
      this.areWorkflowImportedFilesLoading = true;
      this.workflowImportedFiles = [];
      const requestId = this.request._id;
      try {
        const pipelinesResponse = await portalCatService.getPipelines({ requestId, workflowId, type: 'import' });
        const pipelines = _.get(pipelinesResponse, 'data.pipelines', []);
        const workflowImportedFileIds = pipelines
          .filter((p) => p.status === PORTALCAT_PIPELINE_STATUS_SUCCEEDED)
          .map((p) => p.fileId);
        this.workflowImportedFiles = this.allDocuments
          .filter((doc) => isActiveDocument(doc) && workflowImportedFileIds.includes(doc._id))
          .sort((doc1, doc2) => doc1.name.localeCompare(doc2.name));
      } catch (err) {
        this.pushNotification(errorNotification('Error getting workflow imported files', null, err));
      } finally {
        this.areWorkflowImportedFilesLoading = false;
      }
    },
  },
};
