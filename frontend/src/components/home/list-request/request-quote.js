/* global document window Blob */
import moment from 'moment';
import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import sanitizeHtml from 'sanitize-html';
import Handlebars from 'handlebars/dist/handlebars';
import loadHelpers from '../../../utils/handlebars';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import localDateTime from '../../../utils/filters/local-date-time';
import ApproveQuote from '../ip-quote/modals/approve-quote/approve-quote.vue';
import { getRequestDocuments } from './request-inline-edit-helper';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { successNotification, errorNotification, warningNotification } from '../../../utils/notifications';
import { extraFields, formattedExtraFields } from '../../../utils/template/custom-fields-helper';
import CurrencyService from '../../../services/currency-service';
import RequestService from '../../../services/request-service';
import QuoteLmsService from '../../../services/quote-lms-service';
import TemplateService from '../../../services/template-service';
import FooterTemplateService from '../../../services/footer-template-service';
import ReportPreview from '../../report-preview/report-preview.vue';
import { parseWorkflowCurrencyFields } from '../../../utils/workflow/workflow-helpers';
import { sum, ensureNumber } from '../../../utils/bigjs';
import { hotkeySaveMixin } from '../../../mixins/hotkey-save-mixin';
import { customFieldTypesMixin } from '../../report-preview/custom-field-types-mixin';
import ServiceTypeAjaxBasicSelect from '../service-type/service-type-ajax-basic-select.vue';
import DeliveryTypeAjaxBasicSelect from '../delivery-type/delivery-type-ajax-basic-select.vue';
import IpQuoteCsvExporter from '../../../utils/csv/ip-quote-exporter';

loadHelpers(Handlebars);

const QUOTE_TYPE = 'Quote';
const QUOTE_EMAIL_TYPE = 'Quote Email';
const CONTACT_USER_TYPE = 'Contact';
const REQUEST_WAITING_FOR_APPROVAL_STATUS = 'Waiting for approval';
const REQUEST_WAITING_FOR_QUOTE_STATUS = 'Waiting for Quote';
const SERVICE_PATENT_TRANSLATION_QUOTE = 'Patent Translation Quote';
const SERVICE_PATENT_TRANSLATION_AND_FILLING_QUOTE = 'Patent Translation and Filing Quote';
const DATABASE_PCT_NATIONAL_PHASE = 'PCT National Phase';
const DATABASE_DIRECT_FILLING_PARIS_CONVENTION = 'Direct Filing/Paris Convention';
const PCT_NATIONAL_PHASE_SUPPORTED_SOURCE_LANGUAGES = ['English', 'French', 'German'];
const LANGUAGE_NAME_ENGLISH = 'English';
let templateTimeout;
const runTemplate = (template, data) => {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(data);
};

const SANITIZE_OPTIONS = {
  allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'span',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'br', 'hr', 'style'],
  allowedAttributes: {
    table: ['style', 'id', 'class'],
    th: ['style', 'class', 'colspan', 'data-e2e-type'],
    tr: ['class'],
    td: ['style', 'class', 'colspan', 'data-e2e-type'],
    img: ['src'],
    div: ['class', 'data-e2e-type', 'id'],
    li: ['class', 'data-e2e-type'],
    ul: ['class'],
    span: ['style', 'class'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
    pre: ['style'],
    a: ['href', 'rel', 'target'],
  },
  transformTags: {
    a: (tagName, attribs) => {
      // add noopener noreferrer to anchors
      const newAttribs = Object.assign({}, attribs, { rel: 'noopener noreferrer' });
      return {
        tagName: tagName,
        attribs: newAttribs,
      };
    },
  },
};
const requestService = new RequestService();
const templateService = new TemplateService();
const quoteService = new QuoteLmsService();
const footerTemplateService = new FooterTemplateService();
const currencyService = new CurrencyService();

export default {
  components: {
    ReportPreview,
    SimpleBasicSelect,
    ApproveQuote,
    ServiceTypeAjaxBasicSelect,
    DeliveryTypeAjaxBasicSelect,
  },
  mixins: [
    userRoleCheckMixin,
    hotkeySaveMixin,
    customFieldTypesMixin,
  ],
  data() {
    return {
      isPreviewShown: false,
      isSaveQuoteCustomFieldChangesChecked: false,
      isSaveEmailCustomFieldChangesChecked: false,
      areValidTemplateCustomFields: true,
      areValidEmailCustomFields: true,
      isSendingQuote: false,
      isExportingPdf: false,
      browserPrinting: false,
      invoices: [],
      templateList: [],
      selectedQuoteTemplate: '',
      selectedEmailTemplate: '',
      selectedServiceType: null,
      selectedDeliveryType: null,
      loading: true,
      template: '',
      emailTemplate: '',
      templateError: null,
      sanitizedTemplate: '',
      request: {},
      quoteCurrencySymbol: '',
      footerTemplateOptions: [],
      dbEmailTemplate: {
        _id: '',
        name: '',
        type: '',
        template: '',
        emailCustomFields: {
          cancellationPolicy: '',
          termsAndConditions: '',
        },
      },
      dbTemplate: {
        _id: '',
        name: '',
        type: '',
        template: '',
        footerTemplate: '',
        emailCustomFields: {
          cancellationPolicy: '',
          termsAndConditions: '',
        },
        customFields: {
          memo: '',
          audioFeed: '',
          paymentTerms: '',
          termsAndConditions: '',
          materialTerms: '',
          equipment: '',
          cancellationPolicy: '',
          setup: '',
          overtime: '',
          additionalHours: '',
          quoteNotes: '',
          numberOfWords: '',
          languagesExtra: '',
          ...formattedExtraFields,
          quoteTermsAndConditions: '',
          selectableTermsAndConditions: {
            type: '',
            value: '',
          },
          cancelDate: '',
        },
        hideCustomSaveToTemplate: false,
        hiddenFields: [],
      },
      showApproveQuoteModal: false,
    };
  },
  created() {
    this.retrieveFooterTemplateOptions();
    this.getRequestQuote()
      .then(() => {
        if (!this.canSelectTemplates) {
          this.setSelectedTemplates();
          this.loading = false;
          return Promise.resolve();
        }
        return templateService.retrieve()
          .then((response) => {
            this.templateList = _.get(response, 'data.list');
          })
          .finally(() => {
            this.loading = false;
          });
      }).then(() => {
        Object.assign(this.dbTemplate.customFields, this.request.quoteCustomFields);
        Object.assign(this.dbEmailTemplate.emailCustomFields, this.request.emailCustomFields);
      });
  },
  watch: {
    templateList() {
      this.setSelectedTemplates();
    },
    selectedQuoteTemplate(newValue) {
      const id = _.get(newValue, 'value', newValue);
      if (!_.isEmpty(id)) {
        let templateObj;
        if (!_.isEmpty(this.templateList)) {
          templateObj = this.templateList.find(t => _.get(t, '_id', null) === id);
        } else {
          templateObj = this.request.quoteTemplateId;
        }
        Object.assign(this.dbTemplate.customFields, templateObj.customFields);
        Object.assign(this.dbTemplate, templateObj);
        this.dbTemplate.footerTemplate = _.get(templateObj, 'footerTemplate', null);
        const quoteHiddenFields = _.get(this, 'request.quoteHiddenFields', []);
        this.dbTemplate.hiddenFields = quoteHiddenFields.length !== 0 ? quoteHiddenFields : _.get(templateObj, 'hiddenFields', []);
        this.template = _.get(templateObj, 'template', '');
      }
    },
    selectedEmailTemplate(newValue) {
      const id = _.get(newValue, 'value', newValue);
      if (!_.isEmpty(id)) {
        let templateObj;
        if (!_.isEmpty(this.templateList)) {
          templateObj = this.templateList.find(t => _.get(t, '_id', null) === id);
        } else {
          templateObj = this.request.emailTemplateId;
        }
        this.emailTemplate = _.get(templateObj, 'template', '');
        Object.assign(this.dbEmailTemplate, templateObj);
      }
    },
    sanitizedTemplate(newSanitizedTemplate) {
      if (!_.isEmpty(newSanitizedTemplate)) {
        this.$emit('input', newSanitizedTemplate);
      }
    },
    template(newTemplate) {
      if (newTemplate) {
        this.$emit('template-sanitizing', true);
        if (templateTimeout) {
          clearTimeout(templateTimeout);
        }
        if (this.sanitizedTemplate) {
          templateTimeout = setTimeout(() => {
            this._sanitizeTemplate();
            templateTimeout = null;
          }, 100);
        } else {
          this._sanitizeTemplate();
        }
      } else {
        this.sanitizedTemplate = '';
      }
    },
    templateError(error) {
      this.pushNotification({
        title: 'Error parsing template',
        message: `Could not parse the template: ${error}`,
        state: 'danger',
      });
    },
    'request.requestType.name'(requestType) {
      const query = Object.assign({}, this.$route.query, { type: requestType });
      this.$router.replace({ name: this.$route.name, query, params: this.$route.params });
    },
    'request.quoteCurrency._id'(value) {
      if (!_.isNil(value) && !_.isEmpty(value)) {
        this.getCurrencySymbol(value)
          .then((symbol) => {
            this.quoteCurrencySymbol = symbol;
          });
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp', 'lspAddressFooter']),
    ...mapGetters('features', ['mock']),
    entityName() {
      return 'Quote';
    },
    exchangeRate() {
      if (_.isEmpty(this.lsp.currencyExchangeDetails)) {
        return 1;
      }
      const usdRate = this.lsp.currencyExchangeDetails.find(e =>
        e.base === e.quote && _.toNumber(e.quotation) === 1,
      );
      const rate = this.lsp.currencyExchangeDetails.find(e =>
        e.base === usdRate.base &&
        e.quote === _.get(this, 'request.quoteCurrency._id', '')
      );
      return _.get(rate, 'quotation', 1);
    },
    canEdit() {
      return this.hasRole('TEMPLATE_UPDATE_ALL');
    },
    canReadQuotes() {
      return this.hasRole({ oneOf: ['QUOTE_READ_COMPANY', 'QUOTE_READ_OWN', 'QUOTE_READ_ALL'] });
    },
    canSelectTemplates() {
      return this.hasRole('TEMPLATE_READ_ALL');
    },
    canApproveQuote() {
      return this.isWaitingForApproval && this.hasRole({ oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN', 'QUOTE_UPDATE_ALL', 'QUOTE_READ_COMPANY', 'QUOTE_READ_OWN'] });
    },
    isQuoteApproved() {
      return this.request.isQuoteApproved;
    },
    isWaitingForApproval() {
      return _.get(this.request, 'status', '') === REQUEST_WAITING_FOR_APPROVAL_STATUS;
    },
    isPreviewAvailable() {
      const service = _.get(this.request, 'ipPatent.service');
      const database = _.get(this.request, 'ipPatent.database');
      const sourceLanguage = _.get(this.request, 'languageCombinations.0.srcLangs.0.name');
      const isSrcLangSupportedForPctNationalPhase = PCT_NATIONAL_PHASE_SUPPORTED_SOURCE_LANGUAGES
        .includes(sourceLanguage);
      const unavailableCases = {
        case1: service === SERVICE_PATENT_TRANSLATION_QUOTE
          && database === DATABASE_PCT_NATIONAL_PHASE
          && !isSrcLangSupportedForPctNationalPhase,
        case2: service === SERVICE_PATENT_TRANSLATION_AND_FILLING_QUOTE
          && database === DATABASE_PCT_NATIONAL_PHASE
          && !isSrcLangSupportedForPctNationalPhase,
        case3: service === SERVICE_PATENT_TRANSLATION_QUOTE
          && database === DATABASE_DIRECT_FILLING_PARIS_CONVENTION
          && sourceLanguage !== LANGUAGE_NAME_ENGLISH,
        case4: service === SERVICE_PATENT_TRANSLATION_AND_FILLING_QUOTE
          && database === DATABASE_DIRECT_FILLING_PARIS_CONVENTION,
      };
      return !this.userIsContact
        || this.request.status !== REQUEST_WAITING_FOR_QUOTE_STATUS
        || Object.values(unavailableCases).every(aCase => !aCase);
    },
    notAvailablePreviewDescription() {
      return this.userIsContact ? 'Our team is working on your customized quote.' : undefined;
    },
    canExport() {
      return this.hasRole({ oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN', 'QUOTE_UPDATE_ALL', 'QUOTE_READ_COMPANY', 'QUOTE_READ_OWN'] });
    },
    canSendQuote() {
      return this.hasRole({ oneOf: ['ACTIVITY-EMAIL_UPDATE_ALL', 'ACTIVITY-EMAIL_CREATE_ALL'] });
    },
    canReadCustomFields() {
      return this.canSelectTemplates;
    },
    isRequestQuoted() {
      return this.request.requireQuotation;
    },
    quoteTemplateOptions() {
      return this.templateList.filter(t => t.type === QUOTE_TYPE && !t.deleted);
    },
    emailTemplateOptions() {
      return this.templateList.filter(t => t.type === QUOTE_EMAIL_TYPE && !t.deleted);
    },
    formatLanguageCombinationsTextForTemplateUse() {
      const stringToFormat = _.get(this.request, 'languageCombinationsText', '');
      const formattedString = stringToFormat
        .replace(/ - /g, ' to ')
        .replace(/,/g, ', ')
        .replace(/;$/, '')
        .replace(/;/g, '; ');
      return formattedString;
    },
    templateData() {
      if (_.has(this.request, 'location._id')) {
        if (_.isObject(this.request.location._id)) {
          this.request.location = this.request.location._id;
        }
      }
      if (_.has(this.request, 'contact._id')) {
        if (_.isObject(this.request.contact._id)) {
          this.request.contact = _.get(this.request, 'contact._id', {});
        }
      }
      if (_.has(this.request, 'deliveryDate')) {
        const requestDeliveryDate = _.get(this, 'request.deliveryDate');
        this.request.localDeliveryDate = localDateTime(requestDeliveryDate, 'YYYY-MM-DD hh:mm a');
      }
      const data = {
        languageExtraFields: Object.keys(extraFields),
        languageCombinationList: this.request.languageCombinationsText,
        languageCombinationsTextForTemplateUse: this.formatLanguageCombinationsTextForTemplateUse,
        emailCustomFields: this.dbEmailTemplate.emailCustomFields,
        customFields: this.dbTemplate.customFields,
        template: this.dbTemplate,
        emailTemplate: this.dbEmailTemplate,
        templateLogo: `${window.location.origin}/static/lsp-logos/${this.dbTemplate.logoName}`,
        lsp: this.lsp,
        lspLogo: _.get(this, 'lsp.logoImage.base64Image', ''),
        request: this.request,
        softwareRequirements: _.get(this.request, 'softwareRequirements', []).map(s => s.name).join(', '),
        requestStatus: _.get(this.request, 'status', ''),
        invoices: this.invoices,
        requestContactName: this.requestContactName,
        requestSchedulingContactName: this.requestSchedulingContactName,
        billingTerms: _.get(this.request, 'billingTerms', []).map(b => b.name).join(', '),
        requestCurrency: _.get(this.request, 'quoteCurrency.isoCode'),
        requestCurrencySymbol: this.quoteCurrencySymbol,
        documents: getRequestDocuments(this.request.languageCombinations),
        contactBillingAddress: _.get(this.request, 'contact.contactDetails.billingAddress', {
          country: {},
          state: {},
        }),
        projectManager: _.get(this.request, 'projectManagers.0', null),
        requestId: this.request._id,
        ipPatent: this.request.ipPatent,
        contact: {
          firstName: _.get(this.request, 'contact.firstName', ''),
          lastName: _.get(this.request, 'contact.lastName', ''),
        },
        salesRepEmail: _.get(this.request, 'contactSalesRep.email', ''),
        path: _.get(this, 'lsp.url', ''),
        userLogged: this.userLogged,
      };
      data.accountBillingAddress = data.contactBillingAddress;
      if (_.isEmpty(data.accountBillingAddress.line1) &&
        _.isEmpty(data.accountBillingAddress.line2)) {
        data.accountBillingAddress = _.get(this.request, 'company.billingAddress', {
          country: {},
          state: {},
        });
      }
      const sanitizeQuoteNotes = _.get(data, 'customFields.quoteNotes', '')
        .replace(/(<([^>]+)>)/gi, '')
        .replace('&nbsp;', '')
        .trim();
      data.hasQuoteNotes = !_.isEmpty(sanitizeQuoteNotes);
      data.hasNotes = !_.isEmpty(data.softwareRequirements) ||
        !_.isEmpty(data.documents) ||
        !_.isEmpty(_.get(data, 'request.deliveryMethod.name')) ||
        data.hasQuoteNotes;
      return data;
    },
    userIsContact() {
      return this.userLogged.type === CONTACT_USER_TYPE;
    },
    availableCustomFieldTypes() {
      return this.canReadCustomFields
        ? this.allCustomFieldTypes
        : [];
    },
    allCustomFieldTypes() {
      return this.getAvailableCustomFieldTypes(
        this.quoteTemplateCustomFieldTypes(this.dbTemplate.customFields),
        this.template
      );
    },
    availableEmailCustomFieldTypes() {
      return this.canReadCustomFields
        ? this.getAvailableCustomFieldTypes(this.quoteEmailCustomFieldTypes, this.emailTemplate)
        : [];
    },
    isValid() {
      if (!this.canEdit) {
        return true;
      }
      return this.areMandatoryFieldsFilled;
    },
    areMandatoryFieldsFilled() {
      const isServiceAndDeliveryTypeSelected = !_.isEmpty(this.selectedServiceType)
        && !_.isEmpty(this.selectedDeliveryType);
      return this.areValidTemplateCustomFields
        && this.areValidEmailCustomFields
        && !_.isEmpty(this.selectedEmailTemplate)
        && !_.isEmpty(this.selectedQuoteTemplate)
        && (!this.request.serviceDeliveryTypeRequired || isServiceAndDeliveryTypeSelected);
    },
    requestSchedulingContactName() {
      const contact = _.get(this, 'request.schedulingContact');
      return `${_.get(contact, 'firstName', '')} ${_.get(contact, 'lastName', '')}`;
    },
    requestContactName() {
      const contact = _.get(this, 'request.contact');
      return `${_.get(contact, 'firstName', '')} ${_.get(contact, 'lastName', '')}`;
    },
    reportTemplate() {
      return this.isRequestTypeNameIP ? this.template : this.sanitizedTemplate;
    },
    isRequestTypeNameIP() {
      return _.get(this, 'request.requestType.name') === 'IP';
    },
    footerTemplate() {
      const selectedFooterTemplate = this.footerTemplateOptions
        .find(option => option._id === this.dbTemplate.footerTemplate);
      return _.get(selectedFooterTemplate, 'description', '');
    },
    canEditServiceAndDeliveryType() {
      return this.hasRole(['SERVICE-TYPE_READ_ALL', 'DELIVERY-TYPE_READ_ALL']);
    },
    canExportCsv() {
      return this.canExport && this.isPreviewShown && this.isRequestTypeNameIP;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('template', ['copyTemplateContent']),
    setSelectedTemplates() {
      if (_.get(this.request, 'quoteTemplateId._id')) {
        this.selectedQuoteTemplate = this.request.quoteTemplateId._id;
      }
      if (_.get(this.request, 'emailTemplateId._id')) {
        this.selectedEmailTemplate = this.request.emailTemplateId._id;
      }
    },
    _service() {
      return templateService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.template.readDate');
      if (newReadDate) {
        this.dbTemplate.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      if (_.get(response, 'data.template')) {
        this.dbTemplate = response.data.template;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'dbTemplate', freshEntity);
    },
    async sendQuote() {
      this.isSendingQuote = true;
      await this.$ua.trackEvent('Request - Workflows-QDetail', 'Click', 'Send Quote Btn');
      let htmlBody = '';
      const emailTemplateData = {
        ...this.templateData,
        custom: this.dbTemplate.customFields,
        emailCustom: this.dbEmailTemplate.emailCustomFields,
      };
      try {
        htmlBody = runTemplate(this.dbEmailTemplate.template, emailTemplateData);
      } catch (error) {
        this.isSendingQuote = false;
        const notification = {
          title: 'Error',
          message: 'Failed to parse template',
          state: 'danger',
          response: error,
        };
        this.pushNotification(notification);
        return false;
      }
      const attachmentData = {
        name: '',
        value: '',
      };
      let reportFilename = this.request.no;
      if (_.get(this, 'lsp.supportsIpQuoting', false) && this.isRequestTypeNameIP) {
        reportFilename = this.getIpQuoteExportFilename();
      }
      const { pdfBlob, filename } = await this.$refs['report-preview'].getGeneratedPdfFile(reportFilename);
      attachmentData.name = filename;
      attachmentData.value = pdfBlob;
      const embeddedAttachments = [attachmentData];
      this.$emit('activity-creation', {
        _id: '',
        activityType: 'Email',
        subject: 'Quote to approve',
        dateSent: moment(),
        tags: ['Quote'],
        emailDetails: {
          isQuoteActivity: true,
          from: this.userLogged.email,
          to: [this.request.contact.email],
          cc: _.concat(this.request.otherCC, _.get(this.request, 'otherContact.email', '')),
          company: this.request.company,
          internalDepartments: [this.request.internalDepartment],
          opportunities: [],
          requests: [this.request],
          status: this.request.company.status,
          htmlBody: htmlBody,
          embeddedAttachments,
        },
      }, emailTemplateData);
      this.isSendingQuote = false;
    },
    shouldAddNewPage(heightLeft, pageHeight, headerHeight) {
      const totalHeightPage = pageHeight - headerHeight;
      heightLeft -= totalHeightPage;
      return heightLeft >= 120;
    },
    async downloadPdf() {
      this.$ua.trackEvent('Request - Workflows-QDetail', 'Click', 'Export to PDF Btn');
      this.isExportingPdf = true;
      let reportFilename = `quote-${this.request.no}`;
      if (_.get(this, 'lsp.supportsIpQuoting', '') && this.isRequestTypeNameIP) {
        reportFilename = this.getIpQuoteExportFilename();
      }
      await this.$refs['report-preview'].downloadPdf(reportFilename);
      this.isExportingPdf = false;
    },
    async downloadCsv() {
      const fileName = this.getIpQuoteExportFilename();
      new IpQuoteCsvExporter(this.templateData.request).export(fileName);
    },
    async onQuoteApprove() {
      let notification;
      this.loading = true;
      this.$ua.trackEvent('Request - Workflows-QDetail', 'Click', 'Approve Quote Btn');
      try {
        await this.save({ hideNotifications: true });
        await requestService.approveQuote(this.request._id);
        this.request.isQuoteApproved = true;
        notification = {
          title: 'Success',
          message: 'The quote was approved',
          state: 'success',
        };
        if (this.isRequestTypeNameIP) {
          this.showApproveQuoteModal = true;
        }
      } catch (err) {
        notification = {
          title: 'Error',
          message: 'Failed to approve quote',
          state: 'danger',
          response: err,
        };
      } finally {
        if (!this.isRequestTypeNameIP) {
          this.pushNotification(notification);
        }
        const now = moment();
        const shouldShowExceededAcceptanceDeadlineWarning = this.canEditServiceAndDeliveryType &&
          moment(this.request.deliveryDate).isBefore(now);
        if (shouldShowExceededAcceptanceDeadlineWarning) {
          this.pushNotification({
            title: 'Warning!',
            message: 'Since you have exceeded the acceptance deadline, please note that the delivery deadline will be updated. We will contact you shortly with the new deadline date.',
            state: 'warning',
          });
        }
        this.loading = false;
      }
    },
    getRequestQuote() {
      const requestId = _.get(this.$route, 'params.requestId');
      this.loading = true;
      return quoteService.getDetail(requestId).then((response) => {
        this.$set(this, 'request', _.get(response, 'data'));
        this.selectedServiceType = this.request.serviceTypeId;
        this.selectedDeliveryType = this.request.deliveryTypeId;
        this.$emit('breadcrumb-update', this.$route, this.request);
        const workflowsLength = this.request.workflows.length;
        let foreignInvoiceTotal = 0;
        this.request.workflows = this.request.workflows.map(w =>
          parseWorkflowCurrencyFields(w, true));
        this.request.foreignInvoiceTotal = 0;
        this.request.workflows.forEach((workflow, wIndex) => {
          const currInvoicesLength = this.invoices.length;
          workflow.last = false;
          workflow.printTotal = wIndex + 1 === workflowsLength;
          workflow.tasks.forEach((task, index) => {
            const shouldPrintMinCharge = task.minCharge >= task.total && task.minCharge > 0;
            task.last = index + 1 === workflow.tasks.length || workflow.tasks.length === 1;
            task.first = index === 0;
            if (shouldPrintMinCharge) {
              this.invoices.push({
                task,
                workflow,
                shouldPrintMinCharge: true,
              });
            } else {
              task.invoiceDetails.forEach((invoiceDetail, i) => {
                const editedTask = Object.assign({}, task);
                const invoice = invoiceDetail.invoice;
                invoice.breakdown = _.get(invoice, 'breakdown', { name: '' });
                if (invoice.pdfPrintable) {
                  const isLastInvoice = i + 1 === task.invoiceDetails.length;
                  const editedWorkflow = Object.assign({}, workflow, {
                    last: task.last && isLastInvoice && wIndex + 1 === workflowsLength,
                  });
                  const firstPrintableInvoice = task.invoiceDetails.findIndex(inv =>
                    inv.invoice.pdfPrintable);
                  if (i > firstPrintableInvoice) {
                    Object.assign(editedTask, {
                      description: '', ability: '',
                    });
                  }
                  Object.assign(invoice, {
                    shouldPrintMinCharge,
                    first: i === 0,
                    workflow: editedWorkflow,
                    task: editedTask,
                  });
                  this.invoices.push(invoice);
                }
              });
            }
            foreignInvoiceTotal = sum(workflow.foreignSubtotal, this.request.foreignInvoiceTotal);
          });
          this.request.foreignInvoiceTotal = ensureNumber(foreignInvoiceTotal);
          if (!_.isNil(this.invoices[this.invoices.length - 1])) {
            this.invoices[this.invoices.length - 1].printSubtotal = true;
          }
          if (!_.isNil(this.invoices[currInvoicesLength])) {
            this.invoices[currInvoicesLength].shouldPrintWorkflowLineDetail = true;
            this.invoices[currInvoicesLength].workflowNumber = wIndex + 1;
          }
        });
      })
        .catch((err) => {
          this.pushNotification(errorNotification(`Request could not be retrieved. ${err}`, 3, err));
        });
    },
    _sanitizeTemplate() {
      const div = document.createElement('div');
      div.innerHTML = this.template;
      const scripts = div.getElementsByTagName('script');
      const len = scripts.length;
      if (len) {
        for (let i = 0; i < len; i++) {
          const s = scripts[i];
          s.parentNode.removeChild(s);
        }
      }
      this.sanitizedTemplate = sanitizeHtml(div.innerHTML, SANITIZE_OPTIONS);
      this.templateError = null;
    },
    saveQuoteRequestData({ hideNotifications = false }) {
      const availableCustomFields = this.availableCustomFieldTypes.map(field => field.templateKey);
      const customFieldsToSave = _.pick(this.dbTemplate.customFields, availableCustomFields);
      const availableEmailCustomFields = this.availableEmailCustomFieldTypes
        .map(field => field.templateKey);
      const emailCustomFieldsToSave = _.pick(
        this.dbEmailTemplate.emailCustomFields, availableEmailCustomFields);
      return requestService.saveQuoteRequestData(this.request._id, {
        quoteTemplateId: this.dbTemplate._id,
        emailTemplateId: this.dbEmailTemplate._id,
        quoteCustomFields: customFieldsToSave,
        emailCustomFields: emailCustomFieldsToSave,
        serviceTypeId: this.selectedServiceType,
        deliveryTypeId: this.selectedDeliveryType,
        hiddenFields: this.dbTemplate.hiddenFields,
      })
        .then(() => {
          if (!hideNotifications) {
            this.pushNotification(successNotification('Changes updated successfully'));
          }
        }).catch((err) => {
          const errMessage = _.get(err, 'status.message', `could not edit ${this.entityName}`);
          this.pushNotification(warningNotification(errMessage, 3, err));
        })
        .finally(() => {
          this.loading = false;
        });
    },
    saveTemplates() {
      const isQuoteTemplateSelected = !_.isEmpty(this.dbTemplate._id);
      const isEmailTemplateSelected = !_.isEmpty(this.dbEmailTemplate._id);
      return Promise.resolve().then(() => {
        if (isQuoteTemplateSelected && this.isSaveQuoteCustomFieldChangesChecked) {
          return this.saveTemplateCustomFields(this.dbTemplate);
        }
      }).then(() => {
        if (isEmailTemplateSelected && this.isSaveEmailCustomFieldChangesChecked) {
          return this.saveTemplateCustomFields(this.dbEmailTemplate);
        }
      });
    },
    saveTemplateCustomFields(template) {
      const templateId = template._id;
      if (!_.isEmpty(templateId)) {
        return templateService.edit(template)
          .then(() => {
            this.pushNotification(successNotification('Changes updated successfully'));
          }).catch((err) => {
            const message = _.get(err, 'status.message', `could not edit ${this.entityName}`);
            if (_.get(err, 'status.code') === 409
              && _.get(err, 'status.message', '').indexOf('You tried to edit an old record') !== -1) {
              this.pushNotification(warningNotification(err.status.message, 3, err, `${this.entityName} update failed`));
            } else {
              this.pushNotification(warningNotification(message, 3, err));
            }
          })
          .finally(() => {
            this.loading = false;
          });
      }
      return Promise.resolve();
    },
    async save(options = {}) {
      this.loading = true;
      if (this.canEdit) {
        await this.saveTemplates();
      }
      this.saveQuoteRequestData(options);
      this.loading = false;
    },
    onSaveClick() {
      this.$ua.trackEvent('Request - Workflows-QDetail', 'Click', 'Save-QDetails Btn');
      return this.save();
    },
    getIpQuoteExportFilename() {
      const patentApplicationNumber = _.get(this.request, 'ipPatent.patentApplicationNumber', '');
      const patentPublicationNumber = _.get(this.request, 'ipPatent.patentPublicationNumber', '');
      const isWIPO = patentApplicationNumber.includes('PCT');
      const database = _.get(this.request, 'ipPatent.database', '');
      const isNoDB = database === 'Direct Filing/Paris Convention';
      let result = `EPValidationPhaseEstimate for ${patentPublicationNumber}_${this.request.no}`;
      if (isWIPO) {
        result = `PCTNationalPhaseEstimate for ${patentApplicationNumber}_${this.request.no}`;
      } else if (isNoDB) {
        result = `ParisConventionEstimate for ${this.request.no}`;
      }
      return result;
    },
    trackSubmit() {
      this.$ua.trackEvent('Request - Workflows-QDetail-ApproveQ', 'Click', 'Submit Order Btn');
    },
    cancelHandler() {
      this.$refs['report-preview'].cancelReportPreviewSettings();
      this.$emit('section-navigate-root');
    },
    emulateDownload(filename, text) {
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8, + ${encodeURIComponent(text)}`);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    setValidTemplateCustomFields(value) {
      this.areValidTemplateCustomFields = value;
    },
    setValidEmailCustomFields(value) {
      this.areValidEmailCustomFields = value;
    },
    async retrieveFooterTemplateOptions() {
      if (this.hasRole('FOOTER-TEMPLATE_READ_ALL')) {
        const footerTemplateOptions = await footerTemplateService.retrieve();
        this.footerTemplateOptions = _.get(footerTemplateOptions, 'data.list', []);
      }
    },
    getCurrencySymbol(id) {
      return currencyService.get(id)
        .then(res => _.get(res, 'data.currency.symbol', ''));
    },
    updatePreviewVisibility(isShown) {
      this.isPreviewShown = isShown;
    },
    setLocalDeliveryDate() {
      const requestDeliveryDate = _.get(this, 'request.deliveryDate', new Date());
      this.localDeliveryDate = localDateTime(requestDeliveryDate, 'YYYY-MM-DD HH:mm');
    },
    setHiddenFields(newValue) {
      this.dbTemplate.hiddenFields = newValue;
    },
  },
};