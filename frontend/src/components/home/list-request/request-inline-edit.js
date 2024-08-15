import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import { stripHtml } from 'string-strip-html';
import humanInterval from 'human-interval';
import Promise from 'bluebird';

// Mixins
import { requestEntityMixin } from '../../../mixins/request-entity-mixin';
import timezoneMixin from '../../../mixins/timezone-mixin';

import RequestTask from './request-task.vue';
import CustomFieldList from './custom-field-list/custom-field-list.vue';
import Flatpickr from '../../form/flatpickr.vue';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import PtsEmailInput from '../../form/pts-email-input.vue';
import DocumentTypeSelector from './document-type-selector.vue';
import WorkflowList from '../request-workflow/workflow-list.vue';
import DeliveryMethodSelector from './delivery-method-selector.vue';
import LocationSelect from '../location/location-select.vue';
import CatToolSelect from '../../cat-tool-select/cat-tool-select.vue';
import DirectCompanySelect from '../company/direct-company-select';
import ProjectManagerMultiSelect from './project-manager-multi-select.vue';
import SoftwareRequirementSelector from './software-requirement-selector.vue';
import RequestTypeSelect from '../request/request-type/request-type-select.vue';
import MultiDirectCompanySelect from '../company/multi-direct-company-select.vue';
import SchedulingStatusSelect from '../request/scheduling-status/scheduling-status-select.vue';
import CompetenceLevelSelector from '../../competence-level-select/competence-level-selector.vue';
import AssignmentStatusSelector from '../assignment-status/assignment-status-selector.vue';
import InternalDepartmentSelector from '../../internal-department-select/internal-department-selector.vue';
import RequestLanguageCombination from './request-language-combination/request-language-combination.vue';
import OpportunityAjaxBasicSelect from '../../opportunity-select/opportunity-ajax-basic-select.vue';
import CommaSeparatedEmailSelector from '../../form/comma-separated-email-selector.vue';
import CurrencySelector from '../../currency-select/currency-selector.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import ExternalAccountingCodeSelect from '../../external-accounting-code-select/external-accounting-code-ajax-select.vue';
import IpDetails from './ip-details/ip-details.vue';
import ProgressUpload from '../../progress-upload/progress-upload.vue';
import lspAwareUrl from '../../../resources/lsp-aware-url';
import RequestStatusSelect from '../request/status/request-status-select.vue';
import ServiceTypeAjaxBasicSelect from '../service-type/service-type-ajax-basic-select.vue';
import DeliveryTypeAjaxBasicSelect from '../delivery-type/delivery-type-ajax-basic-select.vue';
import RunStatisticsModal from './run-statistics-modal/run-statistics-modal.vue';
import NODBService from '../../../services/nodb-service.js';
import UserService from '../../../services/user-service';
import RequestService from '../../../services/request-service';
import { toUserName } from '../../../utils/user';
import { properId, toOption, toSelectOptionFormat } from '../../../utils/select2';
import { fileSupported } from '../../../utils/basic-cat-tool';
import {
  newTemplate, transformRequest, getRequestDocuments, isActiveDocument, isFileAlreadyAddedToRequest
} from './request-inline-edit-helper';
import {
  successNotification, iframeDownloadError, warningNotification, errorNotification,
} from '../../../utils/notifications';
import { getFileWithExtension } from '../../../utils/files/index';
import { jsonToUrlParam } from '../../../utils/browser';
import CompanyService from '../../../services/company-service';
import { bigJsToNumber } from '../../../utils/bigjs';
import {
  forEachProviderTask, areValidWorkflows, transformWorkflow, isValidWorkflow,
} from '../../../utils/workflow/workflow-helpers';
import RequestTypeService from '../../../services/request-type-service';
import BrowserStorage from '../../../utils/browser-storage';
import { requestErrorMixin } from '../../../mixins/request-error-mixin';
import WorkflowService from '../../../services/workflow-service';
import PortalCatService from '../../../services/portalcat-service';
import { CancellablePoller } from '../../../services/cancellable-poller';

const VALID_CONTACT_READ_WORKFLOW_ROLES = ['CONTACT-WORKFLOW_READ_OWN', 'CONTACT-WORKFLOW_READ_COMPANY'];
const WORKFLOW_CHANGES_WARN_MESSAGE = 'You have made changes to a workflow. Do you want to save them and keep working?';
const STATUS_CHANGE_WARN_MESSAGE1 = `You are about to change the request status to "In Progress".
  This action will prevent you from selecting the following status in the future: "Waiting for Quote", "Waiting for Approval", "To be Processed".\n
  Would you like to continue?`;
const STATUS_CHANGE_WARN_MESSAGE2 = `You are about to change the request status to "Waiting for Client PO".
  This action will prevent you from selecting the following status in the future: "Waiting for Quote", "Waiting for Approval", "To be Processed".\n
  Would you like to continue?`;
const COMPLETED_REQUEST_STATUS_WARN_MESSAGE = 'You are about to change the request status to “Completed”. This action will prevent you from editing any of the fields except the PO required field. Would you like to continue? ';
const CANCELLED_REQUEST_STATUS_WARN_MESSAGE = 'You are about to change the request status to “Cancelled”. This action will prevent you from selecting any other status in the future. Would you like to continue? ';
const DELIVERED_REQUEST_STATUS_WARN_MESSAGE = 'You are about to change the request status to “Delivered”. This action will prevent you from selecting the following status in the future: "In Progress". Do you want to continue? ';
const NOT_INVOICED_STATUS = 'Not Invoiced';
const CONTACT_USER_TYPE = 'Contact';
const QUOTE_GRID_NAME = 'quoteInlineGrid';
const DASHBOARD_NAME = 'dashboard_component';
const REQUEST_GRID_NAME = 'requestInlineGrid';
const REQUEST_STATUSES = ['In progress', 'Waiting for Quote', 'Waiting for approval', 'Waiting for Client PO', 'To be processed', 'On Hold', 'Completed', 'Cancelled', 'Delivered'];
const COMPLETED_STATUS = 'Completed';
const CANCELLED_STATUS = 'Cancelled';
const WAITING_FOR_APPROVAL_STATUS = 'Waiting for approval';
const WAITING_FOR_QUOTE_STATUS = 'Waiting for Quote';
const WAITING_STATUSES = [WAITING_FOR_QUOTE_STATUS, WAITING_FOR_APPROVAL_STATUS];
const WAITING_FOR_CLIENT_PO_STATUS = 'Waiting for Client PO';
const TO_BE_PROCESSED_STATUS = 'To be processed';
const DELIVERED_STATUS = 'Delivered';
const IN_PROGRESS_STATUS = 'In progress';
const ON_HOLD_STATUS = 'On Hold';
const MONEY_VALUE_PRECISION = 2;
const PENDING_DOCUMENT_STATE = 'pending';
const VALID_WORKFLOW_READ_ROLES = ['WORKFLOW_READ_OWN', 'WORKFLOW_READ_ALL'];
const TASK_DETAIL_ROUTE_NAMES = ['task-detail', 'task-edition'];
const MAX_COMMENT_LENGTH = 5000;
const PROVIDER_TASK_STATUS_APPROVED = 'approved';
const PROVIDER_TASK_STATUS_CANCELLED = 'cancelled';
const PROVIDER_TASK_STATUS_COMPLETED = 'completed';
const REQUEST_TYPE_STANDARD = 'Standard';
const REQUEST_TYPE_EMPTY = {
  _id: null,
  name: '',
};
const WORKFLOW_TYPE_STANDARD = 'Standard';
const WORKFLOW_TYPE_AUTO_SCAN = 'Auto Scan PDF to MT Text';
const WORKFLOW_TYPES = [WORKFLOW_TYPE_STANDARD, WORKFLOW_TYPE_AUTO_SCAN]
  .map((v) => ({ value: v, text: v }));
const TRANSLATION_ONLY_SERVICE = 'Patent Translation Quote';
const DATA_CLASSIFICATION_OPTIONS = ['Restricted', 'Public', 'Confidential'];
const PC_PIPELINE_RUNNING = 'running';
const PC_PIPELINE_ERROR = 'failed';
const PC_PIPELINE_SUCCEEDED = 'succeeded';
const PC_PIPELINE_STOPPED = 'stopped';
const PC_PIPELINE_TYPE_IMPORT = 'import';
const PC_PIPELINE_TYPE_MT = 'mt';
const requestService = new RequestService();
const userService = new UserService();
const companyService = new CompanyService();
const requestTypeService = new RequestTypeService();
const nodbService = new NODBService();
const portalCatService = new PortalCatService();
const localStore = new BrowserStorage('InterpretingSpecificSection');
const srcColsFactory = function ({
  canEdit, canReadCatFiles, internalDocumentRoles, ocrParams,
}) {
  let cols = RequestService.defaultFileColumns({
    canEdit,
    canReadCatFiles,
    isAutoWorkflow: ocrParams.isAutoScan,
    canReadOCRFiles: ocrParams.canReadOCRFiles,
  });
  if (!internalDocumentRoles.canCreate
    || !internalDocumentRoles.canUpdate
    || !internalDocumentRoles.canRead) {
    cols = cols.filter((c) => c.name !== 'Internal');
  } else if (internalDocumentRoles.canRead) {
    cols = cols.map((c) => {
      if (c.name === 'Internal') {
        Object.assign(c, { disabled: true });
      }
      return c;
    });
  }
  return cols;
};
const workflowService = new WorkflowService();
const LINGUISTIC_TASKS = {
  Translation: 'TRANSLATION',
  QA: 'QA',
  Editing: 'EDITING',
  PEMT: 'EDITING',
};
const REQUEST_ANALYSIS_STATUS_CHECK_INTERVAL = 10000;
const REQUEST_ANALYSIS_STATUS_CHECK_RETRIES_ON_ERROR = 5;

export default {
  inject: ['$validator'],
  mixins: [requestEntityMixin, requestErrorMixin, timezoneMixin],
  props: {
    requestId: {
      type: String,
    },
  },
  components: {
    CatToolSelect,
    CompetenceLevelSelector,
    InternalDepartmentSelector,
    DocumentTypeSelector,
    DeliveryMethodSelector,
    SoftwareRequirementSelector,
    ConfirmDialog,
    DirectCompanySelect,
    LocationSelect,
    MultiDirectCompanySelect,
    CompanyAjaxBasicSelect,
    PtsEmailInput,
    RequestTask,
    RequestTypeSelect,
    SchedulingStatusSelect,
    ProjectManagerMultiSelect,
    WorkflowList,
    Flatpickr,
    RequestLanguageCombination,
    OpportunityAjaxBasicSelect,
    CommaSeparatedEmailSelector,
    SimpleBasicSelect,
    AssignmentStatusSelector,
    CurrencySelector,
    IpDetails,
    ProgressUpload,
    ExternalAccountingCodeSelect,
    RequestStatusSelect,
    CustomFieldList,
    ServiceTypeAjaxBasicSelect,
    DeliveryTypeAjaxBasicSelect,
    RunStatisticsModal,
  },
  created() {
    this._ = _;
    this.abilityList = [];
    this.isTaskViewRoute = TASK_DETAIL_ROUTE_NAMES.indexOf(this.$route.name) >= 0;
    this.datepickerOptions = {
      onValueUpdate: null,
      enableTime: true,
      allowInput: false,
      disableMobile: 'true',
      dateFormat: 'Y-m-d H:i',
    };

    this.maxCommentsLength = MAX_COMMENT_LENGTH;
    this.dataClassificationSelectOptions = DATA_CLASSIFICATION_OPTIONS;
    this.taskViewMode = TASK_DETAIL_ROUTE_NAMES.indexOf(this.$route.name) >= 0;
    this._initialize();
    if (localStore.existsInCache('collapsed')) {
      this.isInterpretingSpecificSectionCollapsed = localStore.findInCache('collapsed');
    }
    this.failedFiles = [];
  },
  destroyed() {
    this.setAppTitle();
    this.stopPcPolling();
    this.stopRequestAnalysisStatusPolling();
  },
  data() {
    return {
      isCustomFieldAccordionActive: true,
      failedFiles: [],
      hasWorkflowChanged: false,
      shouldLeavePage: false,
      selectedRequestCurrency: '',
      processedDocuments: [],
      documentsToUpload: [],
      uploadPromises: [],
      originalRequestStatus: '',
      uploading: false,
      downloading: false,
      downloadingSrcFiles: false,
      loadingRequest: false,
      loadingContacts: false,
      isValidOtherCC: true,
      otherContact: null,
      contact: null,
      schedulingCompany: {
        _id: '',
        name: '',
        hierarchy: '',
      },
      externalAccountingCode: {
        _id: null,
        name: '',
      },
      schedulingContact: {
        _id: '',
        firstName: '',
        lastName: '',
      },
      schedulingStatus: {
        _id: null,
        name: '',
      },
      locationsAvailable: [],
      partners: [],
      insuranceCompany: {
        _id: null,
        name: '',
        hierarchy: '',
      },
      contacts: [],
      comments: '',
      companies: [],
      abilities: [],
      areWorkflowsLoading: false,
      selectedCatTool: {},
      uploadedFilesCount: 0,
      finalDocumentsColumns: [
        'Filename',
        'Created At',
        'Deleted At',
        'Deleted By',
        'Retention Time',
        'Download',
      ],
      item: {},
      saving: false,
      originalRequest: null,
      workflowTypes: WORKFLOW_TYPES,
      requestEntity: {
        status: '',
        isQuoteApproved: false,
        departmentNotes: '',
        timeToDeliver: '',
        hasTimeToDeliverOptions: false,
        location: {
          _id: null,
          name: '',
          address: '',
          suite: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          phone: '',
        },
        requestType: REQUEST_TYPE_EMPTY,
        dataClassification: '',
        serviceDeliveryTypeRequired: false,
        serviceTypeId: null,
        deliveryTypeId: null,
        workflowType: WORKFLOW_TYPE_STANDARD,
        quoteCurrency: {
          _id: '',
          name: '',
          isoCode: '',
        },
        assignmentStatus: {
          _id: null,
          name: '',
        },
        schedulingCompany: {
          _id: null,
          name: '',
          hierarchy: '',
        },
        schedulingContact: {
          _id: '',
          firstName: '',
          lastName: '',
        },
        insuranceCompany: {
          _id: null,
          name: '',
          hierarchy: '',
          status: '',
        },
        invoiceCompany: {
          _id: '',
          name: '',
          hierarchy: '',
        },
        invoiceContact: {
          _id: '',
          firstName: '',
          lastName: '',
        },
        company: {
          _id: '',
          name: '',
          hierarchy: '',
          status: '',
          availableTimeToDeliver: [],
        },
        adjuster: '',
        memo: '',
        companyHierarchy: '',
        invoiceTotal: 0,
        billTotal: 0,
        projectedCostTotal: 0,
        finalDocuments: [],
        late: false,
        rush: false,
        complaint: false,
        repSignOff: false,
        opportunityNo: null,
        otherContact: null,
        deliveryMethod: {
          _id: null,
          name: '',
        },
        competenceLevels: [],
        documentTypes: [],
        softwareRequirements: [],
        otherCC: [],
        purchaseOrder: '',
        poRequired: false,
        requireQuotation: false,
        quoteDueDate: null,
        expectedQuoteCloseDate: null,
        deliveryDate: null,
        languageCombinations: [{
          tgtLangs: [],
          srcLangs: [],
          documents: [],
          preferredLanguageCombination: false,
        }],
        internalDepartment: {
          _id: null,
          name: '',
        },
        comments: '',
        turnaroundTime: '',
        workflowTemplate: '',
        workflows: [],
        catTool: '',
        projectManagers: [],
        referenceNumber: null,
        recipient: null,
        rooms: null,
        atendees: null,
        expectedStartDate: null,
        actualDeliveryDate: null,
        actualStartDate: null,
        expectedDurationTime: 0,
        requestInvoiceStatus: '',
        ipPatent: {
          service: '',
          database: '',
          patentApplicationNumber: '',
          patentPublicationNumber: '',
          thirtyMonthsDeadline: '',
          sourceLanguage: '',
          applicantName: '',
          abstractWordCount: '',
          drawingsWordCount: '',
          descriptionWordCount: '',
          numberOfDrawings: '',
          claimsWordCount: '',
          drawingsPageCount: '',
          isAnnuityQuotationRequired: false,
          countries: [],
          total: '',
        },
        externalAccountingCode: {
          _id: null,
          name: '',
        },
        customStringFields: [],
        pcSettings: {
          statisticsGenerated: false,
          lockedSegments: {
            includeInClientStatistics: false,
            includeInProviderStatistics: false,
          },
        },
      },
      workflows: [],
      isValidWorkflowList: true,
      catToolList: [],
      selectedProjectManager: {},
      projectManagers: [],
      isTaskViewRoute: false,
      entityOutdated: false,
      isInterpretingSpecificSectionCollapsed: false,
      confirmDialogOptions: {
        handler: null,
        title: '',
        message: '',
        dataE2eType: '',
      },
      editedWorkflowIndex: null,
      pcErrors: [],
      isUserIpAllowed: true,
      areAllFinalFilesGenerated: false,
      pcPoller: null,
      requestAnalysisStatusPoller: null,
      requestAnalysis: [],
      isRequestAnalysisLoading: false,
      isRequestAnalysisRunning: false,
      importedCatFiles: [],
      isCatImportRunning: false,
      showNotificationIfStatisticsRunning: true,
      showNotificationIfStatisticsSucceeded: false,
      raStatusCheckRetriesOnError: 0,
    };
  },
  watch: {
    failedFiles(newValue) {
      if (Array.isArray(newValue) && newValue.length > 0) {
        const errNotification = {
          title: 'Some of the submitted files failed to upload.',
          message: `Please upload the following files again:
              ${this.failedFiles.join(',')}
              `,
          state: 'danger',
        };
        this.pushNotification(errNotification);
      }
    },
    currencyList(newValue) {
      if (!_.isEmpty(newValue)) {
        const currencyFound = this.currencyList.find((c) => c._id === _.get(this.selectedRequestCurrency, 'value', this.selectedRequestCurrency));
        this.$set(this.requestEntity, 'quoteCurrency', _.pick(currencyFound, ['_id', 'name', 'isoCode']));
      }
    },
    'requestEntity.poRequired': function (newValue) {
      if (!newValue) {
        this.requestEntity.purchaseOrder = '';
      }
    },
    selectedCompany(newValue) {
      if (_.isEmpty(_.get(this, 'requestEntity.quoteCurrency._id'))) {
        let quoteCurrencyId = null;
        if (_.isString(_.get(newValue, 'quoteCurrency')) && !_.isEmpty(newValue.quoteCurrency)) {
          quoteCurrencyId = newValue.quoteCurrency;
        } else if (_.has(newValue, 'quoteCurrency.name')) {
          quoteCurrencyId = newValue.quoteCurrency._id;
        }
        if (_.get(this, 'requestEntity.quoteCurrency._id', '') !== quoteCurrencyId
          && !_.isEmpty(quoteCurrencyId)) {
          this.selectedRequestCurrency = quoteCurrencyId;
        }
      } else {
        this.selectedRequestCurrency = this.requestEntity.quoteCurrency._id;
      }
    },
    selectedRequestCurrency(newValue) {
      if (!_.isEmpty(this.currencyList)) {
        const currencyFound = this.currencyList.find((c) => c._id === _.get(newValue, 'value', newValue));
        this.$set(this.requestEntity, 'quoteCurrency', _.pick(currencyFound, ['_id', 'name', 'isoCode']));
      }
    },
    'requestEntity.contact': function (newValue) {
      const contactId = _.get(newValue, '_id', newValue);
      if (_.isString(contactId) && !this.isLoading) {
        this.retrieveContactSalesRep(contactId);
      }
    },
    'requestEntity.timeToDeliver': {
      handler: function (timeToDeliver) {
        if (!_.isEmpty(timeToDeliver)) {
          const createdAt = _.get(this, 'requestEntity.createdAt') || new Date();
          this.requestEntity.deliveryDate = moment(createdAt, 'YYYY-MM-DDTHH:mm:ssZ')
            .add(humanInterval(timeToDeliver.toLowerCase()))
            .utc();
        } else {
          this.requestEntity.deliveryDate = null;
        }
      },
    },
    availableTimeToDeliver: {
      handler: function (newValue) {
        if (this.isNewRecord) {
          this.requestEntity.hasTimeToDeliverOptions = _.isArray(newValue) && newValue.length > 0;
        }
      },
      immediate: true,
    },
    uploading: function (isUploading) {
      if (isUploading) {
        this.triggerGlobalEvent('startRefreshSessionPoll');
      } else {
        this.triggerGlobalEvent('stopRefreshSessionPoll');
      }
    },
    schedulingContact(newValue) {
      this.requestEntity.schedulingContact = newValue;
    },
    comments: function (newComment) {
      if (!this.requestEntity || this.requestEntity.comments !== newComment) {
        this.$set(this.requestEntity, 'comments', newComment || '');
      }
    },
    'requestEntity.comments': function (newComment) {
      if (!this.comments || this.comments !== newComment) {
        this.comments = newComment;
      }
    },
    externalAccountingCode: function (newCode) {
      this.requestEntity.externalAccountingCode = {
        _id: newCode._id,
        name: newCode.name,
      };
    },
    'requestEntity.company': function (oldCompany, newCompany) {
      if (_.get(newCompany, '_id', '') && _.get(oldCompany, '_id', '') !== _.get(newCompany, '_id', '')) {
        this.externalAccountingCode = {
          _id: null,
          name: '',
        };
      }
    },
    schedulingStatus(newSchedulingStatus) {
      this.$set(this.requestEntity, 'schedulingStatus', _.defaultTo(newSchedulingStatus, null));
    },
    partners(newPartners) {
      this.$set(this.requestEntity, 'partners', _.defaultTo(newPartners, []));
    },
    schedulingCompany(newSchedulingCompany) {
      this.requestEntity.schedulingCompany = newSchedulingCompany;
    },
    insuranceCompany(newInsuranceCompany) {
      this.$set(this.requestEntity, 'insuranceCompany', _.defaultTo(newInsuranceCompany, null));
    },
    selectedCatTool: function (newCatToolSelected) {
      this.$set(this.requestEntity, 'catTool', _.get(newCatToolSelected, 'text', null));
    },
    $route() {
      this._initialize();
    },
    'requestEntity.requestType.name'(requestType) {
      if (_.get(this, 'lsp.supportsIpQuoting', false)) {
        const query = { ...this.$route.query, type: requestType };
        this.$router.replace({ name: this.$route.name, query, params: this.$route.params });
      }
    },
    isInterpretingSpecificSectionCollapsed(newValue) {
      localStore.saveInCache('collapsed', newValue);
    },
    isUserIpAllowed(newValue) {
      if (!newValue) {
        const notification = {
          title: 'Error',
          message: 'The IP address is not authorized to access files for this company.',
          state: 'danger',
        };
        this.pushNotification(notification);
      }
    },
    'requestEntity.languageCombinations'(newCombinations, oldCombinations) {
      if (this.isPortalCat) {
        this.removeNotRelevantWorkflows(newCombinations, oldCombinations);
        this.updateImportedCatFiles(newCombinations, oldCombinations);
      }
    },
  },
  beforeRouteLeave(to, from, next) {
    if (!this.hasWorkflowChanged || this.shouldLeavePage) {
      return next();
    }
    const handler = (result) => {
      if (!result.confirm) {
        this.shouldLeavePage = true;
        return next();
      }
      this.saveWorkflow(this.editedWorkflowIndex);
    };
    const dialogOptions = {
      handler,
      title: 'Warning',
      message: WORKFLOW_CHANGES_WARN_MESSAGE,
      dataE2eType: 'save-workflow-dialog',
    };
    return this.onConfirmDialogShow(dialogOptions);
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp', 'localCurrency']),
    ...mapGetters('notifications', ['notifications']),
    ...mapGetters('features', ['mockTimezone', 'mock']),
    mandatoryRequestContact() {
      return this.selectedCompany.mandatoryRequestContact || false;
    },
    finalFilesUrl() {
      return lspAwareUrl(`portalcat/${this.requestEntityId}/final/download`);
    },
    fileUploadProgress() {
      if (_.isEmpty(this.fileQueue)) {
        return 0;
      }
      const totalUploaded = this.fileQueue.reduce((sum, { loaded }) => sum + loaded, 0);
      const totalSize = this.fileQueue.reduce((sum, { total }) => sum + total, 0);
      const percentage = (totalUploaded / totalSize) * 100;
      if (percentage < 100 && this.uploading) {
        return _.parseInt(percentage, 10);
      }
    },
    currencyList() {
      return this.lsp.currencies;
    },
    hasRequestTemplate() {
      return _.has(this.$route, 'params.request');
    },
    canReadFinancialSections() {
      return this.hasRole('TASK-FINANCIAL_READ_ALL');
    },
    assignmentStatusName() {
      return _.get(this.requestEntity, 'assignmentStatus.name', '');
    },
    activitiesFilter() {
      return JSON.stringify({ requests: this.requestEntity.no });
    },
    activitiesLink() {
      return `activities?${jsonToUrlParam({ filter: this.activitiesFilter })}`;
    },
    isPortalCat() {
      const catTool = _.get(this, 'originalRequest.catTool', '');
      return !_.isNil(catTool.match(/portal.*cat|cat.*portal/i));
    },
    isPoRequired() {
      return this.requestEntity.poRequired;
    },
    canEditTimeToDeliver() {
      return !_.isEmpty(this.availableTimeToDeliver) && this.hasTimeToDeliverOptions;
    },
    hasTimeToDeliverOptions() {
      return _.get(this.requestEntity, 'hasTimeToDeliverOptions', false);
    },
    isValidTimeToDeliver() {
      const timeToDeliverName = _.get(this, 'requestEntity.timeToDeliver', '');
      return !this.canEditTimeToDeliver
        || !this.hasTimeToDeliverOptions || !_.isEmpty(timeToDeliverName);
    },
    companyHierarchy() {
      const company = _.defaultTo(_.get(this.requestEntity, 'company'), {});
      if (_.isEmpty(company.hierarchy)) {
        return company.name;
      }
      return company.hierarchy;
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
    confirmDialogType() {
      return _.get(this, 'confirmDialogOptions.dataE2eType', '');
    },
    documents() {
      return getRequestDocuments(this.requestEntity.languageCombinations);
    },
    finalDocuments() {
      return _.get(this, 'requestEntity.finalDocuments', []).filter((d) => isActiveDocument(d));
    },
    isWorkflowInEditMode() {
      return this.editedWorkflowIndex !== null;
    },
    requestContainerClasses() {
      return {
        'blur-loading-row': this.loadingRequest || this.uploading || this.saving,
      };
    },
    isSingleLanguageCombination() {
      return _.get(this.requestEntity, 'languageCombinations.length', 0) === 1;
    },
    selectedSchedulingCompany() {
      return {
        text: _.get(this.schedulingCompany, 'hierarchy', ''),
        value: _.get(this.schedulingCompany, '_id', ''),
      };
    },
    selectedInsuranceCompany() {
      return {
        text: _.get(this.insuranceCompany, 'hierarchy', ''),
        value: _.get(this.insuranceCompany, '_id', ''),
      };
    },
    selectedInvoiceToCompany() {
      return toOption(this.requestEntity.invoiceCompany, 'hierarchy');
    },
    selectedCompany() {
      const company = _.defaultTo(this.requestEntity.company, {});
      let { quoteCurrency = '' } = company;
      const { mandatoryRequestContact = false, hierarchy = '', _id = '' } = company;
      if (!this.useAnyCompany) {
        quoteCurrency = _.get(this, 'userLogged.company.billingInformation.quoteCurrency', '');
      }
      return {
        quoteCurrency,
        mandatoryRequestContact,
        text: hierarchy,
        value: _id,
      };
    },
    availableTimeToDeliver() {
      let availableTimeToDeliver = _.get(this, 'requestEntity.company.availableTimeToDeliver', []);
      const originalTimeToDeliver = _.get(this, 'originalRequest.timeToDeliver', '');
      if (
        !_.isEmpty(originalTimeToDeliver)
        && availableTimeToDeliver.length > 0
        && !availableTimeToDeliver.includes(originalTimeToDeliver)
      ) {
        availableTimeToDeliver = availableTimeToDeliver.concat([originalTimeToDeliver]);
      }
      return _.sortBy(availableTimeToDeliver, (interval) => humanInterval(interval.toLowerCase()));
    },
    companyId() {
      return _.get(this, 'requestEntity.company._id', '');
    },
    isContactHaveAccessToQuoteDetails() {
      const isRequestTypeStandard = !this.lsp.supportsIpQuoting
        || this.requestType.name === REQUEST_TYPE_STANDARD;
      const showCase1 = !this.isRequestInWaitingStatus;
      const showCase2 = this.requestEntity.status === WAITING_FOR_APPROVAL_STATUS
        && !_.isEmpty(this.requestEntity.quoteTemplateId);
      return !isRequestTypeStandard || (showCase1 || showCase2);
    },
    showQuoteDetailButton() {
      return !this.saving
        && !this.loadingRequest
        && !this.uploading
        && this.requestEntity.requireQuotation
        && !this.isNewRecord
        && (!this.userIsContact || this.isContactHaveAccessToQuoteDetails);
    },
    requestEntityId() {
      if (!_.isEmpty(this.requestId) && !_.isNil(this.requestId)) {
        return this.requestId;
      }
      if (!_.isEmpty(this.entityId) && !_.isNil(this.entityId)) {
        return this.entityId;
      }
      return _.get(this, 'requestEntity._id', '');
    },
    isForeignCurrencyRequest() {
      return _.get(this.requestEntity, 'quoteCurrency.isoCode', '') !== this.localCurrency.isoCode;
    },
    showGrossProfitCalculator() {
      if (!this.canReadFinancialSections) {
        return false;
      }
      if (!this.hasWorkflows) {
        return false;
      }
      return (this.canReadQuotes || this.canReadAll)
        && this.canReadProjectedRate;
    },
    isValidDeliveryDate() {
      if (this.canOnlyReadRequestAssignedTask) {
        return true;
      }
      const { deliveryDate } = this.requestEntity;
      return !_.isEmpty(deliveryDate) && deliveryDate.isValid();
    },
    isAutoScanWorkflow() {
      return this.requestEntity.workflowType === WORKFLOW_TYPE_AUTO_SCAN;
    },
    isQuote() {
      return ['quote-edition', 'create-quote'].includes(this.$route.name);
    },
    calculatedExpectedDurationTime: {
      get() {
        const momentDate1 = moment(this.requestEntity.deliveryDate);
        if (this.requestEntity.expectedStartDate) {
          const momentDate2 = moment(this.requestEntity.expectedStartDate);
          const expectedDurationTime = momentDate1.diff(momentDate2, 'minutes') / 60;
          const roundedExpectedDurationTime = Math.round(expectedDurationTime * 10) / 10;
          return roundedExpectedDurationTime;
        }
        return this.requestEntity.expectedDurationTime;
      },
      set(value) {
        this.requestEntity.expectedDurationTime = value;
      },
    },
    shouldDisableExpectedDurationTime() {
      return !_.isEmpty(this.requestEntity.expectedStartDate)
        && !_.isEmpty(this.requestEntity.deliveryDate);
    },
    sourceDocumentsColumns() {
      const internalDocumentRoles = {
        canRead: this.hasRole('INTERNAL-DOCUMENT_READ_ALL'),
        canUpdate: this.hasRole('INTERNAL-DOCUMENT_UPDATE_ALL'),
        canCreate: this.hasRole('INTERNAL-DOCUMENT_CREATE_ALL'),
        canDelete: this.hasRole('INTERNAL-DOCUMENT_DELETE_ALL'),
      };
      const ocrParams = {
        isAutoScan: this.isAutoScanWorkflow,
        canReadOCRFiles: this.hasRole('OCR-FILES_READ_ALL'),
      };
      return srcColsFactory({
        canEdit: this.canEditAll,
        canReadCatFiles: this.isPortalCat && this.hasRole('REQUEST_READ_ALL'),
        internalDocumentRoles,
        ocrParams,
      })
        .filter((c) => c.visible)
        .map((c) => c.name);
    },
    isWorkflowsVisible() {
      return this.canReadWorkflows && !this.isNewRecord;
    },
    documentUrlResolver() {
      return requestService.getDocumentUrl.bind(requestService);
    },
    requestZipFinalFileURL() {
      return `/api/lsp/${this.userLogged.lsp._id}/company/${this.companyId}/request/${this.requestEntityId}/documents/final/zip`;
    },
    otherCCDanger() {
      return !this.isValidOtherCC && this.inputEnabled;
    },
    projectManagersSelected() {
      const projectManagers = _.get(this, 'requestEntity.projectManagers', []);
      if (_.isEmpty(projectManagers)) {
        return '';
      }
      return projectManagers.map((pm) => toUserName(pm)).join(', ');
    },
    nullOrContacts() {
      if (!this.canOnlyCreateOwn || this.loadingContacts) {
        return null;
      }
      return this.contacts;
    },
    contactName() {
      if (!this.isNewRecord && this.requestEntity.contact) {
        const contact = _.get(this.requestEntity, 'contact');
        return `${_.get(contact, 'firstName', '')} ${_.get(contact, 'lastName', '')}`;
      }
      if (!this.useAnyCompany) {
        return `${this.userLogged.firstName} ${this.userLogged.lastName}`;
      }
      return '';
    },
    otherContactName() {
      const otherContact = _.get(this, 'requestEntity.otherContact', null);
      if (!this.isNewRecord && !_.isNil(otherContact)) {
        return `${otherContact.firstName} ${otherContact.lastName}`;
      }
      return '';
    },
    contactEmail() {
      if (!_.isEmpty(this.companyId) && _.has(this, 'requestEntity.contact._id')) {
        return this.requestEntity.contact.email;
      }
      if (!this.useAnyCompany) {
        return this.userLogged.email;
      }
      return '';
    },
    contactId() {
      return _.get(this.requestEntity, 'contact._id', this.requestEntity.contact);
    },
    contactFilter() {
      if (this.useAnyCompany) {
        return [this.contactId];
      }
      return [properId(this.userLogged)];
    },
    opportunityFilter() {
      return { companyText: _.get(this.requestEntity, 'company.name', '') };
    },
    localQuoteDueDate() {
      if (this.isNewRecord && !this.lsp.supportsIpQuoting) {
        return null;
      }
      const quoteDueDate = _.get(this, 'requestEntity.quoteDueDate');
      return quoteDueDate;
    },
    localExpectedQuoteCloseDate() {
      if (this.isNewRecord && !this.lsp.supportsIpQuoting) {
        return null;
      }
      const expectedQuoteCloseDate = _.get(this, 'requestEntity.expectedQuoteCloseDate', null);
      return expectedQuoteCloseDate;
    },
    status() {
      return this.requestEntity.status;
    },
    catToolFilter() {
      if (this.documents) {
        const hasSupportedFile = this.documents
          .findIndex((d) => fileSupported(d.name)) !== -1;
        if (!hasSupportedFile) {
          return function (catTool) {
            return catTool.name !== 'Basic CAT';
          };
        }
      }
      return function () {
        return true;
      };
    },
    selectedPartners() {
      if (Array.isArray(_.get(this.requestEntity, 'partners'))) {
        return this.requestEntity.partners.map((p) => toSelectOptionFormat(p, '_id', 'name'));
      }
      return [];
    },
    hasWorkflows() {
      const workflows = _.get(this, 'requestEntity.workflows', []);
      return !_.isEmpty(workflows);
    },
    hasFinalDocumentsToDownload() {
      return this.finalDocuments.filter((d) => _.isNil(d.deletedByRetentionPolicyAt)).length > 0;
    },
    canDownloadSourceFiles() {
      return this.canUploadFiles || this.canEditRequestTask || this.canReadRequestAssignedTask;
    },
    canDownloadFinalFiles() {
      return !_.isEmpty(this.finalDocuments) && !this.isTaskViewRoute;
    },
    hasSchedulingCompany() {
      return !_.isNil(_.get(this.requestEntity, 'schedulingCompany._id'));
    },
    useAnyCompany() {
      return this.hasRole('COMPANY_READ_ALL')
        && this.hasRole('REQUEST_CREATE_ALL')
        && this.hasRole('REQUEST_UPDATE_ALL');
    },
    canCreate() {
      return ['REQUEST_CREATE_COMPANY', 'REQUEST_CREATE_ALL', 'REQUEST_CREATE_OWN'].some((role) => this.hasRole(role));
    },
    canReadDataClassification() {
      return this.hasRole('DATA-CLASSIFICATION_READ_ALL');
    },
    canEditDataClassification() {
      return this.hasRole('DATA-CLASSIFICATION_UPDATE_ALL');
    },
    canEditAll() {
      return !this.isTaskViewRoute && this.hasRole('REQUEST_UPDATE_ALL');
    },
    canEditExternalAccountingCode() {
      return this.hasEditRole
        && (
          !(this.isRequestCompleted || this.isRequestDelivered)
          || this.hasRole('REQUEST-EXTERNAL-ACCOUNTING-CODE_UPDATE_ALL')
        );
    },
    canContactReadCatTool() {
      return this.userIsContact && this.isPortalCat && this.canReadStatistics;
    },
    canCreateAll() {
      return this.hasRole('REQUEST_CREATE_ALL');
    },
    canCreateOwn() {
      return this.hasRole('REQUEST_CREATE_OWN');
    },
    canOnlyCreateOwn() {
      return !this.canCreateAll && this.hasRole('REQUEST_CREATE_OWN');
    },
    canSeeWorkflowType() {
      return this.hasRole({ oneOf: ['REQUEST_CREATE_ALL', 'REQUEST_UPDATE_ALL', 'REQUEST_READ_ALL'] });
    },
    canChangeWorkflowType() {
      return this.hasRole('REQUEST_UPDATE_ALL');
    },
    canReadProjectedRate() {
      return this.hasRole('PROJECTED-RATE_READ_ALL');
    },
    canReadOwnCompanyRequest() {
      return this.hasRole({ oneOf: ['REQUEST_READ_COMPANY', 'REQUEST_READ_OWN', 'REQUEST_READ_ALL'] });
    },
    canReadRequestAssignedTask() {
      return this.hasRole('REQUEST_READ_ASSIGNED-TASK');
    },
    canOnlyReadRequestAssignedTask() {
      return this.canReadRequestAssignedTask && !this.canReadRequest;
    },
    canReadInternalDepartments() {
      return this.hasRole('INTERNAL-DEPARTMENT_READ_ALL');
    },
    canReadExternalAccountingCodes() {
      return this.hasRole('EXTERNAL-ACCOUNTING-CODE_READ_ALL');
    },
    canReadSoftwareRequirements() {
      return this.hasRole('SOFTWARE-REQUIREMENT_READ_ALL');
    },
    canReadDocumentTypes() {
      return this.hasRole('DOCUMENT-TYPE_READ_ALL');
    },
    canReadDeliveryMethods() {
      return this.hasRole('DELIVERY-METHOD_READ_ALL');
    },
    canReadTurnaroundTime() {
      return this.hasRole({ oneOf: ['REQUEST_READ_COMPANY', 'REQUEST_READ_ALL'] });
    },
    canReadLocation() {
      if (this.isNewRecord || this.userIsContact) {
        return false;
      }
      return this.canReadRequest || this.canReadRequestAssignedTask;
    },
    canReadCustomFields() {
      return this.canEditCustomFields
        || this.canReadOwnCompanyRequest;
    },
    /*
    REQUEST_UPDATE_COMPANY will allow a user to update the following fields in a request:
      Also Deliver to
      Other CC
      PO
      Instructions and Comments
      Source Files
      everything
      else they should not be able to edit
    */
    canEditOwnCompanyRequest() {
      return this.hasRole('REQUEST_UPDATE_COMPANY');
    },
    canEditOwnRequest() {
      const currentUserEmail = _.get(this, 'userLogged.email') || null;
      const currentRequestOwner = _.get(this, 'requestEntity.contact.email') || null;
      const requestCreator = _.get(this, 'requestEntity.createdBy') || null;
      return this.canEditOwn
        && typeof currentUserEmail === 'string'
        && (currentRequestOwner || requestCreator)
        && currentUserEmail.match(/.+@.+\..+/)
        && (currentUserEmail === currentRequestOwner || currentUserEmail === requestCreator);
    },
    canEditOwn() {
      return this.hasRole('REQUEST_UPDATE_OWN');
    },
    canEditRequestTask() {
      return this.hasRole('TASK_UPDATE_OWN');
    },
    canCreateEditRequestCompany() {
      return this.hasRole({ oneOf: ['REQUEST_CREATE_COMPANY', 'REQUEST_UPDATE_COMPANY'] });
    },
    canUploadFiles() {
      if (this.isNewRecord) {
        return false;
      }
      if (!this.isMandatoryFieldsFilled) {
        return false;
      }
      const areValidRoles = this.canCreate
        || this.canEditOwn
        || this.canEditOwnCompanyRequest
        || this.canEditAll;
      const isValidStatus = !this.status.match('Cancelled|Completed|Delivered');
      return areValidRoles && isValidStatus;
    },
    canReadFinalFiles() {
      return (!this.isNewRecord && !this.canEditRequestTask)
        || this.canEditAll || this.canEditOwnCompanyRequest;
    },
    canEditStatus() {
      if (this.userIsContact) {
        return false;
      }
      if (this.isNewRecord) {
        return false;
      }
      return this.canEditAll;
    },
    canEditProjectManagersList() {
      return this.canEditAll && !this.isNewRecord;
    },
    canEditTurnaroundTime() {
      return this.canEditAll;
    },
    canEditQuoteDueDate() {
      if (!this.requestEntity.requireQuotation) {
        return false;
      }
      return this.inputEnabled;
    },
    canEditRequireQuotation() {
      return !((!this.isNewRecord && this.userIsContact)
      || this.areAllInputsDisabled
      || this.isRequestDelivered
      || this.isRequestWaitingForApproval);
    },
    canReadOnlyOwnTask() {
      return !this.canReadAll && [
        'WORKFLOW_READ_OWN',
        'TASK_READ_OWN',
        'REQUEST_READ_ASSIGNED-TASK',
      ].some((r) => this.hasRole(r));
    },
    canEditPurchaseOrder() {
      return ((this.isNewRecord && this.canCreateOwn)
        || (!this.isNewRecord && this.canEditAll))
        || this.canEditOwnCompanyRequest
        || this.canEditOwnRequest
        || this.canEditAll;
    },
    canReadActivities() {
      return ['ACTIVITY-EMAIL_READ_ALL', 'ACTIVITY-EMAIL_READ_OWN'].some((r) => this.hasRole(r));
    },
    canEditAlsoDeliverTo() {
      return this.inputEnabled || this.canEditOwnCompanyRequest || this.canEditOwnRequest;
    },
    canEditOtherCC() {
      return this.inputEnabled || this.canEditOwnCompanyRequest || this.canEditOwnRequest;
    },
    canReadInternalComments() {
      return this.hasRole('WORKFLOW_CREATE_ALL')
        || this.hasRole('WORKFLOW_UPDATE_ALL')
        || this.hasRole('WORKFLOW_READ_ALL');
    },
    canReadRequest() {
      return this.hasRole('REQUEST_READ_OWN')
        || this.hasRole('REQUEST_READ_ALL');
    },
    canReadAll() {
      return this.hasRole('REQUEST_READ_ALL');
    },
    canEditCurrency() {
      if (this.isNewRecord) {
        return true;
      }
      const workflows = _.get(this, 'requestEntity.workflows', []);
      if (!_.isEmpty(workflows) && workflows.every((w) => !_.isEmpty(w._id))) {
        return false;
      }
      if (this.requestEntity.isQuoteApproved) {
        return false;
      }
      if (this.requestEntity.status === IN_PROGRESS_STATUS) {
        return false;
      }
      return this.hasRole({ oneOf: ['QUOTE_UPDATE_ALL', 'REQUEST_UPDATE_ALL'] });
    },
    canReadAllRequests() {
      return this.hasRole({ oneOf: ['REQUEST_READ_OWN', 'REQUEST_READ_COMPANY', 'REQUEST_READ_ALL'] });
    },
    canEditComments() {
      if (this.isTaskViewRoute) {
        return false;
      }
      if (!this.requestEntity.status) {
        return true;
      }
      if (this.isNewRecord) {
        return (this.canEditAll || this.canCreate || this.canEditOwn);
      }
      return (this.canEditOwnRequest || this.canEditOwnCompanyRequest || this.canEditAll);
    },
    hasEditRole() {
      return this.hasRole({ oneOf: ['REQUEST_UPDATE_ALL', 'REQUEST_UPDATE_OWN', 'REQUEST_UPDATE_COMPANY'] });
    },
    requestWasDelivered() {
      return !_.isNil(_.get(this.requestEntity, 'deliveredAt', null));
    },
    canEditCustomFields() {
      const canBeEdited = this.hasEditRole || (this.canCreate && this.isNewRecord);
      if (this.isRequestCompleted || this.isRequestDelivered) {
        return this.hasRole({ oneOf: ['REQUEST-CUSTOM-FIELDS_UPDATE_OWN', 'REQUEST-CUSTOM-FIELDS_UPDATE_ALL'] }) && canBeEdited;
      }
      return canBeEdited;
    },
    requestStatusesList() {
      const fullList = RequestService.requestStatuses;
      let restrictList = [];
      if (WAITING_STATUSES.includes(this.originalRequestStatus)) {
        restrictList = REQUEST_STATUSES.filter((status) => ![...WAITING_STATUSES, CANCELLED_STATUS].includes(status));
      } else if (this.originalRequestStatus === CANCELLED_STATUS) {
        restrictList = REQUEST_STATUSES.filter((status) => status !== CANCELLED_STATUS);
      } else if (
        [TO_BE_PROCESSED_STATUS, ON_HOLD_STATUS].includes(this.originalRequestStatus)
        && (!this.requestEntity.requireQuotation || this.requestEntity.isQuoteApproved)
      ) {
        restrictList = WAITING_STATUSES;
      } else if (
        [WAITING_FOR_CLIENT_PO_STATUS, DELIVERED_STATUS, IN_PROGRESS_STATUS]
          .includes(this.originalRequestStatus)
      ) {
        restrictList = [...WAITING_STATUSES, TO_BE_PROCESSED_STATUS];
      } else if (
        this.originalRequestStatus === ON_HOLD_STATUS
        && this.requestEntity.isQuoteApproved
      ) {
        restrictList = WAITING_STATUSES;
      } else if (this.originalRequestStatus === COMPLETED_STATUS) {
        restrictList = REQUEST_STATUSES.filter((status) => status !== COMPLETED_STATUS);
      }
      if (this.requestWasDelivered) {
        restrictList = restrictList.concat([IN_PROGRESS_STATUS, TO_BE_PROCESSED_STATUS]);
      }
      return fullList.map((status) => {
        if (restrictList.includes(status.text)) {
          return { text: status.text, value: status.value, disabled: true };
        }
        return status;
      });
    },
    canEditCompany() {
      return this.useAnyCompany && this.isNewRecord;
    },
    canContactReadWorkflow() {
      return this.hasWorkflows && this.userIsContact
        && this.hasRole({ oneOf: VALID_CONTACT_READ_WORKFLOW_ROLES })
        && !['Waiting for Quote', 'Waiting for approval'].includes(this.status);
    },
    canReadWorkflows() {
      return this.hasRole({ oneOf: VALID_WORKFLOW_READ_ROLES }) || this.canContactReadWorkflow;
    },
    canReadQuotes() {
      const hasRoles = this.hasRole({ oneOf: ['QUOTE_READ_COMPANY', 'QUOTE_READ_OWN', 'QUOTE_READ_ALL'] });
      const isWaitingForQuote = WAITING_FOR_QUOTE_STATUS === this.status;
      const isRequestTypeStandard = this.requestType.name === REQUEST_TYPE_STANDARD;
      if (!hasRoles) {
        return false;
      }
      if (isWaitingForQuote && isRequestTypeStandard && this.userIsContact) {
        return false;
      }
      if (this.hasWorkflows || this.userIsContact) {
        return true;
      }
      return false;
    },
    canReadCompetenceLevels() {
      return this.hasRole('COMPETENCE-LEVEL_READ_ALL');
    },
    canEditExpectedQuoteCloseDate() {
      return this.hasRole({ oneOf: ['REQUEST_CREATE_ALL', 'REQUEST_UPDATE_ALL'] });
    },
    canReadExpectedQuoteCloseDate() {
      return this.hasRole({ oneOf: ['REQUEST_CREATE_ALL', 'REQUEST_UPDATE_ALL', 'REQUEST_READ_ALL'] });
    },
    canSaveRequest() {
      return this.canEditAll
        || this.canEditOwn
        || this.canCreate
        || this.canCreateEditRequestCompany;
    },
    canUpdateCompletedRequest() {
      return this.canEditStatus
        || this.hasRole({ oneOf: ['TASK-NOTES_UPDATE_ALL', 'TASK-STATUS_UPDATE_ALL'] });
    },
    requestDetailsVisible() {
      return !this.isNewRecord || this.isTaskViewRoute;
    },
    inputEnabled() {
      return this.canShowInput && !this.areAllInputsDisabled;
    },
    areAllInputsDisabled() {
      return this.isWorkflowInEditMode || this.isRequestCompleted || this.isRequestDelivered;
    },
    canShowInput() {
      return (this.canCreate && this.isNewRecord) || this.canEditAll;
    },
    userIsContact() {
      return this.userLogged.type === CONTACT_USER_TYPE;
    },
    isValidCompany() {
      return !_.isEmpty(this.companyId);
    },
    isValidTitle() {
      return !_.isEmpty(this.requestEntity.title);
    },
    rawComments() {
      const rawCommentsStripped = stripHtml(_.get(this, 'comments', ''));
      return rawCommentsStripped.result;
    },
    isValidCommentsLength() {
      return this.rawComments.length <= MAX_COMMENT_LENGTH;
    },
    isValidComments() {
      if (!this.canEditComments) {
        return true;
      }
      return !_.isEmpty(this.rawComments) && this.isValidCommentsLength;
    },
    isValidInternalCommentsLength() {
      const internalComments = _.defaultTo(_.get(this, 'requestEntity.internalComments', ''), '');
      const rawCommentsStripped = stripHtml(internalComments);
      return rawCommentsStripped.result.length <= MAX_COMMENT_LENGTH;
    },
    isValidLanguageCombinationList() {
      const languageCombinations = _.get(this, 'requestEntity.languageCombinations', []);
      return languageCombinations.every((l) => !_.isEmpty(l.srcLangs)
        && !_.isEmpty(l.tgtLangs));
    },
    isValidCompetenceLevels() {
      if (_.get(this, 'requestEntity.competenceLevels.length', 0) === 0) {
        if (this.canReadCompetenceLevels && !this.userIsContact) {
          return false;
        }
      }
      return true;
    },
    isValidQuoteCurrency() {
      if (!this.canEditCurrency) {
        return true;
      }
      if (this.userIsContact) {
        return true;
      }
      return !_.isEmpty(_.get(this, 'requestEntity.quoteCurrency._id', ''));
    },
    isValidQuoteDueDate() {
      if (this.requestEntity.requireQuotation) {
        if (_.isEmpty(this.requestEntity.quoteDueDate)) {
          return false;
        }
        if (_.get(this.requestEntity, 'quoteDueDate') && moment.isMoment(this.requestEntity.quoteDueDate)) {
          const quoteDueDateMoment = this.requestEntity.quoteDueDate.local();
          return quoteDueDateMoment.isValid() && this.requestEntity.quoteDueDate.isValid();
        }
        return false;
      }
      return true;
    },
    isValidExpectedQuoteCloseDate() {
      if (!this.requestEntity.requireQuotation) {
        return true;
      }
      if (!this.canEditExpectedQuoteCloseDate) {
        return true;
      }
      const quoteDueDate = _.get(this.requestEntity, 'quoteDueDate');
      const expectedQuoteCloseDate = _.get(this.requestEntity, 'expectedQuoteCloseDate');
      if (_.isEmpty(expectedQuoteCloseDate)) {
        return false;
      }
      if (quoteDueDate && expectedQuoteCloseDate.isBefore(quoteDueDate)) {
        return false;
      }
      if (moment.isMoment(expectedQuoteCloseDate)) {
        const expectedQuoteCloseDateMoment = expectedQuoteCloseDate.local();
        return expectedQuoteCloseDateMoment.isValid() && expectedQuoteCloseDate.isValid();
      }
      return true;
    },
    isValidInternalDepartment() {
      const internalDepartmentId = _.get(this.requestEntity, 'internalDepartment._id');
      return !this.canReadInternalDepartments
        || this.isTaskViewRoute
        || (this.canEditAll && !_.isNil(internalDepartmentId));
    },
    isValidExternalAccountingCode() {
      const externalAccountingCodeId = _.get(this.externalAccountingCode, '_id');
      return !_.isNil(externalAccountingCodeId);
    },
    isExternalAccountingCodeRequired() {
      const { company } = this.requestEntity;
      return company && company.isMandatoryExternalAccountingCode;
    },
    selectedExternalAccountingCode() {
      return toOption(this.externalAccountingCode);
    },
    isValidContact() {
      return !_.isEmpty(this.contactId) || !this.mandatoryRequestContact || !this.canEditCompany;
    },
    isValidDataClassification() {
      const dataClassification = _.get(this, 'requestEntity.dataClassification', null);
      if (_.isNil(dataClassification)) return false;
      return _.isString(dataClassification)
        && this.dataClassificationSelectOptions
          .some((option) => option === dataClassification);
    },
    isMandatoryFieldsFilled() {
      return this.isValidCompany
        && this.isValidDeliveryDate
        && this.isValidComments
        && this.isValidQuoteCurrency
        && !_.isEmpty(this.requestEntity.title)
        && this.isValidCompetenceLevels
        && this.isValidInternalDepartment
        && this.isValidQuoteDueDate
        && this.isValidExpectedQuoteCloseDate
        && this.isValidContact
        && this.isValidDataClassification
        && this.isValidTimeToDeliver;
    },
    isValidStatus() {
      if (this.isNewRecord) {
        return true;
      }
      const selectedStatusItem = this.requestStatusesList
        .find((status) => status.text === this.status);
      if (_.isNil(selectedStatusItem) || _.get(selectedStatusItem, 'disabled', false)) {
        return false;
      }
      if (this.status === COMPLETED_STATUS) {
        return this.areTasksCompleted;
      }
      if (this.status === CANCELLED_STATUS) {
        return this.areTasksCompleted;
      }
      return !_.isEmpty(this.status);
    },
    isValidPo() {
      if (this.requestEntity.poRequired) {
        return !_.isEmpty(this.requestEntity.purchaseOrder);
      }
      return true;
    },
    isLoading() {
      return this.areWorkflowsLoading || this.loadingRequest || this.loadingContacts;
    },
    isRequestWithoutWorkflowsValid() {
      if (this.isLoading) {
        return false;
      }
      const validationProperties = [
        'isValidCompany',
        'isValidStatus',
        'isValidInternalCommentsLength',
        'isValidLanguageCombinationList',
        'isValidOtherCC',
        'isValidPo',
      ];
      if (validationProperties.some((prop) => !_.get(this, prop, false))) {
        return false;
      }
      if (!this.isNewRecord) {
        const mustBeNumbersOrNull = _.pick(this.requestEntity, ['rooms',
          'atendees',
          'expectedDurationTime',
        ]);
        _.every(Object.keys(mustBeNumbersOrNull), (k) => {
          if (_.isNil(mustBeNumbersOrNull[k])) {
            return true;
          }
          return typeof mustBeNumbersOrNull[k] === 'number' && mustBeNumbersOrNull[k] >= 0;
        });
      }
      return this.isMandatoryFieldsFilled;
    },
    isValidRequest() {
      return this.isRequestWithoutWorkflowsValid && this.isValidWorkflowList;
    },
    projectedCostTotal() {
      const projectedCostTotal = _.get(this, 'requestEntity.projectedCostTotal', 0);
      return bigJsToNumber(projectedCostTotal);
    },
    projectedGP() {
      return _.get(this, 'requestEntity.projectedCostGp', 0).toFixed(MONEY_VALUE_PRECISION);
    },
    invoiceTotal() {
      const invoiceTotal = _.get(this, 'requestEntity.invoiceTotal', 0);
      return bigJsToNumber(invoiceTotal);
    },
    billTotal() {
      const billTotal = _.get(this, 'requestEntity.billTotal', 0);
      return bigJsToNumber(billTotal);
    },
    billGP() {
      return _.get(this, 'requestEntity.billGp', 0).toFixed(MONEY_VALUE_PRECISION);
    },
    isRequestCompleted() {
      return this.requestEntity.status === COMPLETED_STATUS;
    },
    isRequestDelivered() {
      return this.requestEntity.status === DELIVERED_STATUS;
    },
    isRequestWaitingForApproval() {
      return this.requestEntity.status === WAITING_FOR_APPROVAL_STATUS;
    },
    isValid() {
      return !this.isSaveButtonDisabled && this.canSaveRequest;
    },
    hasMandatoryFieldsGovernanceRoles() {
      return this.userIsContact || this.hasRole('INTERNAL-DEPARTMENT_READ_ALL');
    },
    isRequestInWaitingStatus() {
      return WAITING_STATUSES.includes(this.requestEntity.status);
    },
    canEditIpDetails() {
      return this.isRequestWaitingForApproval && this.hasRole('IP-QUOTE_UPDATE_OWN') && this.userIsContact;
    },
    hasErrorNotifications() {
      if (!_.isArray(this.notifications)) {
        return false;
      }
      return !_.isEmpty(this.notifications.filter((n) => n.state === 'danger'));
    },
    isSaveButtonDisabled() {
      if (this.hasErrorNotifications) {
        return true;
      }
      if (this.isNewRecord && this.canCreateAll && !this.hasMandatoryFieldsGovernanceRoles) {
        return true;
      }
      if (this.entityOutdated) {
        return true;
      }
      if (!this.isValidRequest) {
        return true;
      }
      if (!this.hasRequestChanged && !this.isNewRecord) {
        return true;
      }
      if (this.isExternalAccountingCodeRequired && !this.isValidExternalAccountingCode) {
        return true;
      }
      return this.isRequestCompleted && !this.canUpdateCompletedRequest;
    },
    hasRequestChanged() {
      const EXCLUDED_FIELDS = ['workflows'];
      return Object.keys(this.requestEntity).some((key) => {
        const newValue = _.get(this, `requestEntity.${key}`);
        const oldValue = _.get(this, `originalRequest.${key}`);
        const newFieldType = typeof newValue;
        const oldFieldType = typeof oldValue;
        if (EXCLUDED_FIELDS.includes(key)) {
          return false;
        }
        if (newFieldType === 'object' || oldFieldType === 'object') {
          if (moment.isMoment(newValue)) {
            return !newValue.isSame(oldValue);
          }
          const isEmpty = _.isEmpty(_.get(newValue, 'name', ''))
            && _.isEmpty(_.get(newValue, 'email', ''));
          if (oldValue === null && !isEmpty) {
            return true;
          }
          if (_.has(oldValue, '_id') || _.has(newValue, '_id')) {
            return _.get(oldValue, '_id', null) !== _.get(newValue, '_id', null);
          }
          if (!isEmpty) {
            return _.get(oldValue, 'name') !== newValue.name || _.get(oldValue, 'email') !== newValue.email;
          }
          if (_.get(oldValue, 'isoCode') !== _.get(newValue, 'isoCode')) {
            return true;
          }
        }
        if (Array.isArray(newValue)) {
          if (newValue.length !== oldValue.length) {
            return true;
          }
          return _.differenceWith(newValue, oldValue, _.isEqual).length > 0;
        }
        if ((newFieldType === 'string') || (newFieldType === 'boolean') || (newFieldType === 'undefined')) {
          return newValue !== oldValue;
        }
        return false;
      });
    },
    opportunitySelected() {
      return {
        text: _.defaultTo(this.requestEntity.opportunityNo, ''),
        value: _.defaultTo(this.requestEntity.opportunityNo, ''),
      };
    },
    canCloneRequest() {
      return this.$route.name === 'request-edition' && !this.isRequestTypeIP;
    },
    isRequestTypeExists() {
      return !_.isNil(this.requestEntity.requestType);
    },
    requestType: {
      get() {
        return _.get(this.requestEntity, 'requestType', REQUEST_TYPE_EMPTY);
      },
      set(newRequestType) {
        this.requestEntity.requestType = _.defaultTo(newRequestType, REQUEST_TYPE_EMPTY);
      },
    },
    isRequestTypeIP() {
      return _.get(this.requestType, 'name', '') === 'IP';
    },
    thirtyMonthsDeadline() {
      const date = this.requestEntity.ipPatent.thirtyMonthsDeadline;
      return moment(date).format('DD/MM/YYYY');
    },
    isIpOrder() {
      return this.isRequestTypeIP && !this.requestEntity.requireQuotation;
    },
    isEpo() {
      return _.get(this.requestEntity, 'ipPatent.patentPublicationNumber', '').includes('EP');
    },
    isWipo() {
      return _.get(this.requestEntity, 'ipPatent.patentApplicationNumber', '').includes('PCT');
    },
    isTranslationOnlyService() {
      return _.get(this, 'requestEntity.ipPatent.service', '') === TRANSLATION_ONLY_SERVICE;
    },
    canReadLanguageCombinations() {
      if (this.userLogged.type === 'Contact' && this.lsp.supportsIpQuoting && this.isTranslationOnlyService) return false;
      return true;
    },
    areTasksCompleted() {
      let areAllCompleted = true;
      forEachProviderTask(this.requestEntity, ({ providerTask }) => {
        const isProviderTaskFinished = [
          PROVIDER_TASK_STATUS_APPROVED,
          PROVIDER_TASK_STATUS_CANCELLED,
        ].includes(providerTask.status);
        if (!isProviderTaskFinished) {
          areAllCompleted = false;
        }
      });
      return areAllCompleted;
    },
    workflowLanguageSet() {
      return this.requestEntity.workflows.reduce((set, workflow) => {
        if (!_.isEmpty(workflow.srcLang.isoCode)) {
          set.add(workflow.srcLang.isoCode);
        }
        if (!_.isEmpty(workflow.tgtLang.isoCode)) {
          set.add(workflow.tgtLang.isoCode);
        }
        return set;
      }, new Set());
    },
    toggleCollapseIconClass() {
      return this.isInterpretingSpecificSectionCollapsed ? 'fa-expand' : 'fa-compress';
    },
    allDocuments() {
      const files = [];
      _.get(this, 'requestEntity.languageCombinations', []).forEach((lc) => files.push(...lc.documents));
      return files;
    },
    activeDocuments() {
      return this.allDocuments.filter(isActiveDocument);
    },
    allTasksCompletedOrApproved() {
      const allLinguisticTasks = _.get(this, 'requestEntity.workflows', [])
        .map((workflow) => _.get(workflow, 'tasks', []).filter((task) => _.keys(LINGUISTIC_TASKS).includes(task.ability)))
        .flat();
      const notCompletedTaskExists = allLinguisticTasks
        .map((task) => task.providerTasks)
        .flat()
        .find((providerTask) => ![PROVIDER_TASK_STATUS_COMPLETED, PROVIDER_TASK_STATUS_APPROVED]
          .includes(providerTask.status));
      return !_.isEmpty(allLinguisticTasks) && _.isNil(notCompletedTaskExists);
    },
    canReadStatistics() {
      return this.hasRole({
        oneOf: [
          'STATISTICS_READ_ALL',
          'STATISTICS_READ_OWN',
          'STATISTICS_READ_COMPANY',
        ],
      });
    },
    canReadPortalCatFinalFiles() {
      return this.hasRole('PIPELINE-RUN_UPDATE_ALL');
    },
    canRunStatistics() {
      return this.hasRole({ oneOf: ['STATISTICS_CREATE_ALL'] })
        && this.documents.length > 0
        && !this.uploading
        && !this.requestEntity.pcSettings.statisticsGenerated
        && this.importedCatFiles.length > 0 && !this.isCatImportRunning;
    },
    hasPortalCatFiles() {
      return this.documents.some((doc) => doc.isPortalCat);
    },
    hasRequestAnalysis() {
      return this.requestAnalysis.length > 0;
    },
    canReadWorkflowsCount() {
      return this.hasRole({ oneOf: ['WORKFLOW_CREATE_ALL', 'WORKFLOW_READ_ALL', 'WORKFLOW_UPDATE_ALL'] });
    },
    workflowsCount() {
      return _.get(this.originalRequest, 'workflows.length', 0);
    },
    canEditServiceAndDeliveryType() {
      return this.isValidStatus && (this.requestEntity.status === 'Waiting for approval' || this.requestEntity.isQuoteApproved) && this.hasRole(['SERVICE-TYPE_READ_ALL', 'DELIVERY-TYPE_READ_ALL']);
    },
    pcLockedSegments: {
      get() {
        return _.get(this, 'requestEntity.pcSettings.lockedSegments') || {
          includeInClientStatistics: false,
          includeInProviderStatistics: false,
        };
      },
      set(value) {
        _.set(this, 'requestEntity.pcSettings.lockedSegments', value);
      },
    },
  },
  methods: {
    ...mapActions('app', ['triggerGlobalEvent', 'setAppTitle', 'setUser']),
    ...mapActions('cache', ['invalidateCache']),
    ...mapActions('notifications', ['pushNotification', 'deleteNotification']),
    ...mapActions('sideBar', ['setCollapsed']),
    ...mapActions('tasks', ['onRequestUpdate']),
    async _initialize() {
      this.requestService = requestService;
      if (this.hasRequestTemplate) {
        const request = Object.assign(newTemplate(), _.clone(this.$route.params.request));
        await this._refreshEntity({ data: { request } });
      } else if (!_.isEmpty(this.requestEntityId)) {
        this.loadingRequest = true;
        try {
          const response = await requestService.get(this.requestEntityId, {
            withCATData: true,
          });
          await this._refreshEntity(response);
          this.startPcPolling();
          this.checkForPortalCatQaIssues();
          this.fetchExportStatus();
        } catch (err) {
          const notification = {
            title: 'Request was not found',
            message: _.get(err, 'message'),
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        } finally {
          this.loadingRequest = false;
        }
      } else {
        let requestType = REQUEST_TYPE_EMPTY;
        let requireQuotation = false;
        let quoteDueDate = null;
        let expectedQuoteCloseDate = null;
        if (this.lsp.supportsIpQuoting) {
          const requestTypeRes = await requestTypeService.retrieve({
            filter: {
              name: 'Standard',
            },
          })
            .catch((e) => {
              this.pushNotification({
                title: 'Can not retrieve the request type Standard ',
                message: e.message,
                state: 'warning',
                ttl: 3,
              });
            });
          requestType = _.get(requestTypeRes, 'data.list.0');
          const requireQuotationParam = _.get(this.$route, 'query.requireQuotationParam', false);
          requireQuotation = Boolean(requireQuotationParam);
          const quoteDueDateParam = Boolean(
            _.get(this.$route, 'query.requireQuotationParam', false),
          );
          if (quoteDueDateParam) {
            quoteDueDate = moment().add(1, 'day');
            expectedQuoteCloseDate = moment().add(2, 'day');
          }
        }
        const defaultValues = this.lsp.supportsIpQuoting ? {
          requestType, requireQuotation, quoteDueDate, expectedQuoteCloseDate,
        } : {};
        this.requestEntity = newTemplate(defaultValues);
        this.originalRequest = newTemplate(defaultValues);
        this.loadingRequest = false;
      }
      if (this.userLogged.type === userService.userTypes.contact && !this.useAnyCompany) {
        if (this.userLogged.company && this.isNewRecord) {
          this.requestEntity.company = this.userLogged.company;
          this.requestEntity.contact = this.userLogged._id;
          const checkIfLanguageCombinationFull = (lc) => _.get(lc, 'srcLangs.length', 0) + _.get(lc, 'tgtLangs.length', 0) > 1;
          const hasRequestLanguageCombinations = _.every(this.requestEntity.languageCombinations, checkIfLanguageCombinationFull);
          if (hasRequestLanguageCombinations) {
            return;
          }
          const preferredLanguageCombination = _.get(this, 'userLogged.preferences.preferredLanguageCombination', { srcLangs: [], tgtLangs: [] });
          const hasPreferredLanguageCombination = checkIfLanguageCombinationFull(preferredLanguageCombination);
          if (hasPreferredLanguageCombination) {
            this.requestEntity.languageCombinations = [{
              ...preferredLanguageCombination,
              preferredLanguageCombination: false,
              documents: [],
            }];
          } else {
            this.requestEntity.languageCombinations = [{
              tgtLangs: [],
              srcLangs: [],
              documents: [],
              preferredLanguageCombination: false,
            }];
          }
        }
      }
      this.statisticsGenerationNotification = warningNotification('Statistics are still being generated. Please wait.', null, null, 'Warning');
      this.catImportRunningNotification = warningNotification('Files are being imported. Please wait.', null, null, 'Warning');
    },
    manageActivity(event) {
      event.preventDefault();
      this.$emit('activity-list', { filter: this.activitiesFilter });
    },
    onAddLanguageCombination() {
      const newNumber = _.lastIndexOf(this.requestEntity.languageCombinations);
      this.requestEntity.languageCombinations.push({
        number: newNumber + 1,
        tgtLangs: [],
        srcLangs: [],
        documents: [],
        preferredLanguageCombination: false,
      });
    },
    onWorkflowChange(value) {
      this.hasWorkflowChanged = value;
    },
    onDeleteLanguageCombination(index) {
      const languageCombinationsClone = this.requestEntity.languageCombinations.slice(0);
      languageCombinationsClone.splice(index, 1);
      this.requestEntity.languageCombinations = languageCombinationsClone;
    },
    onLanguageCombinationUpdate(languageCombination, index) {
      const languageCombinationsClone = _.clone(this.requestEntity.languageCombinations);
      languageCombinationsClone[index] = languageCombination;
      this.requestEntity.languageCombinations = languageCombinationsClone;
    },
    handleFiles(event, files, languageCombinationId) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = !_.isNil(files.item) ? files.item(i) : files[i];
        if (!this.isFileWithExtension(file)
            || (this.isAutoScanWorkflow && !this.checkFileExtensionPdf(file))) {
          return;
        }
        formData.append(`files_${i}`, file, file.name);
      }
      return this.uploadFiles(formData, files, languageCombinationId);
    },
    formatCurrencySelectOption: ({ isoCode, _id }) => ({
      text: isoCode,
      value: _id,
    }),
    isFileWithExtension(file) {
      const fileExtension = (/[.]/.exec(file.name)) ? /[^.]+$/.exec(file.name) : undefined;
      if (_.isEmpty(fileExtension)) {
        const notification = {
          title: `Can not upload the file ${file.name} save request`,
          message: 'Files must have an extension',
          state: 'warning',
          ttl: 3,
        };
        this.pushNotification(notification);
        return false;
      }
      return true;
    },
    checkFileExtensionPdf(file) {
      const fileExtension = (/[.]/.exec(file.name)) ? /[^.]+$/.exec(file.name) : undefined;
      if (_.isEmpty(fileExtension) || fileExtension[0] !== 'pdf') {
        const notification = {
          title: 'Error',
          message: `Only PDF files are accepted with Request workflow '${WORKFLOW_TYPE_AUTO_SCAN}'`,
          state: 'danger',
          ttl: 3,
        };
        this.pushNotification(notification);
        this.uploading = false;
        return false;
      }
      return true;
    },
    onQuoteDetailOpen() {
      this.$ua.trackEvent('Request - Workflows', 'Click', 'Quote Detail Btn');
      this.$router.push({
        name: this.isQuote ? 'quote-quote-detail' : 'request-quote-detail',
      });
    },
    onQuoteEditOpen() {
      this.$ua.trackEvent('Request - Workflows', 'Click', 'Quote Edit Btn');
      const routeObj = {
        params: {
          entityId: this.requestEntityId,
        },
        query: {
          translationOnly: this.isTranslationOnlyService,
        },
      };
      if (this.isWipo) {
        routeObj.name = 'ip-quote-wipo-edit';
      } else if (this.isEpo) {
        routeObj.name = 'ip-quote-epo-edit';
      } else if (this.isTranslationOnlyService) {
        routeObj.name = 'ip-quote-no-db-edit';
      } else {
        routeObj.name = 'ip-quote-no-db-filing-edit';
      }
      this.$router.push(routeObj);
    },
    onWorkflowsValidation(validation) {
      this.isValidWorkflowList = validation;
    },
    onOtherCCValidation(isValidOtherCC) {
      this.isValidOtherCC = isValidOtherCC;
    },
    onDeliveryDateChange(newDeliveryDate) {
      const now = moment();
      if (moment(newDeliveryDate).isBefore(now) && this.isNewRecord) {
        this.pushNotification({
          title: 'Warning!',
          message: 'You are selecting a Target Date in the past. Are you sure?',
          state: 'warning',
        });
      }
      this.$set(this.requestEntity, 'deliveryDate', newDeliveryDate);
    },
    onExpectedStartDateChange(newDate) {
      this.requestEntity.expectedStartDate = !_.isNil(newDate) ? newDate : '';
    },
    onActualStartDateChange(newDate) {
      this.requestEntity.actualStartDate = !_.isNil(newDate) ? newDate : '';
    },
    onActualDeliveryDateChange(newDate) {
      this.requestEntity.actualDeliveryDate = !_.isNil(newDate) ? newDate : '';
    },
    onQuoteDueDateChange(newQuoteDueDate) {
      this.$set(this.requestEntity, 'quoteDueDate', newQuoteDueDate);
    },
    onExpectedQuoteCloseDateChange(newExpectedQuoteCloseDate) {
      const quoteDueDate = _.get(this.requestEntity, 'quoteDueDate', null);
      if (quoteDueDate && moment(newExpectedQuoteCloseDate).isBefore(quoteDueDate)) {
        this.pushNotification({
          title: 'Warning!',
          message: 'You are selecting a Close Date in the past.',
          state: 'warning',
        });
      }
      this.$set(this.requestEntity, 'expectedQuoteCloseDate', newExpectedQuoteCloseDate);
    },
    triggerDownload(event) {
      event.preventDefault();
      this.downloading = true;
      this.$refs.iframeDownload.download();
    },
    onDownloadFinished() {
      this.downloading = false;
    },
    onSrcFilesDownloadFinished() {
      this.downloadingSrcFiles = false;
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.downloadingSrcFiles = false;
      this.pushNotification(notification);
    },
    isFormReadyForFileUploading(files) {
      if (this.isNewRecord) {
        const notification = {
          title: 'Error',
          message: 'Request has to be saved, including language combinations, before you are able to attach file',
          state: 'warning',
          ttl: 3,
        };
        this.pushNotification(notification);
        this.resetSrcFileInput();
        return false;
      }
      const file = _.get(files, '[0]', files);
      if (_.isNil(file.name)) {
        return false;
      }
      if (isFileAlreadyAddedToRequest(this.requestEntity, file.name)) {
        this.failedFiles = [file.name];
        this.resetSrcFileInput();
        this.pushNotification({
          title: 'Error',
          message: 'File name is identical with another file name in the request. Uploading is not allowed.',
          state: 'danger',
        });
        return false;
      }
      if (_.isEmpty(getFileWithExtension(file.name))) {
        const notification = {
          title: `Can not upload the file ${file.name}`,
          message: 'Files must have an extension',
          state: 'warning',
          ttl: 3,
        };
        this.pushNotification(notification);
        this.resetSrcFileInput();
        return false;
      }
      if (!this.isValidRequest) {
        this.resetSrcFileInput();
        const notification = {
          title: 'Missing mandatory fields',
          message: 'Please fill up mandatory fields before uploading files',
          state: 'warning',
        };
        this.pushNotification(notification);
        return false;
      }
      return true;
    },
    async onFileUpload(event, languageCombination) {
      const files = _.defaultTo(_.get(event, 'target.files', null), [event]);
      if (!this.isFormReadyForFileUploading(files)) {
        return false;
      }
      this.uploading = true;
      this.stopRequestAnalysisStatusPolling();
      let isUploadingAllowedForIp = true;
      try {
        await companyService.isUploadingAllowedForIp(this.requestEntity.company._id);
      } catch (err) {
        isUploadingAllowedForIp = false;
        if (this.requestService.uploadCanceled) return;
        const notification = {
          title: 'Error',
          message: _.get(err, 'status.message', 'Your IP is not allowed to upload files for this company'),
          state: 'danger',
        };
        this.pushNotification(notification);
      }
      if (!isUploadingAllowedForIp) {
        this.uploading = false;
        return;
      }
      await this.handleFiles(event, files, languageCombination);
      this.uploading = false;
    },
    onContactLoaded(loadState) {
      this.loadingContacts = !loadState.loaded;
      if (loadState.loaded) {
        this.contacts = loadState.contacts;
      }
    },
    onPartnerSelect(partners) {
      if (Array.isArray(partners)) {
        this.requestEntity.partners = partners.map((u) => ({
          _id: u.value,
          name: u.text,
        }));
      }
    },
    _handleSuccessfulFileUploading(uploadResponse) {
      if (_.isEmpty(this.failedFiles)) {
        this.pushNotification(successNotification('Request was updated successfully'));
      }
      this._refreshEntity(uploadResponse);
      this.resetFileUploadingParams();
    },
    _uploadFiles({ formData, newDocuments, languageCombinationId }) {
      this.uploading = true;
      let uploadResponse = null;
      const uploadParams = {
        requestId: this.requestEntityId,
        languageCombinationId,
      };
      return requestService.uploadRequestDocument(formData, uploadParams)
        .then((response) => {
          uploadResponse = response;
          const request = _.get(response, 'data.request');
          request.languageCombinations.forEach((combination) => {
            if (combination._id === languageCombinationId) {
              newDocuments = _.intersectionBy(combination.documents, newDocuments, 'name');
            }
          });
          return { newDocuments, languageCombinationId };
        })
        .catch((err) => {
          if (this.requestService.uploadCanceled) {
            const canceledNotification = {
              title: 'Warning',
              message: 'Upload was canceled',
              state: 'warning',
              ttl: 5,
            };
            this.requestService.uploadCanceled = false;
            this.pushNotification(canceledNotification);
            return;
          }
          this.failedFiles = _.get(err, 'data.failedUploads', []);
          const notification = {
            title: 'Error',
            message: _.get(err, 'status.message', 'Unknown error'),
            state: 'danger',
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          newDocuments.forEach((newDocument) => {
            if (_.isNil(this.processedDocuments.find((d) => d.name === newDocument.name))) {
              this.processedDocuments.push(newDocument);
            }
          });
          this._handleSuccessfulFileUploading(uploadResponse);
        });
    },
    uploadFiles(formData, files, languageCombinationId) {
      const newDocuments = Array.from(files).map((file) => ({
        isReference: false,
        isInternal: false,
        isConfidential: false,
        name: file.name,
        mime: file.type,
        size: file.size,
        md5Hash: PENDING_DOCUMENT_STATE,
      }));
      this.documentsToUpload.push(...newDocuments);
      return this._uploadFiles({ formData, newDocuments, languageCombinationId });
    },
    cancelUpload() {
      requestService.cancelUpload();
    },
    resetFileUploadingParams() {
      this.documentsToUpload = [];
      this.uploadPromises = [];
      this.processedDocuments = [];
      this.failedFiles = [];
      this.uploading = false;
      this.saving = false;
      this.resetSrcFileInput();
    },
    onWorkflowTaskDocumentUpload(isUploading) {
      this.uploading = isUploading;
    },
    onWorkflowUpdate(newValue) {
      this.editedWorkflowIndex = newValue;
    },
    resetSrcFileInput() {
      _.forEach(this.$refs.languageCombination, (combination) => {
        if (combination.$refs.fileUpload) {
          combination.$refs.fileUpload.value = '';
        }
      });
    },
    saveWorkflow(workflowIndex) {
      const requestId = this.requestEntity._id;
      const workflow = _.get(this.requestEntity, `workflows[${workflowIndex}]`);
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
      const workflowId = workflow._id;
      const transformedWorkflow = transformWorkflow(workflow);
      if (_.isNil(workflowId)) {
        return workflowService.create(requestId, {
          workflow: transformedWorkflow,
        }, { withCATData: true })
          .then((response) => {
            this._refreshEntity(response);
            this.pushNotification(successNotification('Workflow was created successfully'));
            this.editedWorkflowIndex = null;
          }).catch((err) => {
            this._onUpdateError(err);
          });
      }
      workflowService.edit(requestId, workflowId, {
        workflow: transformedWorkflow,
      }, { withCATData: true })
        .then((response) => {
          this._refreshEntity(response);
          this.pushNotification(successNotification('Workflow was updated successfully'));
          this.editedWorkflowIndex = null;
        }).catch((err) => {
          this._onUpdateError(err);
        });
    },
    closeRequest() {
      if (!this.hasWorkflowChanged) {
        return this.close();
      }
      const handler = (result) => {
        if (!result.confirm) {
          this.shouldLeavePage = true;
          return this.close();
        }
        this.saveWorkflow(this.editedWorkflowIndex);
      };
      const dialogOptions = {
        handler,
        title: 'Warning',
        message: WORKFLOW_CHANGES_WARN_MESSAGE,
        dataE2eType: 'save-workflow-dialog',
      };
      return this.onConfirmDialogShow(dialogOptions);
    },
    close() {
      if (this.$route.name === 'task-detail') {
        this.$router.push({
          name: 'task-grid',
        }).catch((err) => { console.log(err); });
      } else {
        this.$router.push({
          name: (this.isTaskViewRoute) ? 'task-management' : 'list-request',
        }).catch((err) => { console.log(err); });
      }
    },
    onDeliveryDate(deliveryDate) {
      this.$set(this.requestEntity, 'deliveryDate', deliveryDate);
    },
    getDocumentIndex(document) {
      const len = this.requestEntity.documents.length;
      let index = -1;
      for (let i = 0; i < len; i++) {
        if (this.requestEntity.documents[i]._id === document._id) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        return;
      }
      return index;
    },
    onDocumentDelete(document) {
      if (this.canEditAll || this.canEditOwn || this.canEditOwnCompanyRequest) {
        this.loadingRequest = true;
        requestService.deleteDocument(document._id, this.requestEntityId)
          .then(this._refreshEntity)
          .catch((err) => {
            const notification = {
              title: 'Error deleting document',
              message: _.get(err, 'status.message'),
              state: 'danger',
            };
            notification.response = err;
            this.pushNotification(notification);
            this.uploading = false;
            this.saving = false;
          })
          .finally(() => {
            this.loadingRequest = false;
          });
      }
    },
    onEditInline(eventData) {
      eventData.item.index = eventData.index;
      this.$parent.push({ text: 'Request detail', type: 'request-inline-edit', entity: eventData.item });
    },
    // Called by entity-edit when pressing Ctrl + S or CMD + s
    save() {
      if (!this.isNewRecord) {
        const label = this.status.match('Waiting for Quote|Waiting for approval') ? 'Save-Quote Btn' : 'Save-Order Btn';
        this.$ua.trackEvent('Request', 'Click', label);
      }
      return this.saveRequest();
    },
    confirmedSaveRequest(confirmData) {
      if (confirmData.confirm) {
        this.saveRequest();
      }
    },
    saveRequest() {
      if (!this.isValidRequest) {
        const notification = {
          title: 'Request can not be saved',
          state: 'danger',
        };
        this.pushNotification(notification);
        return Promise.reject(new Error('Failed to save request'));
      }
      if (!_.isEmpty(this.requestEntity.workflows)) {
        this.isValidWorkflowList = areValidWorkflows(
          this.requestEntity.workflows,
          this.abilityList,
          this.canReadFinancialSections,
        );
      }
      if (!this.isValidWorkflowList) {
        return false;
      }
      return this.onEntitySave();
    },
    async _refreshEntity(response) {
      if (_.isEmpty(_.get(response, 'data.request'))) {
        await this._initialize();
        await this.$nextTick();
        return this.$emit('request-refreshed');
      }
      if (_.get(response, 'data.request.deliveryDate')) {
        response.data.request.deliveryDate = moment(response.data.request.deliveryDate, 'YYYY-MM-DDTHH:mm:ssZ');
      }
      if (_.get(response, 'data.request.quoteDueDate')) {
        response.data.request.quoteDueDate = moment(response.data.request.quoteDueDate, 'YYYY-MM-DDTHH:mm:ssZ');
      }
      if (_.get(response, 'data.request.expectedQuoteCloseDate')) {
        response.data.request.expectedQuoteCloseDate = moment(response.data.request.expectedQuoteCloseDate, 'YYYY-MM-DDTHH:mm:ssZ');
      }
      const request = _.get(response, 'data.request', null);
      this.isUserIpAllowed = _.get(response, 'data.isUserIpAllowed', true);

      if (_.isNil(request)) {
        const notification = {
          title: 'Request was not found',
          message: 'Request was not found',
          state: 'danger',
        };
        return this.pushNotification(notification);
      }
      if (_.isEmpty(_.get(request, 'internalDepartment._id'))) {
        request.internalDepartment = { _id: null, name: '' };
      }
      if (_.isEmpty(_.get(request, 'externalAccountingCode._id'))) {
        request.externalAccountingCode = { _id: null, name: '' };
      } else {
        this.externalAccountingCode = _.get(request, 'externalAccountingCode');
      }
      if (_.isEmpty(_.get(request, 'invoiceCompany._id'))) {
        request.invoiceCompany = { _id: null, name: '', hierarchy: '' };
      }
      if (_.isEmpty(_.get(request, 'invoiceContact._id'))) {
        request.invoiceContact = { _id: null, firstName: '', lastName: '' };
      }
      if (!_.has(request, 'actualDeliveryDate')) {
        request.actualDeliveryDate = null;
      }
      const availableTimeToDeliver = _.get(this, 'requestEntity.company.availableTimeToDeliver', []);
      if (_.has(request, 'company')) {
        request.company.availableTimeToDeliver = availableTimeToDeliver;
      }
      this.requestEntity = { ...this.requestEntity, ...request };

      this.requestEntity._id = _.get(request, '_id');
      this.requestEntity.readDate = _.get(response, 'data.request.readDate');
      if (_.isNil(_.get(this.requestEntity, 'internalDepartment'))) {
        this.requestEntity.internalDepartment = { _id: null, name: '' };
      }
      const location = _.get(request, 'location', '');
      this.locationsAvailable = [location];
      this.company = _.get(request, 'company');
      if (_.has(request, 'schedulingCompany._id')) {
        this.schedulingCompany = request.schedulingCompany;
      }
      if (_.has(request, 'insuranceCompany._id')) {
        this.insuranceCompany = request.insuranceCompany;
      }
      if (_.has(request, 'schedulingContact._id')) {
        this.schedulingContact = _.get(request, 'schedulingContact', null);
      }
      this.originalRequestStatus = _.get(request, 'status');
      this.schedulingStatus = { ..._.get(request, 'schedulingStatus') };
      if (this.contact && _.isEmpty(_.get(this, 'requestEntity.projectManagers', []))) {
        this.requestEntity.projectManagers = _.get(this, 'contact.projectManagers', []);
      }
      if (_.has(request, 'quoteCurrency._id')) {
        this.selectedRequestCurrency = request.quoteCurrency._id;
      }
      this.originalRequest = _.cloneDeep(this.requestEntity);
      if (_.isEmpty(this.requestEntity.workflows)) {
        this.isValidWorkflowList = true;
      }
      if (this.hasTimeToDeliverOptions && this.availableTimeToDeliver.length === 0) {
        this.retrieveCompanyAvailableTimeToDeliver(this.companyId);
      }
      if (_.isString(this.contactId)) {
        this.retrieveContactSalesRep(this.contactId);
      }
      if (!_.isEmpty(this.requestEntity.no)) {
        this.setAppTitle(this.requestEntity.no);
      }
      if (this.isPortalCat && this.canReadStatistics
        && this.requestEntity.pcSettings.statisticsGenerated) {
        this.requestAnalysis = [];
        await this.getRequestAnalysis();
      }
      if (this.requestType) {
        const url = new URL(window.location);
        url.searchParams.set('type', this.requestType.name);
        window.history.pushState(null, '', url.toString());
      }
      this.hasWorkflowChanged = false;
      await this.$nextTick();
      this.$emit('request-refreshed');
    },
    onEntitySave() {
      const request = { ...this.requestEntity };
      const requestToSend = transformRequest(request);
      this.saving = true;
      document.saving = true;
      if (requestToSend._id) {
        const currentIndex = request.index;
        delete request.index;
        return requestService.edit(requestToSend).then(async (response) => {
          // invalidate the request grid cache, the request should be executed
          // in order to retrieve this new change.
          this.invalidateCache(DASHBOARD_NAME);
          this.invalidateCache(REQUEST_GRID_NAME);
          if (request.requireQuotation) {
            // if quotation, invalidate the cached data for quotes
            this.invalidateCache(QUOTE_GRID_NAME);
          }
          this.pushNotification(successNotification('Request was updated successfully'));
          this.onRequestUpdate(this.requestEntity);
          this._refreshEntity(response);
          this.$emit('request-saved');
        }).catch((err) => {
          const code = _.get(err, 'status.code');
          if (code === 409) {
            this.entityOutdated = true;
          }
          this.uploading = false;
          this.saving = false;
          this._onUpdateError(err);
          request.index = currentIndex;
        }).finally(() => {
          this.saving = false;
          document.saving = false;
        });
      }
      return requestService.create(requestToSend).then((response) => {
        // invalidate the request grid cache, the request should be executed
        // in order to retrieve this new data.
        this.invalidateCache(REQUEST_GRID_NAME);
        this.pushNotification(successNotification('Request was created successfully'));
        this._refreshEntity(response);
        if (this.userIsContact) {
          this.setContactPreferredLanguageCombination(requestToSend);
        }
        this.$router.replace({
          name: this.isQuote ? 'quote-edition' : 'request-edition',
          params: {
            requestId: this.requestEntity._id,
          },
        });
      }).catch((errResponse) => {
        this.uploadPromises = [];
        const notification = {
          title: 'Error',
          message: _.get(errResponse, 'status.message'),
          state: 'danger',
        };
        this.uploading = false;
        this.saving = false;
        notification.response = errResponse;
        this.pushNotification(notification);
      }).finally(() => {
        this.saving = false;
        document.saving = false;
      });
    },
    onWorkflowsLoading(loading) {
      this.areWorkflowsLoading = loading;
    },
    onOpportunitySelected(opportunity) {
      this.$set(this.requestEntity, 'opportunityNo', opportunity.text);
    },
    onSchedulingCompanySelected(schedulingCompany) {
      this.schedulingCompany = schedulingCompany;
      if (_.isEmpty(schedulingCompany)) {
        this.requestEntity.schedulingContact = {};
      }
    },
    onCompanySelected(company) {
      this.contact = null;
      if (!_.isNil(company)) {
        this.requestEntity.company = company;
        const companyDataClassification = _.get(company, 'dataClassification');
        if (companyDataClassification) {
          this.requestEntity.dataClassification = companyDataClassification;
        }
        const includeInClientStatistics = _.get(company, 'pcSettings.lockedSegments.includeInClientStatistics', false);
        const includeInProviderStatistics = _.get(company, 'pcSettings.lockedSegments.includeInProviderStatistics', false);
        this.requestEntity.pcSettings.lockedSegments.includeInClientStatistics = includeInClientStatistics;
        this.requestEntity.pcSettings.lockedSegments.includeInProviderStatistics = includeInProviderStatistics;
      }
    },
    onExternalAccountingCodeSelected(externalAccountingCode) {
      this.externalAccountingCode = {
        _id: externalAccountingCode._id,
        name: externalAccountingCode.companyExternalAccountingCode,
      };
    },
    onInsuranceCompanySelected(company) {
      this.insuranceCompany = company;
    },
    onInvoiceToCompanySelected(company) {
      this.requestEntity.invoiceCompany = company;
      if (_.isEmpty(company)) {
        this.requestEntity.invoiceContact = {};
      }
    },
    formatInternalDepartmentSelectOption: ({ name = '', _id = '' }) => ({
      text: name,
      value: { name, _id },
    }),
    formatStatusOption(option) {
      if (_.isObject(option) && _.has(option, 'text')) {
        return option;
      }
      return { text: `${option}`, value: option };
    },
    cloneRequest() {
      const template = _.omit(newTemplate(), ['_id', 'documents', 'workflows', 'deliveredAt']);
      const request = _.pick(this.requestEntity, _.keys(template));
      request.languageCombinations.forEach((l) => (l.documents = []));
      Object.assign(
        request,
        {
          timeToDeliver: '',
          title: `${request.title}_Clone`,
          workflows: [],
          status: '',
          requestInvoiceStatus: NOT_INVOICED_STATUS,
          deliveryDate: null,
          createdAt: '',
          updatedAt: '',
          no: '',
          serviceDeliveryTypeRequired: false,
          deliveryTypeId: null,
          serviceTypeId: null,
          workflowTemplate: '',
        },
      );
      if (this.isPortalCat) {
        if (this.canReadStatistics) {
          this.showNotificationIfStatisticsRunning = false;
          this.showNotificationIfStatisticsSucceeded = false;
          this.requestAnalysis = [];
          this.isRequestAnalysisRunning = false;
        }
        this.importedCatFiles = [];
        this.isCatImportRunning = false;
        this.pcErrors = [];
        this.stopPcPolling();
        this.stopRequestAnalysisStatusPolling();
      }
      this.$router.push({ name: 'create-request', params: { requestId: null, request } });
    },
    onCloneRequest() {
      if (!this.hasWorkflowChanged) {
        this.editedWorkflowIndex = null;
        return this.cloneRequest();
      }
      const handler = (result) => {
        if (!result.confirm) {
          this.shouldLeavePage = true;
          this.editedWorkflowIndex = null;
          return this.cloneRequest();
        }
        this.saveWorkflow(this.editedWorkflowIndex);
      };
      const dialogOptions = {
        handler,
        title: 'Warning',
        message: WORKFLOW_CHANGES_WARN_MESSAGE,
        dataE2eType: 'save-workflow-dialog',
      };
      return this.onConfirmDialogShow(dialogOptions);
    },
    onSelectedPreferredLanguageCombination(selectedIndex, checked) {
      this.requestEntity.languageCombinations = this.requestEntity.languageCombinations
        .map((lc, lcIndex) => ({ ...lc, preferredLanguageCombination: lcIndex === selectedIndex ? checked : false }));
    },
    checkValidStatusChange(newStatus) {
      const originalStatusIsWaitingStatus = WAITING_STATUSES.includes(this.originalRequestStatus);
      const newStatusIsWaitingStatus = WAITING_STATUSES.includes(newStatus);
      if (
        originalStatusIsWaitingStatus
        && !(newStatusIsWaitingStatus || newStatus === CANCELLED_STATUS)
      ) {
        this.pushNotification(errorNotification('Status cannot be updated before the quote is Approved or Cancelled'));
        return;
      }
      if (
        this.originalRequestStatus === CANCELLED_STATUS
        && newStatus !== CANCELLED_STATUS
      ) {
        this.pushNotification(errorNotification('Status cannot be updated once the quote is Cancelled'));
        return;
      }
      if (
        [TO_BE_PROCESSED_STATUS, ON_HOLD_STATUS].includes(this.originalRequestStatus)
        && newStatusIsWaitingStatus
      ) {
        if (!this.requestEntity.requireQuotation) {
          this.pushNotification(errorNotification('This status is only eligible for quotes'));
          return;
        }
        if (this.requestEntity.isQuoteApproved) {
          this.pushNotification(errorNotification('Status cannot be updated after the quote is Approved or Cancelled'));
          return;
        }
      }
      if (
        this.originalRequestStatus !== IN_PROGRESS_STATUS
        && newStatus === IN_PROGRESS_STATUS
      ) {
        const handler = (result) => {
          if (!result.confirm) {
            this.requestEntity.status = this.originalRequestStatus;
          } else {
            this.requestEntity.status = newStatus;
          }
        };
        const dialogOptions = {
          handler: handler,
          title: 'Update Request Status Confirmation',
          message: STATUS_CHANGE_WARN_MESSAGE1,
          dataE2eType: 'change-status-dialog',
        };
        return this.onConfirmDialogShow(dialogOptions);
      }
      if (
        this.originalRequestStatus === IN_PROGRESS_STATUS
        && (newStatusIsWaitingStatus || newStatus === TO_BE_PROCESSED_STATUS)
      ) {
        this.pushNotification(errorNotification('Status cannot be selected once the request is In Progress'));
        return;
      }
      if (
        this.originalRequestStatus !== WAITING_FOR_CLIENT_PO_STATUS
        && newStatus === WAITING_FOR_CLIENT_PO_STATUS
      ) {
        const handler = (result) => {
          if (!result.confirm) {
            this.requestEntity.status = this.originalRequestStatus;
          } else {
            this.requestEntity.status = newStatus;
          }
        };
        const dialogOptions = {
          handler: handler,
          title: 'Update Request Status Confirmation',
          message: STATUS_CHANGE_WARN_MESSAGE2,
          dataE2eType: 'change-status-dialog',
        };
        return this.onConfirmDialogShow(dialogOptions);
      }
      if (
        this.originalRequestStatus === WAITING_FOR_CLIENT_PO_STATUS
        && (newStatusIsWaitingStatus || newStatus === TO_BE_PROCESSED_STATUS)
      ) {
        this.pushNotification(errorNotification('Status cannot be selected once the request is Waiting for Client PO'));
        return;
      }
      if (newStatus === DELIVERED_STATUS) {
        const handler = (result) => {
          if (!result.confirm) {
            this.requestEntity.status = this.originalRequestStatus;
          } else {
            this.requestEntity.status = newStatus;
          }
        };
        return this.onConfirmDialogShow({
          handler,
          message: DELIVERED_REQUEST_STATUS_WARN_MESSAGE,
          dataE2eType: 'change-status-dialog',
        });
      }
      if (newStatus === COMPLETED_STATUS) {
        if (!this.areTasksCompleted) {
          this.pushNotification(warningNotification(
            'This request cannot be completed until all provider tasks in the request are "Approved" or "Canceled".',
            null,

            null,

            'Warning',
          ));
        }
        const handler = (result) => {
          if (!result.confirm) {
            this.requestEntity.status = this.originalRequestStatus;
            return;
          }
          this.save();
        };
        return this.onConfirmDialogShow({
          handler,
          message: COMPLETED_REQUEST_STATUS_WARN_MESSAGE,
          dataE2eType: 'completed-status-dialog',
        });
      }
      if (newStatus === CANCELLED_STATUS) {
        if (!this.areTasksCompleted) {
          this.pushNotification(errorNotification(
            'This request cannot be cancelled until all tasks in the request are "Approved" or "Cancelled".',
            null,

            null,

            'Error',
          ));
          return;
        }
        const handler = (result) => {
          if (!result.confirm) {
            this.requestEntity.status = this.originalRequestStatus;
          } else {
            this.requestEntity.status = newStatus;
          }
        };
        const dialogOptions = {
          handler: handler,
          title: 'Update Request Status Confirmation',
          message: CANCELLED_REQUEST_STATUS_WARN_MESSAGE,
          dataE2eType: 'change-status-dialog',
        };
        return this.onConfirmDialogShow(dialogOptions);
      }
    },
    onCustomFieldDeletion(index) {
      const handler = (result) => {
        if (!result.confirm) {
          return;
        }
        const customFieldsClone = this.requestEntity.customStringFields.slice(0);
        customFieldsClone.splice(index, 1);
        this.requestEntity.customStringFields = customFieldsClone;
        this.pushNotification(warningNotification(`Custom Text Field ${index + 1} has been deleted`, null, null, 'Warning'));
      };
      const dialogOptions = {
        handler,
        title: 'Warning',
        message: `You’re going to delete Custom Text Field ${index + 1}. Would you like to continue?`,
        dataE2eType: 'custom-field-delete-dialog',
      };
      return this.onConfirmDialogShow(dialogOptions);
    },
    onStatusSelected(status) {
      this.requestEntity.status = status;
      if (!_.isEmpty(status)) {
        this.checkValidStatusChange(status);
      }
    },
    onSave() {
      if (this.isValid) {
        this.saveRequest();
      }
    },
    onPatentUpdate(res) {
      this._refreshEntity(res);
    },
    async updateCounts(e) {
      this.saving = true;
      document.saving = true;
      const { service } = e;
      if (service === 'nodb') {
        this.updateNoDBCounts(e.form);
      } else {
        this.updateNoDBFilingCounts(e.form);
      }
    },

    async updateNoDBCounts(form) {
      const customQuoteCountries = form.countries.filter((c) => !c.instantQuote);
      const sourceLangName = this.originalRequest.languageCombinations[0].srcLangs[0].name;
      const ipPatentNotCalculated = customQuoteCountries.map(
        (country) => ({
          officialLanguage: '',
          name: country.name,
          instantQuote: false,
          sourceLanguage: sourceLangName,
          translationFee: 0,
        }),
      );
      try {
        const { data } = await nodbService
          .listInstantQuoteTranslationFee({
            companyId: this.originalRequest.company._id,
            countries: form.countries.map((c) => c.name),
            specificationWordCount: form.specificationWordCount.toString().replaceAll(',', ''),
            drawingsWordCount: form.drawingsWordCount.toString().replaceAll(',', ''),
            numberOfDrawings: form.numberOfDrawings.toString().replaceAll(',', ''),
            drawingsPageCount: form.drawingsPageCount.toString().replaceAll(',', ''),
          });
        const requestCurrencyCode = _.get(this.originalRequest, 'quoteCurrency.isoCode', null);
        if (_.isNil(requestCurrencyCode)) {
          throw new Error('The request currency could not be found');
        }
        const ipPatentCalculated = data.list.map((fee) => ({
          officialLanguage: fee.filingLanguage,
          name: fee.country,
          sourceLanguage: sourceLangName,
          instantQuote: true,
          translationFee: fee.translationFeeCalculated[requestCurrencyCode],
        }));
        const total = _.reduce(
          data.list,
          (sum, { translationFeeCalculated }) => sum + parseFloat(translationFeeCalculated[requestCurrencyCode]),

          0,
        ).toFixed(2);
        const ipPatentCountries = ipPatentCalculated.concat(
          ipPatentNotCalculated,
        );
        const ipPatentFields = {
          specificationWordCount: parseInt(form.specificationWordCount.toString().replace(',', ''), 10),
          drawingsWordCount: parseInt(form.drawingsWordCount.toString().replace(',', ''), 10),
          numberOfDrawings: parseInt(form.numberOfDrawings.toString().replace(',', ''), 10),
          drawingsPageCount: parseInt(form.drawingsPageCount.toString().replace(',', ''), 10),
          total: parseFloat(total),
        };
        const request = this._generateRequest(ipPatentCountries, ipPatentFields);
        const response = await this.requestService.edit(request);
        this.requestEntity.ipPatent = response.data.request.ipPatent;
        this._refreshEntity(response);
      } catch (err) {
        const notification = {
          title: 'Error',
          message: _.get(err, 'message'),
          state: 'danger',
        };
        notification.response = err;
        this.pushNotification(notification);
      } finally {
        this.saving = false;
        document.saving = false;
      }
    },
    async updateNoDBFilingCounts(form) {
      const customQuoteCountries = form.countries.filter((c) => !c.instantQuote);
      const sourceLangName = this.originalRequest.languageCombinations[0].srcLangs[0].name;
      const ipPatentNotCalculated = customQuoteCountries.map(
        (country) => ({
          officialLanguage: '',
          name: country.name,
          instantQuote: false,
          sourceLanguage: sourceLangName,
          translationFee: 0,
          agencyFee: 0,
          officialFee: 0,
        }),
      );
      try {
        const { data } = await nodbService
          .listInstantQuoteTranslationFeeFiling({
            companyId: this.originalRequest.company._id,
            countries: form.countries.map((c) => c.name),
            entities: _.cloneDeep(form.countries).fill(''),
            specificationWordCount: form.specificationWordCount.toString().replaceAll(',', ''),
            drawingsWordCount: form.drawingsWordCount.toString().replaceAll(',', ''),
            numberOfDrawings: form.numberOfDrawings.toString().replaceAll(',', ''),
            numberOfClaims: form.numberOfClaims.toString().replaceAll(',', ''),
            numberOfIndependentClaims: form.numberOfIndependentClaims.toString().replaceAll(',', ''),
            totalNumberOfPages: form.totalNumberOfPages.toString().replaceAll(',', ''),
          });
        const requestCurrencyCode = _.get(this.originalRequest, 'quoteCurrency.isoCode', null);
        if (_.isNil(requestCurrencyCode)) {
          throw new Error('The request currency could not be found');
        }
        const ipPatentCalculated = data.list.map((country) => {
          const agencyFee = country.agencyFee[requestCurrencyCode];
          const officialFee = country.officialFee[requestCurrencyCode];
          const translationFee = country.translationFeeCalculated[requestCurrencyCode];
          return {
            officialLanguage: country.filingLanguage,
            name: country.country,
            sourceLanguage: sourceLangName,
            instantQuote: true,
            agencyFee,
            officialFee,
            translationFee,
            total: _.sumBy([agencyFee, officialFee, translationFee], (num) => parseFloat(num)),
          };
        });
        const total = (this._totalFee(data.list)).toFixed(2);
        const ipPatentCountries = ipPatentCalculated.concat(
          ipPatentNotCalculated,
        );
        const ipPatentFields = {
          specificationWordCount: parseInt(form.specificationWordCount.toString().replace(',', ''), 10),
          drawingsWordCount: parseInt(form.drawingsWordCount.toString().replace(',', ''), 10),
          numberOfDrawings: parseInt(form.numberOfDrawings.toString().replace(',', ''), 10),
          numberOfClaims: parseInt(form.numberOfClaims.toString().replace(',', ''), 10),
          numberOfIndependentClaims: parseInt(form.numberOfIndependentClaims.toString().replace(',', ''), 10),
          totalNumberOfPages: parseInt(form.totalNumberOfPages.toString().replace(',', ''), 10),
          total: parseFloat(total),
        };
        const request = this._generateRequest(ipPatentCountries, ipPatentFields);
        const response = await this.requestService.edit(request);
        this.requestEntity.ipPatent = response.data.request.ipPatent;
        this._refreshEntity(response);
      } catch (err) {
        const notification = {
          title: 'Error',
          message: _.get(err, 'message'),
          state: 'danger',
        };
        notification.response = err;
        this.pushNotification(notification);
      } finally {
        this.saving = false;
        document.saving = false;
      }
    },

    _generateRequest(countries, ipPatentFields) {
      return {
        _id: this.originalRequest._id,
        requireQuotation: this.originalRequest.requireQuotation,
        deliveryDate: this.originalRequest.deliveryDate,
        title: this.originalRequest.title,
        languageCombinations: this.originalRequest.languageCombinations,
        comments: this.instructionsAndComments || 'No comments',
        company: this.originalRequest.company._id,
        quoteCurrency: this.originalRequest.quoteCurrency,
        ipPatent: {
          service: this.originalRequest.ipPatent.service,
          database: this.originalRequest.ipPatent.database,
          disclaimers: this.originalRequest.ipPatent.disclaimers,
          filingDeadline: this.originalRequest.ipPatent.filingDeadline,
          applicantName: this.originalRequest.ipPatent.applicantName,
          countries: countries,
          ...ipPatentFields,
        },
      };
    },

    _totalFee(calculatedCountries) {
      const requestCurrencyCode = _.get(this.originalRequest, 'quoteCurrency.isoCode', null);
      return _.reduce(
        calculatedCountries,
        (sum, { agencyFee, officialFee, translationFeeCalculated }) => sum
          + (_.sumBy([
            agencyFee[requestCurrencyCode],
            officialFee[requestCurrencyCode],
            translationFeeCalculated[requestCurrencyCode],
          ], (num) => parseFloat(num))),
        0,
      );
    },
    onAbilityList(newValue) {
      this.abilityList = newValue;
    },
    onRestrictedLanguageCombinationRemoval(e) {
      const message = _.get(e, 'language', false)
        ? 'You are deleting a language that is part of at least one workflow. Please delete the related workflow(s) first and try again.'
        : 'This action cannot be performed because at least one language combination is part of a workflow. Please delete the related workflow(s) first and try again';

      const notification = {
        title: 'Error',
        message,
        state: 'danger',
      };
      this.pushNotification(notification);
    },
    onWorkflowTypeSelect(option) {
      this.requestEntity.workflowType = option.value;
    },
    toggleInterpretingSpecificSectionCollapse() {
      this.isInterpretingSpecificSectionCollapsed = !this.isInterpretingSpecificSectionCollapsed;
    },
    onConfirmDialogShow(dialogOptions) {
      if (!_.isNil(this.$refs.confirmDialog)) {
        this.$refs.confirmDialog.show();
        this.confirmDialogOptions = dialogOptions;
      }
    },
    onDialogConfirm(event) {
      if (!_.isNil(this.confirmDialogHandler)) {
        this.confirmDialogHandler(event);
      }
    },
    shouldDisplayPcErrors(pcErrors = []) {
      const importErrors = pcErrors.filter((error) => _.get(error, 'type') === PC_PIPELINE_TYPE_IMPORT);
      const mtErrors = pcErrors.filter((error) => _.get(error, 'type') === PC_PIPELINE_TYPE_MT);
      if (!_.isEmpty(importErrors)) {
        return true;
      }
      if (!_.isEmpty(mtErrors)) {
        const workflows = _.get(this, 'requestEntity.workflows', []);
        return mtErrors.some((error) => {
          const workflow = workflows.find(
            (wf) => _.get(wf, 'srcLang.isoCode', '') === error.srcLang
              && _.get(wf, 'tgtLang.isoCode', '') === error.tgtLang,
          );
          return !_.isNil(workflow) && workflow.useMt;
        });
      }
      return true;
    },
    async checkForPortalCatQaIssues() {
      if (!this.isPortalCat) {
        return;
      }
      const response = await portalCatService.getRequestQaIssues(this.requestEntityId);
      const qaIssues = _.get(response, 'data.qaIssues', []);
      if (!_.isEmpty(qaIssues)) {
        this.pushNotification(errorNotification('The QA Validation process found unresolved Warnings and Errors. Unable to complete task.'));
      }
    },
    startRequestAnalysisStatusPolling() {
      if (!this.isPortalCat || !this.requestEntityId) {
        return;
      }
      this.stopRequestAnalysisStatusPolling();
      this.requestAnalysisStatusPoller = new CancellablePoller(
        () => portalCatService.getRequestAnalysisStatus(this.requestEntityId),
        REQUEST_ANALYSIS_STATUS_CHECK_INTERVAL,
      );
      this.raStatusCheckRetriesOnError = 0;
      this.requestAnalysisStatusPoller.start(this.handleRequestAnalysisStatus);
    },
    stopRequestAnalysisStatusPolling() {
      if (!_.isNil(this.requestAnalysisStatusPoller)) {
        this.requestAnalysisStatusPoller.cancel();
      }
    },
    stopPcPolling() {
      if (!_.isNil(this.pcPoller)) {
        this.pcPoller.cancel();
      }
    },

    startPcPolling(options = {}) {
      if (!this.isPortalCat
          || !this.hasRole({ oneOf: ['PIPELINE-RUN_UPDATE_ALL', 'PIPELINE_READ_ALL'] })
          || !this.hasPortalCatFiles) {
        return;
      }
      this.stopPcPolling();
      this.isCatImportRunning = true;
      const types = _.get(options, 'types', [PC_PIPELINE_TYPE_IMPORT, PC_PIPELINE_TYPE_MT]);
      const fileIds = _.get(options, 'fileIds');
      const params = { requestId: this.requestEntityId, types, fileIds };
      const multiplier = this.mock ? 4 : 1;
      this.pcPoller = new CancellablePoller(
        portalCatService.getPipelineStatus.bind(portalCatService, params),
        3000 * multiplier,
      );
      this.pcPoller.start(this.handlePcPollResponse.bind(this, options));
    },
    async handlePcPollResponse(
      {
        errorMessage, successMessage, retryIfEmpty = false, retryIfStopped = false,
      } = {},
      response,
      err,
      poller,
    ) {
      if (!_.isNil(err) && !_.isNil(errorMessage)) {
        poller.cancel();
        const errorDetails = _.get(err, 'status.message') || _.get(err, 'message', '');
        this.pushNotification(errorNotification(errorMessage, null, null, 'Error', errorDetails));
        this.isCatImportRunning = false;
        return;
      }
      const pipelinesInfo = _.get(response, 'data.statuses', []);
      if (_.isEmpty(pipelinesInfo) && retryIfEmpty) {
        return;
      }
      const hasStopped = pipelinesInfo.some((status) => status.status === PC_PIPELINE_STOPPED);
      if (hasStopped && retryIfStopped) {
        return;
      }
      const hasRunning = pipelinesInfo.some((status) => status.status === PC_PIPELINE_RUNNING);
      if (!hasRunning) {
        poller.cancel();
        const pcErrors = pipelinesInfo.filter((status) => status.status === PC_PIPELINE_ERROR);
        this.pcErrors = pcErrors;
        this.importedCatFiles = [];
        const shouldDisplayPcErrors = !_.isEmpty(pcErrors)
          && this.shouldDisplayPcErrors(pcErrors)
          && !_.isNil(errorMessage);
        if (shouldDisplayPcErrors) {
          this.deleteNotification(this.catImportRunningNotification);
          this.pushNotification(errorNotification(errorMessage, null, null, 'Error', JSON.stringify(pcErrors)));
        } else {
          const areAllSucceeded = pipelinesInfo.some((s) => s.status === PC_PIPELINE_SUCCEEDED);
          this.importedCatFiles = pipelinesInfo
            .filter((s) => s.status === PC_PIPELINE_SUCCEEDED && s.type === PC_PIPELINE_TYPE_IMPORT)
            .map((p) => p.fileId);
          if ((areAllSucceeded || !shouldDisplayPcErrors) && !_.isNil(successMessage)) {
            this.deleteNotification(this.catImportRunningNotification);
            this.pushNotification(successNotification(successMessage, 3000));
          }
        }
        this.isCatImportRunning = false;
      }
    },
    removeNotRelevantWorkflows(newCombinations = [], oldCombinations = []) {
      const newSrcLangs = _.flatMap(newCombinations, (combination) => combination.srcLangs);
      const newTgtLangs = _.flatMap(newCombinations, (combination) => combination.tgtLangs);
      const oldSrcLangs = _.flatMap(oldCombinations, (combination) => combination.srcLangs);
      const oldTgtLangs = _.flatMap(oldCombinations, (combination) => combination.tgtLangs);
      const removedSrcLangs = _.differenceBy(oldSrcLangs, newSrcLangs, (lang) => lang.isoCode);
      const removedTgtLangs = _.differenceBy(oldTgtLangs, newTgtLangs, (lang) => lang.isoCode);
      const workflows = _.get(this, 'requestEntity.workflows', []);
      this.requestEntity.workflows = workflows.filter((workflow) => {
        const {
          srcLang: { isoCode: srcIsoCode = '' } = {},
          tgtLang: { isoCode: tgtIsoCode = '' } = {},
        } = workflow;
        const hasRemovedSrcLang = removedSrcLangs.some((lang) => lang.isoCode === srcIsoCode);
        const hasRemovedTgtLang = removedTgtLangs.some((lang) => lang.isoCode === tgtIsoCode);
        return !hasRemovedSrcLang && !hasRemovedTgtLang;
      });
    },
    handleRequestAnalysisStatus(result, error) {
      if (!_.isNil(error)) {
        this.requestAnalysis = [];
        if (this.raStatusCheckRetriesOnError < REQUEST_ANALYSIS_STATUS_CHECK_RETRIES_ON_ERROR) {
          this.raStatusCheckRetriesOnError++;
          return;
        }
        this.isRequestAnalysisRunning = false;
        if (this.showNotificationIfStatisticsSucceeded) {
          const errMessage = _.get(error, 'status.message', '');
          this.pushNotification(errorNotification('Failed to check the status of Statistics generation', null, null, 'Error', errMessage));
        }
        this.stopRequestAnalysisStatusPolling();
        return;
      }
      const status = _.get(result, 'data.status');
      if (status === PC_PIPELINE_ERROR) {
        this.requestAnalysis = [];
        this.isRequestAnalysisRunning = false;
        if (this.showNotificationIfStatisticsSucceeded) {
          const errMessage = _.get(result, 'data.message') || _.get(error, 'status.message', '');
          this.deleteNotification(this.statisticsGenerationNotification);
          this.pushNotification(errorNotification('There was an error while generating Statistics', null, null, 'Error', errMessage));
        }
        this.stopRequestAnalysisStatusPolling();
        return;
      }
      if (status === PC_PIPELINE_RUNNING) {
        this.requestAnalysis = [];
        this.isRequestAnalysisRunning = true;
        if (this.showNotificationIfStatisticsRunning) {
          this.pushNotification(this.statisticsGenerationNotification);
          this.showNotificationIfStatisticsRunning = false;
          this.showNotificationIfStatisticsSucceeded = true;
        }
        return;
      }
      if (status === PC_PIPELINE_SUCCEEDED) {
        this.requestAnalysis = [];
        this.isRequestAnalysisRunning = false;
        if (this.showNotificationIfStatisticsSucceeded) {
          this.deleteNotification(this.statisticsGenerationNotification);
          this.pushNotification(successNotification('Statistics have been generated successfully.', 3000));
          this.$refs.runStatisticsModal.close();
        }
        this.stopRequestAnalysisStatusPolling();
        this.getRequestAnalysis();
      }
    },
    navigateToStatistics() {
      this.$router.push(`${this.$router.currentRoute.path}/statistics`);
    },
    async openRunStatisticsModal() {
      const includeInClientStatistics = _.get(
        this.requestEntity,
        'company.pcSettings.lockedSegments.includeInClientStatistics',
        false,
      );
      const includeInProviderStatistics = _.get(this.requestEntity, 'company.pcSettings.lockedSegments.includeInProviderStatistics', false);
      this.requestEntity.pcSettings.lockedSegments = {
        includeInClientStatistics,
        includeInProviderStatistics,
      };
      this.$refs.runStatisticsModal.open();
    },
    async runStatistics() {
      this.requestAnalysis = [];
      this.isRequestAnalysisRunning = true;
      this.showNotificationIfStatisticsRunning = false;
      this.showNotificationIfStatisticsSucceeded = true;
      this.stopRequestAnalysisStatusPolling();
      try {
        await portalCatService
          .runRequestAnalysis(this.requestEntityId, this.requestEntity.pcSettings.lockedSegments);
        this.requestEntity.pcSettings.statisticsGenerated = true;
        this.pushNotification(this.statisticsGenerationNotification);
        this.startRequestAnalysisStatusPolling();
      } catch (err) {
        const errMessage = _.get(err, 'status.message', '');
        this.pushNotification(errorNotification('Failed to run Statistics, please try again later.', null, null, 'Error', errMessage));
        this.isRequestAnalysisRunning = false;
      }
    },
    async runCatImport(params) {
      try {
        this.isCatImportRunning = true;
        const response = await portalCatService.runCatImport(this.requestEntityId, params);
        await this._refreshEntity(response);
        this.pushNotification(this.catImportRunningNotification);
        this.startPcPolling({
          types: [PC_PIPELINE_TYPE_IMPORT],
          errorMessage: 'Failed to import PortalCat files, please try again later.',
          successMessage: 'Files have been imported to PortalCAT',
          retryIfStopped: true,
        });
      } catch (err) {
        const errMessage = _.get(err, 'status.message', '');
        this.pushNotification(errorNotification('Failed to import PortalCat files, please try again later.', null, null, 'Error', errMessage));
        this.isCatImportRunning = false;
      }
    },
    async getRequestAnalysis() {
      this.isRequestAnalysisLoading = true;
      try {
        let withFuzzyMatches = false;
        if (this.hasRole({ oneOf: ['STATISTICS_READ_ALL', 'STATISTICS_READ_OWN'] })) {
          withFuzzyMatches = true;
        }
        const { data: { requestAnalysis } } = await portalCatService.getRequestAnalysis(this.requestEntityId, withFuzzyMatches);
        this.requestAnalysis = requestAnalysis;
      } catch (err) {
        const errMessage = _.get(err, 'status.message', 'Something went wrong, please try again later.');
        this.pushNotification(errorNotification('Failed to get Statistics.', null, null, 'Error', errMessage));
      }
      this.isRequestAnalysisLoading = false;
    },
    async fetchExportStatus() {
      if (!this.isPortalCat || !this.canReadPortalCatFinalFiles) {
        return;
      }
      const srcLangs = [];
      const tgtLangs = [];
      _.get(this, 'requestEntity.workflows', []).forEach(({ srcLang, tgtLang }) => {
        srcLangs.push(_.get(srcLang, 'isoCode'));
        tgtLangs.push(_.get(tgtLang, 'isoCode'));
      });
      const response = await portalCatService.getPipelineStatus({
        requestId: this.requestEntityId,
        types: ['export'],
        srcLangs,
        tgtLangs,
      });
      const exportPipelines = _.get(response, 'data.statuses', []);
      this.areAllFinalFilesGenerated = exportPipelines.every(({ status }) => status === PC_PIPELINE_SUCCEEDED);
    },
    setContactPreferredLanguageCombination(request) {
      const languageCombinations = _.get(request, 'languageCombinations', []);
      let newPreferredLanguageCombination = languageCombinations.find((lc) => lc.preferredLanguageCombination);
      if (_.isNil(newPreferredLanguageCombination)) {
        return;
      }
      newPreferredLanguageCombination = _.pick(newPreferredLanguageCombination, ['srcLangs', 'tgtLangs']);
      const userPreferredLanguageCombination = _.get(this.userLogged, 'preferences.preferredLanguageCombination');
      const hasPreferredLanguageCombinationChanged = !_.isEqual(newPreferredLanguageCombination, userPreferredLanguageCombination);
      if (hasPreferredLanguageCombinationChanged) {
        const userClone = _.clone(this.userLogged);
        _.set(userClone, 'preferences.preferredLanguageCombination', newPreferredLanguageCombination);
        this.setUser(userClone);
      }
    },
    updateImportedCatFiles(newCombinations, oldCombinations) {
      for (let i = 0; i < newCombinations.length; i++) {
        const newCombination = newCombinations[i];
        const oldCombination = oldCombinations[i];
        if (_.isNil(oldCombination)
          || newCombination._id !== oldCombination._id
          || newCombination.srcLangs.length !== oldCombination.srcLangs.length
          || newCombination.tgtLangs.length !== oldCombination.tgtLangs.length) {
          this.importedCatFiles = [];
          break;
        }
      }
    },
  },
};
