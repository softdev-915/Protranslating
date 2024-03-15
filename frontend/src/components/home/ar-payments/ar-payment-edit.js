import _ from 'lodash';
import moment from 'moment';
import Big from 'big.js';
import { mapGetters, mapActions } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import definitions from './ar-payment-definitions';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import PaymentMethodSelect from '../company/billing-information/payment-method-selector.vue';
import AccountSelect from '../../account-select/account-selector.vue';
import CompanySelect from '../company/company-ajax-basic-select.vue';
import CurrencySelect from '../../currency-select/currency-selector.vue';
import BankAccountService from '../../../services/bank-account-service';
import SiConnectorDetails from '../connector/si-connector-details.vue';
import AttachmentsModal from '../attachments-modal/attachments-modal.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import VoidModal from '../../void-modal/void-modal.vue';
import ArPaymentService from '../../../services/ar-payment-service';
import CompanyService from '../../../services/company-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import notificationMixin from '../../../mixins/notification-mixin';
import { toOption } from '../../../utils/select2/index';
import { bigJsToNumber, ensureNumber, div } from '../../../utils/bigjs';
import LspService from '../../../services/lsp-service';
import { errorNotification } from '../../../utils/notifications';

const countTotal = (arr, field) => arr.reduce(
  (ac, en) => ac.plus(ensureNumber(en[field])), new Big(0),
).toNumber();
const companyService = new CompanyService();
const buildInitialState = () => ({
  payment: {
    _id: '',
    sourceType: definitions.PAYMENT,
    targetType: definitions.INVOICE,
    method: '',
    bankAccount: '',
    company: {
      _id: '',
      hierarchy: '',
    },
    accounting: {
      amount: 0,
      currency: null,
    },
    docNo: '',
    description: '',
    attachments: [],
    siConnector: {},
    date: moment().utc().format(),
    receiptDate: moment().utc().format(),
    source: '',
  },
  lineItemsAreLoading: false,
  sourceOptions: definitions.SOURCE_OPTIONS,
  targetOptions: definitions.TARGET_OPTIONS,
  formatters: definitions.formatters,
  accountType: definitions.BANK_ACCOUNT,
  bankAccountOptions: [],
  sourceEntities: [],
  targetEntities: [],
  validationError: null,
  selectedCompanyBalance: null,
  paymentGateway: null,
});

export default {
  name: 'ArPaymentEdit',
  mixins: [userRoleCheckMixin, entityEditMixin, notificationMixin],
  components: {
    SimpleBasicSelect,
    PaymentMethodSelect,
    AccountSelect,
    CompanySelect,
    CurrencySelect,
    SiConnectorDetails,
    AttachmentsModal,
    UtcFlatpickr,
    VoidModal,
  },
  data: () => buildInitialState(),
  watch: {
    isDirectPayment(value) {
      if (!value) {
        this.payment.method = '';
        this.payment.bankAccount = '';
        this.accountType = definitions.BANK_ACCOUNT;
      }
    },
    accountType: {
      immediate: true,
      handler(newValue) {
        if (newValue === definitions.UNDEPOSITED) {
          this.payment.bankAccount = '';
        }
      },
    },
  },
  created() {
    this.entityName = 'Ar Payment';
    this.fetchPaymentGateway();
    if (this.isNew) {
      this._retrieveBankAccounts();
      this.$watch('payment.company', this._lineItemsWatcher);
      this.$watch('payment.accounting.currency', this._lineItemsWatcher);
      this.$watch('payment.targetType', this._lineItemsWatcher);
      this.$watch('payment.sourceType', this._lineItemsWatcher);
    }
  },
  computed: {
    ...mapGetters('app', ['currencies', 'lsp']),
    canVoid() {
      return !this.isNew && !this.isVoided;
    },
    isNew() {
      return _.isEmpty(this.payment._id);
    },
    canReadAll() {
      return this.hasRole('AR-PAYMENT-ACCT_READ_ALL');
    },
    isVoided() {
      return _.get(this.payment, 'voidDetails.isVoided') === true;
    },
    isEditable() {
      return (this.isNew || !_.isEmpty(_.get(this.payment, 'siConnector.error'))) && !this.isVoided;
    },
    isDirectPayment() {
      return this.payment.sourceType === definitions.PAYMENT;
    },
    isPaidFromAdvance() {
      return this.payment.sourceType === definitions.ADVANCE;
    },
    isPaidForInvoice() {
      return this.payment.targetType === definitions.INVOICE;
    },
    isPaidForDebit() {
      return this.payment.targetType === definitions.DEBIT_MEMO;
    },
    selectedCompany() {
      return toOption(this.payment.company, 'hierarchy');
    },
    isBankAccountSelected() {
      return this.accountType === definitions.BANK_ACCOUNT;
    },
    undepositedAccountIdentifier() {
      const paymentUndepositedAccountIdentifier = _.get(this, 'payment.undepositedAccountIdentifier');
      return !_.isNil(paymentUndepositedAccountIdentifier)
        ? paymentUndepositedAccountIdentifier
        : _.get(this, 'paymentGateway.account');
    },
    localAmount() {
      const amount = ensureNumber(_.get(this, 'payment.accounting.amount'));
      const exchangeRate = ensureNumber(this.exRate);
      return bigJsToNumber(div(amount, exchangeRate));
    },
    appliedCurrencyISO() {
      return _.get(this, 'payment.accounting.currency.isoCode');
    },
    exRate() {
      if (this.isNew) {
        return _.get(this, 'payment.accounting.currency.exchangeRate', 0);
      }
      return this.payment.accounting.exchangeRate;
    },
    companyId() {
      return _.get(this, 'payment.company._id');
    },
    currencyId() {
      return _.get(this, 'payment.accounting.currency._id');
    },
    canRetrieveLineItems() {
      return !_.isEmpty(this.companyId)
        && !_.isEmpty(this.currencyId)
        && !_.isEmpty(this.payment.targetType)
        && !_.isEmpty(this.payment.sourceType);
    },
    availableSourceAmount() {
      const selectedSource = this.sourceEntities.find((e) => e._id === this.payment.source);
      return _.get(selectedSource, 'balance', 0);
    },
    notValidAmount() {
      if (!this.isNew) {
        return false;
      }
      return this.payment.accounting.amount < 0
        || this.payment.accounting.amount > this.availableSourceAmount;
    },
    debitSubtotals() {
      return countTotal(this.targetEntities, 'balance');
    },
    allocatedAmount() {
      return countTotal(this.targetEntities, 'applied');
    },
    allocationRemainingAmount() {
      return new Big(this.payment.accounting.amount).minus(this.allocatedAmount).toNumber();
    },
    isPaymentValid() {
      try {
        this._validatePayment(this.payment);
        this.validationError = null;
        return true;
      } catch (e) {
        this.validationError = e;
        return false;
      }
    },
    bankAccountName() {
      return _.get(this, 'payment.bankAccount.name') || _.get(this, 'payment.undepositedAccountIdentifier');
    },
    paymentMethodName() {
      return _.get(this, 'payment.method.name');
    },
    balanceInSelectedCurrency() {
      const selectedCurrencyIso = _.get(this.payment, 'accounting.currency.isoCode');
      if (_.isNil(this.selectedCompanyBalance)) {
        return;
      }
      if (_.isNil(selectedCurrencyIso)) {
        return;
      }
      const selectedCurrencyRow = this.selectedCompanyBalance
        .find((r) => r.currency === selectedCurrencyIso);
      return _.get(selectedCurrencyRow, 'consolidatedBalance', 0);
    },
    voidDetails() {
      return {
        Date: moment(this.payment.receiptDate).format('YYYY-MM-DD'),
        'Document No': this.payment._id,
        Customer: this.payment.company.hierarchy,
        Amount: `${this.payment.accounting.currency.isoCode} ${this.payment.accounting.amount}`,
      };
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCompanySelect(selected) {
      if (_.isEmpty(selected)) {
        this.payment.company = { _id: '', hierarchy: '' };
        this.selectedCompanyBalance = null;
        return;
      }
      this.payment.company = _.pick(selected, ['_id', 'name', 'hierarchy']);
      companyService.getBalance(selected._id)
        .then((res) => (this.selectedCompanyBalance = res.data))
        .catch((e) => {
          this.selectedCompanyBalance = null;
          this.pushNotification({
            title: 'Error',
            message: 'Failed to retrieve company balance',
            state: 'danger',
            response: e,
          });
        });
    },
    save() {
      const paymentDto = this.isNew ? this.prepareForSave() : this.prepareForUpdate();
      this._save(paymentDto);
    },
    isLineItemValid(lineItem) {
      if (!lineItem.applied) {
        return true;
      }
      return lineItem.applied >= 0 && lineItem.applied <= lineItem.balance;
    },
    _handleEditResponse(response) {
      const payment = _.get(response, 'data.ar-payment', {});
      _.assign(this.payment, payment);
    },
    _handleRetrieve(response) {
      const payment = _.get(response, 'data.ar-payment', {});
      const isSyncErrorInPayment = !_.isEmpty(payment.siConnector.error);
      if (isSyncErrorInPayment) {
        payment.bankAccount = _.get(payment, 'bankAccount._id');
        payment.method = _.get(payment, 'method._id');
      }
      if (_.get(payment, 'undepositedAccountIdentifier')) {
        this.accountType = definitions.UNDEPOSITED;
      }
      this.payment = payment;
    },
    _handleCreate(response) {
      this.payment = _.get(response, 'data.ar-payment', {});
      this.$router.replace({ name: 'payment-detail', params: { entityId: this.payment._id } });
    },
    _service() {
      return new ArPaymentService();
    },
    _retrieveBankAccounts() {
      new BankAccountService()
        .retrieve()
        .then((res) => {
          this.bankAccountOptions = _.get(res, 'data.list', [])
            .filter((ba) => !ba.deleted);
        });
    },
    _lineItemsWatcher() {
      if (this.lineItemsAreLoading) {
        return;
      }
      this.sourceEntities = [];
      this.targetEntities = [];
      if (_.isEmpty(this.companyId) || _.isEmpty(this.currencyId)) {
        return;
      }
      this.lineItemsAreLoading = true;
      const params = {
        companyId: this.companyId,
        currencyId: this.currencyId,
        target: this.payment.targetType,
        source: this.payment.sourceType === definitions.PAYMENT ? null : this.payment.sourceType,
      };
      this._service().retrieveLineItems(params)
        .then((res) => {
          const { source, target } = _.get(res, 'data.lineItems', []);
          source.applied = 0;
          target.forEach((t) => (t.applied = 0));
          this.sourceEntities = source;
          this.targetEntities = target;
        })
        .catch((e) => this.pushNotification({
          title: 'Error',
          message: 'Failed retrive line items',
          state: 'danger',
          response: e,
        }))
        .finally(() => (this.lineItemsAreLoading = false));
    },
    _validatePayment(payment) {
      if (_.isEmpty(this.payment.sourceType) || _.isEmpty(this.payment.targetType)) {
        throw new Error('Payment combo is not selected');
      }
      if (this.isDirectPayment && _.isEmpty(payment.method)) {
        throw new Error('Payment method is not selected');
      }
      if (_.isEmpty(payment.company)) {
        throw new Error('Payment company is not selected');
      }
      if (_.isEmpty(payment.accounting.currency)) {
        throw new Error('Payment currency is not selected');
      }
      if (this.isDirectPayment && _.isEmpty(payment.bankAccount)
        && this.accountType === definitions.BANK_ACCOUNT) {
        throw new Error('Payment bank account is not selected');
      }
      if (_.isEmpty(payment.receiptDate)) {
        throw new Error('Payment receipt date is not set');
      }
      if (this.isDirectPayment && _.isEmpty(payment.date)) {
        throw new Error('Payment date is not set');
      }
      if (this.isNew && this.payment.accounting.amount <= 0) {
        throw new Error('Total payment amount should be greater than 0');
      }
      if (this.isNew && this.allocationRemainingAmount !== 0) {
        throw new Error('Allocation remaining amount can\'t differ from zero');
      }
      if (!this.isNew) {
        return true;
      }
      if (!this.isDirectPayment && !this.availableSourceAmount) {
        throw new Error('Invalid source amount');
      }
      this.targetEntities.forEach((te) => {
        if (!this.isLineItemValid(te)) throw new Error('Invalid target items');
      });
    },
    prepareForSave() {
      const { company, bankAccount, accounting } = this.payment;
      const paymentFields = ['company', 'receiptDate', 'description', 'sourceType', 'targetType'];
      if (this.isDirectPayment) {
        paymentFields.push('method', 'date', 'docNo');
        if (!_.isEmpty(bankAccount)) {
          paymentFields.push('bankAccount');
        }
      } else {
        paymentFields.push('source');
      }
      const newPayment = _.pick(this.payment, paymentFields);
      const { currency, amount } = accounting;
      const appliedTargetEntities = this.targetEntities
        .filter((e) => e.applied > 0)
        .map(({ _id, applied }) => ({ _id, applied }));
      Object.assign(newPayment, {
        company: company._id,
        amount: amount,
        currency: currency._id,
        target: appliedTargetEntities,
      });
      return newPayment;
    },
    prepareForUpdate() {
      const paymentFields = ['_id', 'receiptDate', 'description'];
      const conditionalFields = this.isDirectPayment ? ['method', 'date', 'docNo'] : [];
      if (this.isDirectPayment && !_.isEmpty(this.payment.bankAccount)) {
        conditionalFields.push('bankAccount');
      }
      return _.pick(this.payment, paymentFields.concat(conditionalFields));
    },
    async voidPayment(data) {
      if (this.httpRequesting) return;
      try {
        this.httpRequesting = true;
        const response = await this._service().void(this.payment._id, data);
        this._handleEditResponse(response);
        this.pushSuccess('Payment was voided successfully!');
      } catch (e) {
        this.pushError(e.message, e);
      } finally {
        this.httpRequesting = false;
      }
    },
    async fetchPaymentGateway() {
      try {
        const lspService = new LspService();
        const response = await lspService.get(this.lsp._id);
        this.paymentGateway = _.get(response, 'body.data.lsp.paymentGateway');
      } catch (e) {
        const message = _.get(e, 'message', e.status.message);
        this.pushNotification(errorNotification(`Error fetching LSP: ${message}`));
      }
    },
  },

};
