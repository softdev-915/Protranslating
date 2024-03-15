/* global document window Blob */
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import Promise from 'bluebird';
import CcPaymentModal from '../cc-payment-modal/cc-payment-modal.vue';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import { toTextValueOption, toIdName, toOption } from '../../../../utils/select2';
import TemplateService from '../../../../services/template-service';
import ArInvoiceService from '../../../../services/ar-invoice-service';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import NotificationMixin from '../../../../mixins/notification-mixin';
import { customFieldTypesMixin } from '../../../report-preview/custom-field-types-mixin';
import ReportPreview from '../../../report-preview/report-preview.vue';

const CREATE_ROLES = ['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL'];
const templateService = new TemplateService();
const arInvoiceService = new ArInvoiceService();

export default {
  mixins: [
    userRoleCheckMixin,
    NotificationMixin,
    customFieldTypesMixin,
  ],
  components: {
    CcPaymentModal,
    SimpleBasicSelect,
    ReportPreview,
  },
  data() {
    return {
      isDownloadingPdf: false,
      invoice: {
        accounting: {
          currency: {
            isoCode: '',
          },
        },
        status: '',
        template: {
          _id: '',
          name: '',
        },
        contact: { _id: '' },
        company: { _id: '' },
      },
      invoiceTemplate: {
        _id: '',
        name: '',
        customFields: {
          rates: '2 decimals',
          recipient: '',
          language: 'English',
          vatOptionsForTotalAmount: 'Net Total, VAT, TOTAL',
          vatRate: '22%',
          vatAmount: '',
          externalAccountingCodeLabel: '',
        },
        hiddenFields: [],
        hideableFields: [],
      },
      invoiceTemplateData: {},
      invoiceTemplateOptions: [],
      loading: false,
      template: '',
      footerTemplate: '',
    };
  },
  created() {
    this.loading = true;
    this.init()
      .catch((e) => this.pushError(e.message, e))
      .finally(() => { this.loading = false; });
  },
  computed: {
    ...mapGetters('app', ['lsp', 'userLogged']),
    invoiceId() {
      return this.$route.params.entityId;
    },
    canCreate() {
      return this.hasRole(CREATE_ROLES);
    },
    canSelectTemplates() {
      return this.hasRole('TEMPLATE_READ_ALL');
    },
    selectedInvoiceTemplate() {
      return toOption(this.invoiceTemplate);
    },
    isTemplateValid() {
      return !_.isEmpty(_.get(this, 'invoiceTemplate._id'));
    },
    canEdit() {
      return this.hasRole('TEMPLATE_UPDATE_ALL');
    },
    canSend() {
      return this.hasRole({ oneOf: ['ACTIVITY-EMAIL_UPDATE_ALL', 'ACTIVITY-EMAIL_CREATE_ALL'] });
    },
    isValid() {
      return !this.canEdit || this.isTemplateValid;
    },
    availableCustomFieldTypes() {
      return this.getAvailableCustomFieldTypes(
        this.invoiceTemplateCustomFieldTypes(this.invoiceTemplate.customFields),
        this.template
      );
    },
  },
  methods: {
    ...mapActions('sideBar', ['setCollapsed']),
    ...mapActions('notifications', ['pushNotification']),
    async onInvoiceTemplateSelected(template) {
      Object.assign(this.invoiceTemplate, toIdName(template));
      await this.getTemplateData();
    },
    formatDefaultSelectOption: entity => toTextValueOption(entity),
    async getTemplateData() {
      if (_.isEmpty(this.invoiceId) || _.isEmpty(this.invoiceTemplate._id)) {
        return;
      }
      try {
        const res = await arInvoiceService.getInvoiceTemplate(
          this.invoiceId,
          this.invoiceTemplate._id,
        );
        const {
          template,
          footerTemplate,
          invoice,
          customFields,
          hiddenFields,
          hideableFields,
          currencySymbol,
        } = res.data;
        Object.assign(this.invoiceTemplate.customFields, customFields);
        Object.assign(this.invoiceTemplate.hiddenFields, hiddenFields);
        Object.assign(this.invoiceTemplate.hideableFields, hideableFields);
        Object.assign(this.invoiceTemplateData, {
          invoice,
          currencySymbol,
          userLogged: this.userLogged,
        });
        invoice.request.languageCombinationsTextForTemplateUse
          = this.formatLanguageCombinationsTextForTemplateUse();
        this.footerTemplate = footerTemplate;
        this.template = template;
        const emptyFields = [];
        if (_.isEmpty(invoice.description) && template.match('invoice.description')) {
          emptyFields.push('Invoice Description');
        }
        if (_.isEmpty(invoice.purchaseOrder) && template.match('invoice.purchaseOrder')) {
          emptyFields.push('PO Number');
        }
        if (_.isEmpty(_.get(invoice.salesRep, 'firstName')) && _.isEmpty(_.get(invoice.salesRep, 'lastName')) && template.match('invoice.salesRep')) {
          emptyFields.push('Sales Representative');
        }
        if (emptyFields.length > 0) {
          const fields = emptyFields.length > 1 ? 'fields' : 'field';
          this.pushNotification({
            title: 'Warning',
            message: `Empty ${fields} (${emptyFields.join(', ')}) won't be visible in template`,
            state: 'warning',
          });
        }
      } catch (err) {
        const notification = {
          title: 'Error',
          message: 'Could not get template data',
          state: 'danger',
          response: err,
        };
        notification.response = err;
        this.pushNotification(notification);
      }
    },
    async init() {
      const promiseInvoice = this.retrieveInvoiceDefaultTemplateId();
      let promiseTemplates = Promise.resolve([]);
      if (this.canSelectTemplates) {
        promiseTemplates = this.retrieveTemplates();
      }
      const promises = await Promise.all([promiseInvoice, promiseTemplates]);
      this.setDefaultTemplate(promises[0]);
      if (!this.canSelectTemplates || !_.isEmpty(this.invoiceTemplate._id)) {
        await this.getTemplateData();
      }
    },
    async retrieveInvoiceDefaultTemplateId() {
      const res = await arInvoiceService.get(this.invoiceId);
      this.invoice = _.get(res, 'data.ar-invoice', '');
      const defaultTemplate = _.get(this.invoice, 'templates.invoice', {});
      this.invoiceTemplate = Object.assign(this.invoiceTemplate, defaultTemplate);
      return _.get(this.invoiceTemplate, '_id');
    },
    async retrieveTemplates() {
      if (!this.canSelectTemplates) {
        return;
      }
      const queryTemplateTypes = 'Invoice';
      const responseTemplates = await templateService.retrieveByTypes(queryTemplateTypes);
      const templates = responseTemplates.data;
      if (templates.length !== 0) {
        this.invoiceTemplateOptions = templates;
      }
    },
    setDefaultTemplate(defaultTemplateId) {
      const defaultTemplate = this.invoiceTemplateOptions.find((template) => template._id === defaultTemplateId);
      if (!_.isEmpty(defaultTemplate)) {
        this.invoiceTemplate = _.pick(defaultTemplate, ['_id', 'name', 'customFields', 'hiddenFields', 'hideableFields']);
      }
    },
    formatLanguageCombinationsTextForTemplateUse() {
      const stringToFormat = this.invoiceTemplateData.invoice.request.languageCombinationsText;
      const formattedString = stringToFormat
        .replace(/ - /g, ' to ')
        .replace(/,/g, ', ')
        .replace(/;$/, '')
        .replace(/;/g, '; ');
      return formattedString;
    },
    closeMenu() {
      return new Promise((resolve) => {
        this.setCollapsed(true);
        setTimeout(resolve, 1000);
      });
    },
    async downloadPdf() {
      if (this.isDownloadingPdf) {
        return;
      }
      this.isDownloadingPdf = true;
      const reportFilename = this.invoice.no;
      await this.$refs['report-preview'].downloadPdf(reportFilename);
      this.isDownloadingPdf = false;
    },
    async sendInvoice() {
      if (!this.canSend) {
        return;
      }
      this.loading = true;
      this.pushNotification({
        title: 'Wait',
        message: 'The invoice is being prepared for dispatch',
        state: 'info',
      });
      try {
        const reportFilename = this.invoice.no;
        const pdfPromise = this.$refs['report-preview'].getGeneratedPdfFile(reportFilename);
        const activityPromise = arInvoiceService.getInvoiceActivity(this.invoiceId);
        const [{ filename, pdfBlob }, { data: invoiceActivity }] = await Promise.all([
          pdfPromise,
          activityPromise,
        ]);
        _.set(invoiceActivity, 'emailDetails.embeddedAttachments', [{
          name: filename,
          value: pdfBlob,
          size: pdfBlob.size,
        }]);
        this.$emit('invoice-activity-creation', invoiceActivity, this.invoiceId);
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: 'Could not send the invoice',
          state: 'danger',
          response: err,
        });
      }
      this.loading = false;
    },
    cancel() {
      this.$refs['report-preview'].cancelReportPreviewSettings();
      this.$emit('section-navigate-root');
    },
    save() {
      if (!this.isValid || this.loading) {
        return;
      }
      this.loading = true;
      const invoice = {
        _id: this.invoiceId,
        templates: {
          invoice: this.invoiceTemplate,
          email: _.get(this.invoice, 'templates.email'),
        },
      };
      arInvoiceService.edit(invoice).then(() => {
        const notification = {
          title: 'Success',
          message: 'Successfully edited AR Invoice',
          state: 'success',
        };
        this.pushNotification(notification);
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: _.get(err, 'status.message', 'could not update Ar Invoice'),
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      });
      this.loading = false;
    },
    setHiddenFields(newValue) {
      this.invoiceTemplate.hiddenFields = newValue;
    },
  },
  watch: {
    'invoiceTemplate.customFields.vatRate': {
      immediate: true,
      handler(vatRate) {
        const calculatedVatAmount = (this.invoice.accounting.amount *
          (parseFloat(vatRate) / 100)).toFixed(2);
        this.invoiceTemplate.customFields.vatAmount = isNaN(calculatedVatAmount) ? ' ' : calculatedVatAmount;
      },
    },
  },
};
