import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions, mapGetters } from 'vuex';

import UtcFlatpickr from '../components/form/utc-flatpickr.vue';
import PtsEmailInput from '../components/form/pts-email-input.vue';
import ActivityTagsSelector from '../components/activity/activity-tags-selector.vue';
import RequestFiles from '../components/request-files/request-files.vue';
import CompanyAjaxBasicSelect from '../components/home/company/company-ajax-basic-select.vue';
import RequestAjaxMultiSelect from '../components/request-select/request-ajax-multi-select.vue';
import RichTextEditor from '../components/rich-text-editor/rich-text-editor.vue';
import InternalDepartmentMultiSelector from '../components/internal-department-select/internal-department-multi-selector.vue';
import OpportunityAjaxMultiSelect from '../components/form/opportunity-ajax-multi-select.vue';
import { defaultActivity, defaultEmailDetails } from '../components/activity/activity-helpers';
import CommaSeparatedEmailSelector from '../components/form/comma-separated-email-selector.vue';
import ActivityService from '../services/activity-service';

const activityService = new ActivityService();
const NA = 'NA';
const TAG_INVOICE = 'Invoice';
const baseTargetCssRule = '<base target="_blank" />';
const buildInitialState = () => ({
  activity: defaultActivity(),
  requestFilesConfig: {
    visibleColumns: ['Filename', 'Size', 'Download'],
  },
  attachmentsLoading: false,
  isValidCcFormat: true,
  requiredTags: [],
});

export default {
  name: 'activity-email-details',
  components: {
    UtcFlatpickr,
    RequestFiles,
    PtsEmailInput,
    RichTextEditor,
    ActivityTagsSelector,
    CompanyAjaxBasicSelect,
    RequestAjaxMultiSelect,
    OpportunityAjaxMultiSelect,
    InternalDepartmentMultiSelector,
    CommaSeparatedEmailSelector,
  },
  props: {
    value: Object,
    documentUrlResolver: Function,
    emlUpload: Object,
  },
  created() {
    this.$emit('validate-activity-email', this.isValid);
    if (_.get(this.activity, 'emailDetails.company')
      && _.get(this.activity, 'emailDetails.opportunities.length') === 0) {
      this.activity.emailDetails.opportunities.push({
        _id: NA,
        no: NA,
      });
    }
    if (this.isInvoice && !this.activity.tags.includes(TAG_INVOICE)) {
      this.activity.tags.push(TAG_INVOICE);
      this.requiredTags.push(TAG_INVOICE);
    }
  },
  data() {
    return buildInitialState();
  },
  watch: {
    value: {
      handler: function (newVal) {
        this.activity = _.isEmpty(newVal) ? buildInitialState().activity : newVal;
      },
      immediate: true,
    },
    activity: {
      handler: function (newVal) {
        this.$emit('input', newVal);
        this.$emit('validate-activity-email', this.isValid);
      },
      deep: true,
    },
    isValid: {
      handler: function () {
        this.$emit('validate-activity-email', this.isValid);
      },
    },
    emlUpload: {
      handler: function (newVal) {
        if (!_.isNil(newVal)) {
          if (_.get(this, 'activity._id.length', 0) > 0) {
            const notification = {
              title: 'Error',
              message: 'Can\'t edit existing activity by dropping en eml file.',
              state: 'warning',
            };
            return this.pushNotification(notification);
          }
          this.processEmlUpload(newVal);
        }
      },
      immediate: true,
    },
    isRequestSelectDisabled(newVal) {
      if (newVal && this.isNew) {
        this.activity.emailDetails.requests = [];
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),

    processEmlUpload(upload) {
      const { subject } = upload;
      const { attachments } = upload;
      delete upload.attachments;
      const emailDetails = defaultEmailDetails();
      _.extend(emailDetails, upload);
      this.activity.emailDetails = { ...emailDetails };
      this.activity.emailDetails.embeddedAttachments = [];
      this.activity.emailDetails.isImported = true;
      this.activity.subject = subject;
      if (Array.isArray(attachments)) {
        this.attachmentsLoading = true;
        Promise.all(attachments.map((a) => this.uploadAttachment(a)))
          .finally(() => {
            this.attachmentsLoading = false;
          });
      }
    },

    uploadAttachment(attachment) {
      this.attachmentsLoading = true;
      const file = new File([attachment.value], attachment.name, {
        type: attachment.contentType,
        lastModified: attachment.lastModified,
      });
      const formData = new FormData();
      formData.set('files', file, file.name);
      return activityService.uploadActivityAttachment(formData)
        .then((response) => {
          const newAttachments = this.activity.emailDetails.embeddedAttachments.concat(
            response.data.newDocument,
          );
          const documents = newAttachments.filter((d) => !_.isEmpty(d._id));
          this.activity.emailDetails.embeddedAttachments = documents;
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Attachment upload failed',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        }).finally(() => {
          this.attachmentsLoading = false;
        });
    },

    onOpportunitySelected(opportunities) {
      this.activity.emailDetails.opportunities = opportunities.map((u) => ({
        _id: u.value,
        no: u.text,
      }));
    },

    onRequestSelected(requests) {
      this.activity.emailDetails.requests = requests.map((r) => ({
        _id: r.value,
        no: r.text,
      }));
    },

    onCompanySelected(company) {
      const currentCompany = _.get(this.activity, 'emailDetails.company', {});
      if (!currentCompany || currentCompany._id !== company.value) {
        this.activity.emailDetails.opportunities = null;
        this.activity.emailDetails.requests = [];
      }
      this.activity.emailDetails.company = {
        _id: company.value,
        name: company.name,
        hierarchy: company.text,
        status: company.status,
      };
    },

    onCcValidated(isValid) {
      this.isValidCcFormat = isValid;
    },

    navigateUserGrid(userOption) {
      const email = _.get(userOption, 'text', '');
      const filter = { email: email };
      this.$emit('user-manage', { filter: JSON.stringify(filter) });
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('features', ['mock']),
    isNew() {
      return !this.activity._id;
    },
    failedEmails() {
      return _.get(this, 'activity.emailDetails.failedEmails', '').join(', ');
    },
    toOptions() {
      return Array.isArray(this.activity.emailDetails.to)
        ? this.activity.emailDetails.to.map((a) => ({ value: a, text: a }))
        : [];
    },
    ccOptions() {
      return Array.isArray(this.activity.emailDetails.cc)
        ? this.activity.emailDetails.cc.map((a) => ({ text: a, value: a }))
        : [];
    },
    bccOptions() {
      return Array.isArray(this.activity.emailDetails.bcc)
        ? this.activity.emailDetails.bcc.map((a) => ({ text: a, value: a }))
        : [];
    },
    htmlSrc() {
      let htmlBody = _.get(this.activity, 'emailDetails.htmlBody', '');
      if (htmlBody) {
        htmlBody = `${htmlBody}\n${baseTargetCssRule}`;
        const blob = new Blob([htmlBody], { type: 'text/html' });
        return URL.createObjectURL(blob);
      }
    },
    isInvoice() {
      return _.get(this.activity, 'emailDetails.isInvoice', false);
    },
    isOpportunitySelectDisabled() {
      const companyId = _.get(this.activity, 'emailDetails.company._id', null);
      return !companyId || this.isInvoice;
    },
    isRequestSelectDisabled() {
      const opportunities = _.get(this.activity, 'emailDetails.opportunities', []);
      return !(opportunities && opportunities.length === 1);
    },
    isValidFrom: function () {
      return _.get(this.activity, 'emailDetails.from.length', 0) > 0;
    },
    isValidTo: function () {
      return _.get(this.activity, 'emailDetails.to.length', 0) > 0;
    },
    isValidCc: function () {
      return _.get(this.activity, 'emailDetails.cc.length', 0) > 0 && this.isValidCcFormat;
    },
    isValidBcc: function () {
      return _.get(this.activity, 'emailDetails.bcc.length', 0) > 0;
    },
    isValidInternalDepartments: function () {
      return _.get(this.activity, 'emailDetails.internalDepartments.length', 0) > 0;
    },
    isValidSubject: function () {
      return _.get(this.activity, 'subject.length', 0) > 0;
    },
    isValidBody: function () {
      return _.get(this.activity, 'emailDetails.textBody.length', 0) > 0
        || _.get(this.activity, 'emailDetails.htmlBody.length', 0) > 0;
    },
    areValidComments() {
      return _.get(this.activity, 'comments.length', 0) < 100;
    },
    isValidTags: function () {
      return _.get(this.activity, 'tags.length', 0) > 0;
    },
    isValid: function () {
      return this.isValidFrom
        && !this.isUploadingFile
        && this.isValidTags
        && (this.isValidTo || this.isValidCc || this.isValidBcc)
        && this.isValidInternalDepartments
        && this.isValidBody
        && this.isValidSubject
        && this.areValidComments
        && (!this.attachmentsLoading || this.mock);
    },
    canEditSubject() {
      return !this.activity.emailDetails.isImported
        && (this.isNew || this.activity.emailDetails.isQuote);
    },
    companyStatus() {
      return _.get(this.activity, 'emailDetails.company.status', '');
    },
    companyFilter() {
      return _.get(this.activity, 'emailDetails.company.name', null);
    },
    opportunityFilter() {
      const opportunities = this.activity.emailDetails.opportunities || [];
      if (opportunities.length === 1) {
        return opportunities[0].no;
      } if (opportunities.length > 1) {
        return opportunities.join('');
      }
      return null;
    },
    companySelected() {
      const company = _.get(this, 'activity.emailDetails.company');
      if (_.isObject(company)) {
        return {
          text: _.isEmpty(company.hierarchy) ? company.name : company.hierarchy,
          value: _.get(company, '_id', ''),
        };
      }
      return { text: '', value: '' };
    },
    opportunitySelected() {
      if (Array.isArray(_.get(this.activity, 'emailDetails.opportunities'))) {
        return this.activity.emailDetails.opportunities.map((o) => ({
          text: o.no,
          value: o._id,
        }));
      }
      return [];
    },
    opportunityNaOption() {
      return {
        text: NA,
        value: NA,
      };
    },
    requestSelected() {
      return this.activity.emailDetails.requests.map((r) => ({
        text: r.no,
        value: r._id,
      }));
    },
    canCreateOrEdit() {
      return this.canCreate || this.canEdit;
    },
    ccOptionsFilter() {
      const filter = { terminated: false };
      if (!_.isEmpty(this.activity.emailDetails.company)) {
        filter.company = this.activity.emailDetails.company._id;
      }
      return filter;
    },
  },
};
