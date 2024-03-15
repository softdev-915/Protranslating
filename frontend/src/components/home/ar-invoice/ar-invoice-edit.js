/* global FormData */
import _ from 'lodash';
import { mapGetters } from 'vuex';
import Big from 'big.js';
import moment from 'moment';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { getId } from '../../../utils/request-entity';
import { toUserName } from '../../../utils/user';
import { entityEditMixin } from '../../../mixins/entity-edit';
import ArInvoiceService from '../../../services/ar-invoice-service';
import ArInvoiceEntriesService from '../../../services/ar-invoice-entries-service';
import CurrencySelector from '../../currency-select/currency-selector.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import BillingTermSelector from '../company/billing-information/billing-term-selector.vue';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import SiConnectorDetails from '../connector/si-connector-details.vue';
import TemplateService from '../../../services/template-service';
import BillingTermService from '../../../services/billing-term-service';
import BigDataSetGrid from '../../responsive-grid/big-data-set-grid/big-data-set-grid.vue';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import { toOption, toIdName, toTextValueOption } from '../../../utils/select2/index';
import AttachmentsModal from '../attachments-modal/attachments-modal.vue';
import { ensureNumber } from '../../../utils/bigjs';
import localDateTime from '../../../utils/filters/local-date-time';
import CcPaymentModal from './cc-payment-modal/cc-payment-modal.vue';
import InvoiceReverseModal from './invoice-reverse-modal/invoice-reverse-modal.vue';
import ContactSelect from '../user/contact/contact-select.vue';

const arInvoiceService = new ArInvoiceService();
const templateService = new TemplateService();
const billingTermService = new BillingTermService();
const EDIT_ROLES = [
  'INVOICE_UPDATE_ALL',
  'INVOICE_UPDATE_OWN',
];
const CREATE_ROLES = ['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL'];
const INVOICE_TEMPLATE = 'Invoice';
const INVOICE_EMAIL_TEMPLATE = 'Invoice Email';
const IN_PROGRESS_STATUS = 'In Progress';
const DRAFTED_STATUS = 'Drafted';
const REVERSED_STATUS = 'Reversed';
const buildInitialState = () => ({
  isVisibleEntriesGrid: false,
  wasCsvImported: false,
  activeRows: [],
  invoice: {
    _id: '',
    no: '',
    status: '',
    company: {
      _id: '',
      name: '',
      hierarchy: '',
      status: '',
    },
    contact: {
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
      billingEmail: '',
      billingAddress: {},
    },
    purchaseOrder: '',
    billingTerm: {
      _id: '',
      name: '',
    },
    date: moment().utc().format(),
    dueDate: '',
    glPostingDate: '',
    postOutOfPeriod: false,
    description: '',
    salesRep: {
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
    },
    revenueRecognition: {
      startDate: '',
      endDate: '',
    },
    templates: {
      invoice: '',
      email: '',
    },
    accounting: {
      amount: 0,
      currency: null,
    },
    sent: false,
    attachments: [],
    siConnector: {},
  },
  originalDescription: '',
  datepickerOptions: {
    onValueUpdate: null,
    enableTime: true,
    allowInput: false,
    disableMobile: 'true',
  },
  currencyFormatter: ({ _id, isoCode, exchangeRate }) => ({
    text: isoCode,
    value: { _id, isoCode, exchangeRate },
  }),
  entityName: 'invoice',
  addDaysBillingTerm: 0,
  billingTermOptions: [],
  currencyOptions: [],
  purchaseOrderOptions: [],
  templates: [],
  checkedEntriesIds: [],
  entries: [],
  areFilesLoading: false,
  isDownloadingDocument: {},
});

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  components: {
    SiConnectorDetails,
    CurrencySelector,
    UtcFlatpickr,
    BillingTermSelector,
    CompanyAjaxBasicSelect,
    SimpleBasicSelect,
    ServerPaginationGrid,
    BigDataSetGrid,
    AttachmentsModal,
    CcPaymentModal,
    InvoiceReverseModal,
    ContactSelect,
  },
  data() {
    return buildInitialState();
  },
  async created() {
    try {
      this.httpRequesting = true;
      const [billingTermResponse, templates] = await Promise.all([
        billingTermService.retrieve(),
        this.getTemplates(),
      ]);
      this.billingTermOptions = billingTermResponse.data.list;
      if (templates.length !== 0) {
        this.templates = templates;
      }
    } catch (error) {
      this.pushError(error.message, error);
    } finally {
      this.httpRequesting = false;
    }
  },
  watch: {
    'invoice.date': {
      immediate: true,
      handler(newValue) {
        this.invoice.glPostingDate = newValue;
        this.setAddDaysBillingTerm();
      },
    },
  },
  computed: {
    ...mapGetters('app', ['lsp', 'currencies', 'lspAddressFooter']),
    mainQuery() {
      return {
        contact: this.invoice.contact._id,
        company: this.selectedCompany.value,
        currency: this.foreignCurrency,
        poNumber: this.invoice.purchaseOrder,
      };
    },
    contactEmail() {
      const billingEmail = _.get(this.invoice.contact, 'contactDetails.billingEmail', '');
      if (billingEmail) {
        return billingEmail;
      }
      return _.get(this.invoice.contact, 'billingEmail', '');
    },
    contactBillingAddress() {
      let billingAddressObj;
      if (_.has(this.invoice.contact, 'billingAddress')) {
        billingAddressObj = _.get(this.invoice.contact, 'billingAddress');
      } else {
        billingAddressObj = _.get(this.invoice.contact, 'contactDetails.billingAddress');
      }
      if (_.isEmpty(billingAddressObj)) {
        return '';
      }
      if (!_.isEmpty(billingAddressObj.billingAddressText)) {
        return billingAddressObj.billingAddressText;
      }
      let billingAddressText = '';
      const {
        line1, line2, city, zip, country, state,
      } = billingAddressObj;
      if (!_.isEmpty(line1)) {
        billingAddressText += `${line1} `;
      }
      if (!_.isEmpty(line2)) {
        billingAddressText += `${line2} `;
      }
      if (!_.isEmpty(city)) {
        billingAddressText += `${city} `;
      }
      const stateName = _.get(state, 'name');
      if (!_.isEmpty(stateName)) {
        billingAddressText += `${stateName} `;
      }
      const countryName = _.get(country, 'name');
      if (!_.isEmpty(countryName)) {
        billingAddressText += `${countryName} `;
      }
      if (!_.isEmpty(zip)) {
        billingAddressText += `${zip}`;
      }
      return billingAddressText;
    },
    revRecStartDate() {
      return this.getLocalDate('startDate');
    },
    revRecEndDate() {
      return this.getLocalDate('endDate');
    },
    isNew() {
      return _.isEmpty(this.invoice._id);
    },
    isSynced() {
      return _.get(this.invoice, 'siConnector.isSynced', false);
    },
    hasSyncError() {
      return !_.isEmpty(_.get(this.invoice, 'siConnector.error', ''));
    },
    canCreate() {
      return this.hasRole({ oneOf: CREATE_ROLES });
    },
    isInvoiceBeingCreated() {
      return [DRAFTED_STATUS, IN_PROGRESS_STATUS].some((status) => status === this.invoice.status);
    },
    canEdit() {
      if (this.isInvoiceBeingCreated) {
        return false;
      }
      if (!this.hasOneOfEditRoles) {
        return false;
      }
      if (this.isNew) {
        return true;
      }
      if (this.isSynced) {
        return false;
      }
      return this.hasSyncError;
    },
    canMakePayment() {
      return !_.isEmpty(this.invoice._id)
        && ![DRAFTED_STATUS, IN_PROGRESS_STATUS, REVERSED_STATUS].includes(this.invoice.status);
    },
    hasOneOfEditRoles() {
      return this.hasRole({ oneOf: EDIT_ROLES });
    },
    canEditPostOutOfPeriod() {
      return this.hasRole('INVOICE_UPDATE_ALL') && this.canEdit;
    },
    isReverseModalVisible() {
      return !this.isNew && this.hasRole('INVOICE-ACCT_READ_ALL')
        && _.get(this.invoice, 'status') !== 'Reversed';
    },
    isValidCompany() {
      return !_.isEmpty(this.invoice.company);
    },
    isValidContact() {
      return !_.isEmpty(_.get(this.invoice, 'contact._id'));
    },
    isValidCurrency() {
      return !_.isEmpty(_.get(this.invoice, 'accounting.currency'));
    },
    isValidBillingTerm() {
      return !_.isEmpty(_.get(this.invoice, 'billingTerm._id'));
    },
    isValidContactEmail() {
      return !_.isEmpty(this.contactEmail);
    },
    isValidContactBillingAddress() {
      return !_.isEmpty(this.contactBillingAddress);
    },
    isValidDate() {
      return !_.isEmpty(this.invoice.date);
    },
    isValidDueDate() {
      return !_.isEmpty(this.invoice.dueDate);
    },
    isValidGlPostingDate() {
      return !_.isEmpty(this.invoice.glPostingDate);
    },
    isValidInvoiceTemplate() {
      return !_.isEmpty(_.get(this.invoice, 'templates.invoice._id'));
    },
    isValidEmailTemplate() {
      return !_.isEmpty(_.get(this.invoice, 'templates.email._id'));
    },
    isInvoiceOptionsSectionsValid() {
      return this.isValidCompany && this.isValidContact && this.isValidCurrency;
    },
    areValidEntries() {
      if (this.wasCsvImported) {
        return true;
      }
      if (!this.isNew) {
        return true;
      }
      if (_.isEmpty(this.checkedEntries)) {
        return false;
      }
      return this.checkedEntries.every((entry) => !_.isEmpty(_.get(entry, 'glAccountNo')));
    },
    isValid() {
      return this.isInvoiceOptionsSectionsValid
        && this.isValidBillingTerm
        && this.isValidContactEmail
        && this.isValidContactBillingAddress
        && this.isValidDate
        && this.isValidDueDate
        && this.isValidGlPostingDate
        && this.isValidInvoiceTemplate
        && this.isValidEmailTemplate
        && this.areValidEntries;
    },
    isSaveButtonDisabled() {
      if (this.isInvoiceBeingCreated) {
        return true;
      }
      if (!this.isValid) {
        return true;
      }
      if (!this.isNew && this.isSynced) {
        return this.originalDescription === _.get(this.invoice, 'description');
      }
      return false;
    },
    invoiceTemplateOptions() {
      return this.templates.filter((template) => template.type === INVOICE_TEMPLATE);
    },
    emailTemplateOptions() {
      return this.templates.filter((template) => template.type === INVOICE_EMAIL_TEMPLATE);
    },
    selectedCompany() {
      const value = _.get(this, 'invoice.company._id', '');
      const text = _.get(this, 'invoice.company.hierarchy', '');
      return { text, value };
    },
    selectedCompanyId() {
      return getId(this.invoice.company);
    },
    selectedBillingTerm() {
      return toOption(_.get(this.invoice, 'billingTerm'));
    },
    selectedInvoiceTemplate() {
      return toOption(_.get(this.invoice, 'templates.invoice'));
    },
    selectedEmailTemplate() {
      return toOption(_.get(this.invoice, 'templates.email'));
    },
    poExist() {
      return !_.isEmpty(this.purchaseOrderOptions);
    },
    foreignCurrency() {
      return _.get(this, 'invoice.accounting.currency.isoCode');
    },
    baseCurrency() {
      return _.get(this, 'currencies[0].isoCode');
    },
    arInvoiceEntriesService() {
      const invoice = {
        companyId: this.selectedCompanyId,
        currencyId: _.get(this.invoice, 'accounting.currency._id'),
        purchaseOrder: this.invoice.purchaseOrder,
        _id: this._getEntityId(),
      };
      return new ArInvoiceEntriesService({ invoice, entries: this.entries });
    },
    entriesKey() {
      const currencyId = _.get(this.invoice, 'accounting.currency._id');
      const { purchaseOrder } = this.invoice;
      return `${this.selectedCompanyId} ${currencyId} ${purchaseOrder} ${this.isNew}`;
    },
    checkedEntries() {
      return this.entries.filter((entry) => this.checkedEntriesIds.includes(entry._id));
    },
    availableCurrencies() {
      const currencies = {
        options: [],
        key: _.uniqueId(new Date().getTime()),
      };
      if (!_.isEmpty(this.currencyOptions)) {
        currencies.options = this.currencies.filter((c) => this.currencyOptions.includes(c._id));
      }
      return currencies;
    },
    exchangeRate() {
      if (this.isNew) {
        return _.get(this, 'invoice.accounting.currency.exchangeRate', 1);
      }
      return _.get(this, 'invoice.accounting.exchangeRate', 1);
    },
    amount() {
      if (!this.isNew) {
        return this.invoice.accounting.amount;
      }
      return this.checkedEntries
        .reduce((ac, en) => ac.plus(ensureNumber(en.amount)), new Big(0))
        .toFixed(2);
    },
    localAmount() {
      if (!this.isNew) {
        return this.invoice.accounting.amountInLocal;
      }
      return this.checkedEntries
        .reduce((ac, en) => ac.plus(ensureNumber(en.localAmount)), new Big(0))
        .toFixed(2);
    },
    contactName() {
      return `${_.get(this, 'invoice.contact.firstName')} ${_.get(this, 'invoice.contact.lastName')}`;
    },
    poNumber() {
      return this.poExist ? this.invoice.purchaseOrder : 'PO numbers not available';
    },
    salesRep() {
      if (this.isNew) {
        const salesRep = _.get(this.invoice.contact, 'contactDetails.salesRep');
        if (!_.isNil(salesRep)) {
          return toUserName(salesRep);
        }
        return '';
      }
      return `${this.invoice.salesRep.firstName} ${this.invoice.salesRep.lastName}`;
    },
    canReadAll() {
      return this.hasRole('INVOICE-ACCT_READ_ALL');
    },
  },
  methods: {
    triggerEntriesUpload() {
      this.$refs.csvEntriesImportedFile.click();
    },
    uploadCsvWithEntries(event) {
      const files = _.get(event, 'target.files', []);
      if (_.isEmpty(files) || files.length === 0) {
        return;
      }
      const f = files.item(0);
      if (_.isNil(f)) {
        return;
      }
      const formData = new FormData();
      formData.append(event.target.name, f, f.name);
      this.loading = true;
      this.wasCsvImported = false;
      this.arInvoiceEntriesService.uploadCsv(formData, 'ar-invoice-entries')
        .then((response) => {
          const importedEntriesNumber = _.get(response, 'data.importedEntriesNumber');
          this.wasCsvImported = true;
          const notification = {
            title: 'Success',
            message: `${importedEntriesNumber} entries have been imported`,
            state: 'success',
          };
          this.pushNotification(notification);
        })
        .catch((err) => {
          this.uploading = false;
          const notification = {
            title: 'Error',
            message: _.get(err, 'status.message', 'Failed to upload csv'),
            state: 'danger',
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
          this.$refs.importEntriesForm.reset();
        });
    },
    onGridDataImported(entries = []) {
      this.wasCsvImported = true;
      this.checkedEntriesIds = entries.map(({ _id }) => _id);
    },
    toActivityGrid(event) {
      event.preventDefault();
      const filter = JSON.stringify({ invoiceNo: this.invoice.no });
      this.$emit('invoice-activity-grid', filter, this._getEntityId());
    },
    onRowSelected(id, checked) {
      if (checked) {
        if (!this.checkedEntriesIds.includes(id)) {
          this.checkedEntriesIds.push(id);
        }
      } else {
        this.checkedEntriesIds = this.checkedEntriesIds.filter((checkedId) => checkedId !== id);
      }
    },
    onSelectAll(selected) {
      if (selected) {
        this.checkedEntriesIds = this.entries.map((task) => task._id);
      } else {
        this.checkedEntriesIds = [];
      }
    },
    onGridDataLoaded(data) {
      this.wasCsvImported = false;
      if (data.list) {
        this.entries = data.list;
        this.checkedEntriesIds = [];
      }
    },
    onCompanySelected(company) {
      this.invoice.company = _.pick(company, ['_id', 'name', 'hierarchy', 'status']);
      this.invoice.accounting.currency = null;
      if (this.selectedCompanyId) this.getFromRequestCurrencyPoLists();
      this.setBillingTerm(_.get(company, 'billingTerm'));
    },
    getFromRequestCurrencyPoLists() {
      if (!this.isNew) {
        this.currencyOptions = [this.invoice.accounting.currency];
        if (!_.isEmpty(this.invoice.purchaseOrder)) {
          this.purchaseOrderOptions = [this.invoice.purchaseOrder];
        }
        return;
      }
      arInvoiceService.getFromRequestCurrencyPoLists(this.selectedCompanyId)
        .then((res) => _.assign(this, res.data))
        .catch((err) => this.pushNotification({
          title: 'Error',
          message: 'Could not get currency and po list',
          state: 'danger',
          response: err,
        }));
    },
    getLocalDate(entity) {
      let date;
      if (this.isNew) {
        date = _.get(this, `lsp.revenueRecognition.${entity}`, '');
      } else {
        date = _.get(this, `invoice.revenueRecognition.${entity}`, '');
      }
      return localDateTime(date, 'YYYY-MM-DD HH:mm');
    },
    onBillingTermSelected(billingTerm) {
      this.setBillingTerm(billingTerm.value);
    },
    onInvoiceTemplateSelected(template) {
      _.set(this.invoice, 'templates.invoice', toIdName(template));
    },
    onEmailTemplateSelected(template) {
      _.set(this.invoice, 'templates.email', toIdName(template));
    },
    onGridRowToggle(item) {
      const foundIndex = this.activeRows.findIndex((i) => i._id === item._id);
      if (foundIndex >= 0) {
        this.activeRows.splice(foundIndex, 1);
      } else {
        this.activeRows.push(item);
      }
    },
    setBillingTerm(billingTermId) {
      const billingTermFound = _.find(this.billingTermOptions, (billingTerm) => _.get(billingTerm, '_id') === billingTermId);
      this.invoice.billingTerm = _.pick(billingTermFound, ['_id', 'name']);
      this.setAddDaysBillingTerm();
    },
    setAddDaysBillingTerm() {
      const billingTermName = _.get(this.invoice, 'billingTerm.name', '');
      const billingTermString = billingTermName.split(' ').pop();
      const billingTermNumber = Number(billingTermString);
      if (!_.isNaN(billingTermNumber)) {
        this.addDaysBillingTerm = billingTermNumber;
      } else {
        this.addDaysBillingTerm = 0;
      }
      this.updateDueDate();
    },
    updateDueDate() {
      this.invoice.dueDate = moment(this.invoice.date).add(this.addDaysBillingTerm, 'days').format();
    },
    async getTemplates() {
      const queryTemplateTypes = `${INVOICE_TEMPLATE},${INVOICE_EMAIL_TEMPLATE}`;
      const responseTemplates = await templateService.retrieveByTypes(queryTemplateTypes);
      const templates = responseTemplates.data;
      return templates;
    },
    formatDefaultSelectOption: (entity) => toTextValueOption(entity),
    prepareForCreation() {
      const newInvoice = _.omit(this.invoice, ['sent', 'attachments', 'accounting', 'salesRep', '_id', 'no', 'status']);
      const { startDate, endDate } = _.get(this, 'lsp.revenueRecognition');
      const { contact, company, accounting } = this.invoice;
      Object.assign(newInvoice, {
        contact: contact._id,
        company: company._id,
        revenueRecognition: { startDate, endDate },
        accounting: {
          amount: Number(this.amount),
          currency: accounting.currency._id,
        },
        salesRep: _.get(contact, 'contactDetails.salesRep._id', ''),
      });
      if (!this.wasCsvImported) {
        newInvoice.entries = this.transformEntries(this.checkedEntries);
      }
      return newInvoice;
    },
    prepareForEdition() {
      const invoiceData = _.pick(this.invoice, ['_id', 'templates', 'description']);
      if (!this.isSynced) {
        const editableFields = _.pick(this.invoice, ['billingTerm', 'date', 'dueDate', 'glPostingDate', 'postOutOfPeriod']);
        Object.assign(invoiceData, editableFields);
      }
      invoiceData.entries = this.entries.map((entry) => ({ _id: entry._id, show: entry.show }));
      return invoiceData;
    },
    transformEntries(entries) {
      return entries.map((entry) => {
        entry = _.pick(entry, [
          '_id',
          'purchaseOrder',
          'internalDepartment',
          'memo',
          'requestId',
          'requestDeliveryDate',
          'isInvoiced',
          'internalDepartmentName',
          'requestNo',
          'requestDescription',
          'taskId',
          'taskName',
          'companyName',
          'taskTotal',
          'reverseEx',
          'minCharge',
          'price',
          'amount',
          'localPrice',
          'numberTitleLangCombDescription',
          'quantity',
          'localAmount',
          'show',
          'ability',
          'workflowId',
          'workflowDescription',
          'breakdown',
          'languageCombination',
          'externalAccountingCode',
        ]);
        const newEntry = _.pickBy(entry, (x) => !_.isNil(x));
        newEntry.price = Number(entry.price);
        newEntry.quantity = Number(entry.quantity);
        newEntry.amount = Number(entry.amount);
        return newEntry;
      });
    },
    save() {
      if (this.isValid) {
        const invoice = this.isNew ? this.prepareForCreation() : this.prepareForEdition();
        let successCreateMessage;
        if (this.wasCsvImported) {
          successCreateMessage = 'A drafted invoice was created. You can track the post completion progress from the invoices grid';
        } else {
          successCreateMessage = 'Invoice was successfully created';
        }
        this._save(invoice, { successCreateMessage });
      }
    },
    _service() {
      return arInvoiceService;
    },
    _getEntityId() {
      return _.get(this, 'invoice._id', '');
    },
    _afterEntityRetrieve(invoice) {
      _.assign(this.invoice, invoice);
      this.originalDescription = _.get(invoice, 'description', '');
      this.getFromRequestCurrencyPoLists();
    },
    _handleRetrieve(response) {
      const responseEntity = _.get(response, 'data.ar-invoice');
      this._afterEntityRetrieve(responseEntity);
    },
    _refreshEntity(freshEntity) {
      this._afterEntityRetrieve(freshEntity);
      this.$refs.arInvoiceEntriesGrid.fetchData(this.mainQuery);
    },
    _handleEditResponse(response) {
      const responseEntity = _.get(response, 'data.ar-invoice');
      this._afterEntityRetrieve(responseEntity);
    },
    async _handleCreate(response) {
      const invoiceId = _.get(response, 'data.ar-invoice._id', '');
      this.invoice._id = invoiceId;
      if (!_.isEmpty(invoiceId)) {
        this.$nextTick(async () => {
          await this.$router.replace({ name: 'invoice-edition', params: { entityId: invoiceId } });
        });
      }
    },
    cancel() {
      this.close();
    },
    preview() {
      this.$emit('invoice-preview', this._getEntityId());
    },
  },
};
