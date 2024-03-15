import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import UtcFlatpickr from '../../../form/utc-flatpickr.vue';
import RequestAjaxMultiSelect from '../../../request-select/request-ajax-multi-select.vue';
import CompanyAjaxBasicSelect from '../../company/company-ajax-basic-select.vue';
import ActivityTagsSelector from '../../../activity/activity-tags-selector.vue';
import RichTextEditor from '../../../rich-text-editor/rich-text-editor.vue';
import InternalDepartmentMultiSelector from '../../../internal-department-select/internal-department-multi-selector.vue';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import ActivityFileManagement from './activity-file-management.vue';
import { defaultActivity } from '../../../activity/activity-helpers';

let initialTags = [];
const TAGS_REQUIRES_NC_CC_CATEGORY = [
  'Client Complaint',
  'Non-Conformance',
];

const CREATE_ROLES = [
  'ACTIVITY-NC-CC_CREATE_ALL',
  'ACTIVITY-NC-CC_CREATE_OWN',
  'ACTIVITY-VES1_CREATE_ALL',
  'ACTIVITY-CA_CREATE_ALL',
];
const UPDATE_ROLES = {
  own: {
    'Feedback Received': 'ACTIVITY-FR_UPDATE_OWN',
    'Escalation 1': 'ACTIVITY-VES1_UPDATE_OWN',
    'Escalation 2': 'ACTIVITY-VES2_UPDATE_OWN',
    'Escalation Termination': 'ACTIVITY-VES-T_UPDATE_OWN',
    'Escalation Bypass': 'ACTIVITY-VES-B_UPDATE_OWN',
    'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_OWN',
    'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_OWN',
    'Competence Audit': 'ACTIVITY-CA_UPDATE_OWN',
  },
  all: {
    'Feedback Received': 'ACTIVITY-FR_UPDATE_ALL',
    'Escalation 1': 'ACTIVITY-VES1_UPDATE_ALL',
    'Escalation 2': 'ACTIVITY-VES2_UPDATE_ALL',
    'Escalation Termination': 'ACTIVITY-VES-T_UPDATE_ALL',
    'Escalation Bypass': 'ACTIVITY-VES-B_UPDATE_ALL',
    'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_ALL',
    'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_ALL',
    'Competence Audit': 'ACTIVITY-CA_CREATE_ALL',
  },
  department: {
    'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
    'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
  },
};
const NON_COMPLIANCE_CLIENT_COMPLAINT_CATEGORY_OPTIONS = [
  'Billing Related (CC)',
  'Client Error (CC)',
  'Conduct Related (NC)',
  'Delivery (CC)',
  'Process Related (NC)',
  'Quality (CC)',
  'Resource Needed (NC)',
  'Timeliness (CC)',
  'Training Required (NC)',
  'Vendor Error (CC)',
];
const STATUS_OPTIONS = [
  { value: 'toBeProcessed', name: 'To Be Processed' },
  { value: 'onHold', name: 'On Hold' },
  { value: 'inProgress', name: 'In Progress' },
  { value: 'completed', name: 'Completed' },
  { value: 'cancelled', name: 'Cancelled' },
  { value: 'reviewerRequired', name: 'Reviewer Required' },
  { value: 'reviewerAssigned', name: 'Reviewer Assigned' },
  { value: 'formSent', name: 'Form Sent' },
  { value: 'LMPendingReview', name: 'LM Pending Review' },
  { value: 'LMSignOff', name: 'LM Sign Off' },
  { value: 'reviewCompleted', name: 'Review Completed' },
  { value: 'reviewVoid', name: 'Review Void' },
];
const buildInitialState = () => ({
  statusOptions: {
    toBeProcessed: 'To Be Processed',
    onHold: 'On Hold',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    reviewerRequired: 'Reviewer Required',
    reviewerAssigned: 'Reviewer Assigned',
    formSent: 'Form Sent',
    LMPendingReview: 'LM Pending Review',
    LMSignOff: 'LM Sign Off',
    reviewCompleted: 'Review Completed',
    reviewVoid: 'Review Void',
  },
  nonComplianceClientComplaintCategoryRequired: false,
  activity: defaultActivity(),
});

export default {
  mixins: [entityEditMixin],
  components: {
    ActivityTagsSelector,
    RichTextEditor,
    UtcFlatpickr,
    RequestAjaxMultiSelect,
    CompanyAjaxBasicSelect,
    InternalDepartmentMultiSelector,
    SimpleBasicSelect,
    ActivityFileManagement,
  },
  props: {
    value: {
      type: Object,
    },
    readOnly: {
      type: Boolean,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.activity = _.isEmpty(this.value)
      ? buildInitialState().activity
      : this.value;
    initialTags = this.activity.tags;
    this.nonComplianceClientComplaintCategorySelectOptions = NON_COMPLIANCE_CLIENT_COMPLAINT_CATEGORY_OPTIONS;
    this.statusSelectOptions = STATUS_OPTIONS;
  },
  watch: {
    value: {
      handler: function (newValue) {
        this.activity = _.isEmpty(newValue) ? buildInitialState().activity : newValue;
        this._processSelectedTagsEvents(_.get(this, 'activity.tags'));
        this.$emit('validate-activity-feedback', this.isValid);
      },
      immediate: true,
    },
    activity: {
      handler: function (newActivity) {
        this.$emit('input', newActivity);
        this._processSelectedTagsEvents(_.get(this, 'activity.tags'));
      },
      deep: true,
    },
    isValid: {
      handler: function () {
        this.$emit('validate-activity-feedback', this.isValid);
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isNew: function () {
      return !this.activity._id;
    },
    userLoggedFullName: function () {
      return `${this.userLogged.firstName} ${this.userLogged.lastName}`;
    },
    isCreator() {
      return !this.isNew && this.activity.createdBy === this.userLogged.email;
    },
    canEditOwn: function () {
      return Array.isArray(this.activity.tags)
        && this.activity.tags.concat(initialTags)
          .some((t) => hasRole(this.userLogged, UPDATE_ROLES.own[t]));
    },
    canCreate: function () {
      return CREATE_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    canCreateOrEdit: function () {
      return (!this.isNew && this.canEdit) || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return (Array.isArray(this.activity.tags)
        && this.activity.tags.concat(initialTags).some(
          (t) => (
            hasRole(this.userLogged, UPDATE_ROLES.all[t])
            || hasRole(this.userLogged, UPDATE_ROLES.department[t])
          ),
        )
      ) || (this.isCreator && this.canEditOwn);
    },
    companySelected() {
      const company = _.get(this, 'activity.feedbackDetails.company');
      if (_.isObject(company)) {
        return {
          text: _.isEmpty(company.hierarchy) ? company.name : company.hierarchy,
          value: _.get(company, '_id', ''),
        };
      }
      return { text: '', value: '' };
    },
    requestsSelected: function () {
      if (Array.isArray(_.get(this, 'activity.feedbackDetails.requests'))) {
        return this.activity.feedbackDetails.requests.map((r) => ({
          value: r._id,
          text: r.no,
        }));
      }
      return [];
    },
    companyFilter() {
      return _.get(this, 'activity.feedbackDetails.company.name', null);
    },
    isValidNonComplianceClientComplaintCategory: function () {
      return !this.nonComplianceClientComplaintCategoryRequired || _.get(this, 'activity.feedbackDetails.nonComplianceClientComplaintCategory.length', 0);
    },
    isValidInternalDepartments: function () {
      return _.get(this, 'activity.feedbackDetails.internalDepartments.length', 0);
    },
    isValidStatus: function () {
      const status = _.get(this, 'activity.feedbackDetails.status', '');
      return Object.keys(this.statusOptions).includes(status);
    },
    isValidSubject: function () {
      return _.get(this, 'activity.subject.length', 0);
    },
    isValidComments: function () {
      return _.get(this, 'activity.comments.length', 0);
    },
    isValidTags: function () {
      return _.get(this, 'activity.tags.length', 0);
    },
    isValid: function () {
      return this.isValidTags
        && this.isValidStatus
        && this.isValidNonComplianceClientComplaintCategory
        && this.isValidInternalDepartments
        && this.isValidComments
        && this.isValidSubject;
    },
  },
  methods: {
    _processSelectedTagsEvents(tags) {
      if (_.isArray(tags)) {
        this.nonComplianceClientComplaintCategoryRequired = !!tags.filter((t) => TAGS_REQUIRES_NC_CC_CATEGORY.includes(t)).length;
      }
    },
    onCompanySelected(company) {
      const currentCompany = _.get(this, 'activity.feedbackDetails.company', {});

      if (!currentCompany || currentCompany._id !== company.value) {
        this.activity.feedbackDetails.requests = [];
      }
      this.activity.feedbackDetails.company = {
        _id: company.value,
        name: company.name,
        hierarchy: company.text,
      };
    },
    onRequestSelected(requests) {
      this.activity.feedbackDetails.requests = requests.map((r) => ({
        _id: r.value,
        no: r.text,
        companyName: r.companyName,
      }));
    },
    manageTags() {
      this.$emit('manage-activity-tag');
    },
    formatStatusSelectOption: ({ name = '', value = '' }) => ({ text: name, value }),
    onDocumentsUpdate() {
      this.$emit('documents-updated');
    },
  },
};
