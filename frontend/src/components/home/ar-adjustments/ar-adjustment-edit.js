import _ from 'lodash';
import moment from 'moment';
import Big from 'big.js';
import { mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import ArAdjustmentService from '../../../services/ar-adjustment-service';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import SiConnectorDetails from '../connector/si-connector-details.vue';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import ContactSelect from '../user/contact/contact-select.vue';
import CurrencySelector from '../../currency-select/currency-selector.vue';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { toOption } from '../../../utils/select2';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import InvoiceSelect from '../ar-invoice/invoice-select/invoice-select.vue';
import AttachmentsModal from '../attachments-modal/attachments-modal.vue';
import InternalDepartmentsService from '../../../services/internal-department-service';
import RevenueAccountService from '../../../services/revenue-account-service';
import CcPaymentModal from '../ar-invoice/cc-payment-modal/cc-payment-modal.vue';

const DEBIT_MEMO_TYPE = 'Debit Memo';
const CREDIT_MEMO_TYPE = 'Credit Memo';
const newEntry = (e) => ({
  isLocked: !_.isEmpty(e),
  vueKey: _.uniqueId(new Date().getTime()),
  memo: _.get(e, 'memo'),
  departmentId: _.get(e, 'departmentId', ''),
  glAccountNo: _.get(e, 'glAccountNo', ''),
  amount: _.get(e, 'amount', 0),
});
const buildInitialState = () => ({
  adjustment: {
    _id: '',
    type: '',
    status: '',
    company: '',
    contact: null,
    attachments: [],
    date: moment().utc().format(),
    glPostingDate: moment().utc().format(),
    description: '',
    invoiceNo: null,
    accounting: {
      amount: 0,
      localAmount: 0,
      currency: null,
    },
    siConnector: {},
    ownEntries: [],
    invoiceEntries: [],
  },
  invoiceOptions: [{ text: 'test', value: 'test' }],
  invoiceFormatOption: ({ no }) => ({ text: no, value: no }),
  contactFormatOption: ({ _id, firstName, lastName }) => ({ text: `${firstName} ${lastName}`, value: { _id, firstName, lastName } }),
  description: '',
  entityName: 'adjustment',
  adjustmentTypes: [DEBIT_MEMO_TYPE, CREDIT_MEMO_TYPE],
  datepickerOptions: {
    onValueUpdate: null,
    enableTime: true,
    allowInput: false,
    disableMobile: 'true',
    clickOpens: true,
  },
  currencyFormatter: ({ _id, isoCode, exchangeRate }) => ({
    text: isoCode,
    value: { _id, isoCode, exchangeRate },
  }),
  service: new ArAdjustmentService(),
  revenueAccounts: [],
  internalDepartments: [],
  validationError: '',
});

export default {
  name: 'AdjustmentEdit',
  mixins: [userRoleCheckMixin, entityEditMixin],
  components: {
    CompanyAjaxBasicSelect,
    SimpleBasicSelect,
    ContactSelect,
    CurrencySelector,
    SiConnectorDetails,
    ConfirmDialog,
    UtcFlatpickr,
    InvoiceSelect,
    AttachmentsModal,
    CcPaymentModal,
  },
  data() {
    return buildInitialState();
  },
  watch: {
    isEntityRetrieved: {
      immediate: true,
      handler(newValue) {
        if (newValue && this.canEdit) {
          this._retrieveGlAccountsNo();
          this._retrieveAccountingDepartmentsIds();
        }
      },
    },
  },
  computed: {
    ...mapGetters('app', ['currencies']),
    isNew() {
      return _.isEmpty(this.adjustment._id);
    },
    isValid() {
      try {
        this._validateInfo(this.adjustment);
        this._validateDetails(this.adjustment);
        this._validateEntries(this.adjustment);
        this.validationError = '';
        return true;
      } catch (e) {
        this.validationError = e;
        return false;
      }
    },
    isCreditMemo() {
      return this.adjustment.type === CREDIT_MEMO_TYPE;
    },
    selectedCompany() {
      return toOption(this.adjustment.company, 'hierarchy');
    },
    selectedCompanyId() {
      return _.get(this, 'adjustment.company._id', '');
    },
    selectedCurrencyId() {
      return _.get(this, 'adjustment.accounting.currency._id', '');
    },
    contactName() {
      const firstName = _.get(this.adjustment, 'contact.firstName');
      const lastName = _.get(this.adjustment, 'contact.lastName');
      return `${firstName} ${lastName}`;
    },
    amount() {
      if (this.canEdit) {
        this.adjustment.accounting.amount = this.entries.reduce((ac, en) => (en.isLocked ? ac.plus(en.amount) : ac), new Big(0)).toNumber();
      }
      return this.adjustment.accounting.amount;
    },
    exchangeRate() {
      return _.get(this, 'adjustment.accounting.currency.exchangeRate', 0);
    },
    localAmount() {
      if (!this.canEdit) {
        return _.get(this, 'adjustment.accounting.amountInLocal');
      }
      if (this.exchangeRate === 0 || this.amount === 0) {
        return 0;
      }
      return new Big(this.amount).div(this.exchangeRate).toNumber();
    },
    amountPaid() {
      return _.get(this, 'adjustment.accounting.paid', 0);
    },
    balance() {
      return new Big(this.amount).minus(this.amountPaid).toNumber();
    },
    entries() {
      return [...this.adjustment.invoiceEntries, ...this.adjustment.ownEntries];
    },
    isDebitMemo() {
      return this.adjustment.type === 'Debit Memo';
    },
    canReadAll() {
      return this.hasRole('AR-ADJUSTMENT-ACCT_READ_ALL');
    },
    hasConnectorError() {
      return !_.isEmpty(_.get(this.adjustment, 'siConnector.error'));
    },
    canEdit() {
      return this.isNew || this.hasConnectorError;
    },
  },
  methods: {
    handleCompanySelection(company) {
      this.adjustment.company = _.pick(company, ['_id', 'name', 'hierarchy']);
      this.adjustment.contact = null;
    },
    showConfirmDialog() {
      this.$refs.confirmDialog.show();
    },
    onEntriesInput(entries) {
      if (this.adjustment.type !== CREDIT_MEMO_TYPE) {
        return;
      }
      this.adjustment.invoiceEntries = entries.map((e) => newEntry(e));
    },
    onConfirmSaving({ confirm }) {
      if (confirm) {
        const fileldsToPick = ['type', 'attachments', 'description', 'date', 'glPostingDate', 'invoiceNo', 'accounting'];
        const entriesFieldsToPick = ['amount', 'departmentId', 'glAccountNo', 'memo'];
        const formatEntry = (e) => _.pick(e, entriesFieldsToPick);
        if (!this.isNew) {
          fileldsToPick.push('_id');
        }
        const adjustment = _.pick(this.adjustment, fileldsToPick);
        Object.assign(adjustment, {
          companyId: this.selectedCompanyId,
          currencyId: this.selectedCurrencyId,
          contactId: this.adjustment.contact._id,
          invoiceEntries: this.adjustment.invoiceEntries.filter((e) => e.isLocked).map(formatEntry),
          ownEntries: this.adjustment.ownEntries.filter((e) => e.isLocked).map(formatEntry),
        });
        this._save(adjustment, { successCreateMessage: 'AR Adjustment successfully created' });
      }
    },
    _validateInfo(adjustment) {
      if (!this.adjustmentTypes.some((t) => t === adjustment.type)) {
        throw new Error(`Adjustment type is not selected or invalid. Value: ${adjustment.type}`);
      }
      if (_.isEmpty(adjustment.company)) {
        throw new Error('Adjustment company is not selected');
      }
      if (_.isEmpty(adjustment.contact)) {
        throw new Error('Adjustment contact is not selected');
      }
      if (_.isEmpty(_.get(this, 'adjustment.accounting.currency'))) {
        throw new Error('Adjustment currency is not selected');
      }
    },
    _validateDetails(adjustment) {
      if (_.isEmpty(adjustment.date)) {
        throw new Error('Adjustment Date is not selected');
      }
      if (_.isEmpty(adjustment.glPostingDate)) {
        throw new Error('Adjustment Gl Posting Date is not selected');
      }
      if (adjustment.accounting.exchangeRate <= 0) {
        throw new Error('Invalid exchange rate');
      }
      if (adjustment.accounting.amount <= 0) {
        throw new Error('Adjustment amount should be a postitive number');
      }
    },
    _validateEntries() {
      if (this.entries.length === 0) {
        throw new Error('Adjustment should have at least one entry');
      }
    },
    _service() {
      return this.service;
    },
    _handleCreate(res) {
      const entityId = _.get(res, 'data.ar-adjustment._id');
      this.adjustment._id = entityId;
      this.$router.replace({ name: 'adjustment-detail', params: { entityId } });
    },
    _handleRetrieve(res) {
      const adjustment = _.get(res, 'data.ar-adjustment');
      adjustment.ownEntries = adjustment.ownEntries.map((e) => newEntry(e));
      adjustment.invoiceEntries = adjustment.invoiceEntries.map((e) => newEntry(e));
      adjustment.accounting.currency.exchangeRate = adjustment.accounting.exchangeRate;
      _.assign(this.adjustment, adjustment);
    },
    _handleEditResponse(res) {
      this._handleRetrieve(res);
    },
    addEntry(i, event) {
      event.stopPropagation();
      this.adjustment.ownEntries.splice(++i, 0, newEntry());
    },
    lockEntry(entry, event) {
      event.stopPropagation();
      if (entry.glAccountNo && entry.departmentId && entry.amount) {
        entry.isLocked = true;
      }
    },
    unlockEntry(entry) {
      if (entry.isLocked && this.hasConnectorError) {
        entry.isLocked = false;
      }
    },
    deleteEntry(i) {
      if (i < this.adjustment.invoiceEntries.length) {
        this.adjustment.invoiceEntries.splice(i, 1);
        return;
      }
      this.adjustment.ownEntries.splice(i -= this.adjustment.invoiceEntries.length, 1);
    },
    _retrieveGlAccountsNo() {
      new RevenueAccountService().retrieve()
        .then((res) => {
          this.revenueAccounts = _.get(res, 'data.list', [])
            .map((ra) => _.toNumber(ra.no));
        })
        .catch((e) => this.pushNotification({
          title: 'Error',
          message: 'GL Accounts could not be retrieved',
          state: 'danger',
          response: e,
        }));
    },
    _retrieveAccountingDepartmentsIds() {
      new InternalDepartmentsService().retrieve()
        .then((res) => {
          this.internalDepartments = _.get(res, 'data.list', [])
            .filter((d) => !_.isEmpty(d.accountingDepartmentId))
            .map(({ accountingDepartmentId }) => ({ departmentId: accountingDepartmentId }));
        })
        .catch((e) => this.pushNotification({
          title: 'Error',
          message: 'Department IDs could not be retrieved',
          state: 'danger',
          response: e,
        }));
    },
  },
};
