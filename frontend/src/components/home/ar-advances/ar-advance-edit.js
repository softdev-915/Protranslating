import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { entityEditMixin } from '../../../mixins/entity-edit';
import notificationMixin from '../../../mixins/notification-mixin';
import PaymentMethodSelect from '../company/billing-information/payment-method-selector.vue';
import CompanySelect from '../company/company-ajax-basic-select.vue';
import CurrencySelect from '../../currency-select/currency-selector.vue';
import AccountSelect from '../../account-select/account-selector.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import VoidModal from '../../void-modal/void-modal.vue';
import ArAdvanceService from '../../../services/ar-advance-service';
import { toOption } from '../../../utils/select2/index';
import {
  bigJsToNumber, ensureNumber, div, minus,
} from '../../../utils/bigjs';
import AttachmentsModal from '../attachments-modal/attachments-modal.vue';
import SiConnectorDetails from '../connector/si-connector-details.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import BankAccountSelect from '../../bank-select/bank-account-ajax-select.vue';
import LspService from '../../../services/lsp-service';
import { errorNotification } from '../../../utils/notifications';

const ACCOUNT_TYPES = {
  BANK: 'Bank Account',
  UNDEPOSITED: 'Undeposited Funds Account Identifier',
};
const PAYMENT_METHODS = {
  CREDIT_CARD: 'Credit Card',
  EFT: 'EFT',
};
const paymentMethodFormatter = ({ name, _id }) => ({ text: name, value: { name, _id } });
const bankAccountFormatter = ({ name, _id }) => ({ text: name, value: _id });
const currencyFormatter = ({ _id, isoCode, exchangeRate }) => ({
  text: isoCode,
  value: { _id, isoCode, exchangeRate },
});
export default {
  name: 'ArAdvancesEdit',
  mixins: [userRoleCheckMixin, entityEditMixin, notificationMixin],
  components: {
    PaymentMethodSelect,
    CompanySelect,
    CurrencySelect,
    AccountSelect,
    UtcFlatpickr,
    AttachmentsModal,
    SiConnectorDetails,
    SimpleBasicSelect,
    BankAccountSelect,
    VoidModal,
  },
  props: {
    canCreate: Boolean,
  },
  data() {
    return {
      entityName: 'Ar Advance',
      bankAccountOptions: [],
      areFilesLoading: false,
      isDownloadingDocument: {},
      currencyFormatter,
      paymentMethodFormatter,
      bankAccountFormatter,
      accountType: ACCOUNT_TYPES.BANK,
      service: new ArAdvanceService(),
      selectedBank: { value: '', text: '' },
      paymentGateway: null,
      advance: {
        _id: '',
        company: {},
        siConnector: {},
        docNo: '',
        paymentMethod: null,
        bankAccount: null,
        date: moment().utc().format(),
        receiptDate: moment().utc().format(),
        description: '',
        attachments: [],
        accounting: {
          amount: 0,
          currency: null,
          paid: null,
        },
        shouldGoOnUndepositedAccount: false,
        voidDetails: { isVoided: false },
      },
    };
  },
  created() {
    this.fetchPaymentGateway();
  },
  computed: {
    ...mapGetters('app', ['currencies', 'lsp', 'localCurrency']),
    undepositedAccountIdentifier() {
      return _.get(this, 'paymentGateway.account');
    },
    isNew() {
      return _.isEmpty(this.advance._id);
    },
    bankAccount() {
      if (this.isNew) {
        return this.advance.shouldGoOnUndepositedAccount
          ? this.undepositedAccountIdentifier : _.get(this, 'payment.bankAccount.name');
      }
      return _.get(this.selectedBank, 'text', this.undepositedAccountIdentifier);
    },
    entityNameKebab() {
      return _.kebabCase(this.entityName);
    },
    selectedCompany() {
      return toOption(this.advance.company, 'hierarchy');
    },
    exchangeRate() {
      if (this.isNew) {
        return _.get(this, 'advance.accounting.currency.exchangeRate', 0);
      }
      return _.get(this, 'advance.accounting.exchangeRate');
    },
    amountApplied() {
      return _.get(this, 'advance.accounting.paid');
    },
    localAmount() {
      const amountNumber = ensureNumber(this.advance.accounting.amount);
      const exchangeRateNumber = ensureNumber(this.exchangeRate);
      if (exchangeRateNumber === 0) {
        return 0;
      }
      return bigJsToNumber(div(amountNumber, exchangeRateNumber));
    },
    amountAvailable() {
      const amountNumber = ensureNumber(this.advance.accounting.amount);
      const amountAppliedNumber = ensureNumber(this.amountApplied);
      return bigJsToNumber(minus(amountNumber, amountAppliedNumber));
    },
    isValid() {
      const fields = ['paymentMethod', 'company', 'date', 'receiptDate'];
      return fields.every((field) => !_.isEmpty(this.advance[field]))
        && !_.isEmpty(this.advance.accounting.currency)
        && this.isValidPaymentMethod
        && (!_.isEmpty(this.selectedBank) || this.advance.shouldGoOnUndepositedAccount);
    },
    isValidPaymentMethod() {
      return _.get(this.advance, 'paymentMethod.name') !== PAYMENT_METHODS.CREDIT_CARD
        || this.isDefaultCurrency(this.advance.accounting.currency);
    },
    isEnabledAccountType() {
      return _.get(this.advance, 'paymentMethod.name') !== PAYMENT_METHODS.EFT;
    },
    canReadAll() {
      return this.hasRole('AR-PAYMENT-ACCT_READ_ALL');
    },
    canEdit() {
      return (this.isNew || !_.isEmpty(_.get(this.advance, 'siConnector.error'))) && !this.isVoided;
    },
    isVoided() {
      return _.get(this.advance, 'voidDetails.isVoided') === true;
    },
    voidDetails() {
      return {
        Date: moment(this.advance.receiptDate).format('MM/DD/YYYY'),
        'Document No': this.advance._id,
        Customer: this.advance.company.hierarchy,
        Amount: this.advance.accounting.amount.toFixed(2),
      };
    },

  },
  watch: {
    accountType: {
      handler(newValue) {
        this.advance.bankAccount = {};
        this.advance.shouldGoOnUndepositedAccount = newValue === ACCOUNT_TYPES.UNDEPOSITED;
        if (this.advance.shouldGoOnUndepositedAccount) {
          this.advance.accounting.currency = this.currencies.find((c) => this.isDefaultCurrency(c));
        }
      },
    },
    'advance.company': {
      handler(newAdvanceCompany) {
        if (_.isNil(newAdvanceCompany)) {
          return;
        }
        const companyCurrency = _.get(newAdvanceCompany, 'quoteCurrency');
        if (!_.isEmpty(companyCurrency) && _.isEmpty(this.advance.accounting.currency)) {
          this.advance.accounting.currency = this.currencies.find(
            (c) => c._id === companyCurrency._id,
          );
        }
      },
    },
    'advance.paymentMethod': {
      handler(newAdvancePaymentMethod) {
        if (_.isNil(newAdvancePaymentMethod)) {
          return;
        }
        if (newAdvancePaymentMethod.name === PAYMENT_METHODS.CREDIT_CARD) {
          this.accountType = ACCOUNT_TYPES.UNDEPOSITED;
        } else if (newAdvancePaymentMethod.name === PAYMENT_METHODS.EFT) {
          this.accountType = ACCOUNT_TYPES.BANK;
        }
      },
    },
    'advance.bankAccount'(newBank) {
      if (_.isNil(newBank)) {
        Object.assign(this.selectedBank, { name: '', _id: '' });
        return;
      }
      if (this.selectedBank.value !== newBank._id) {
        this.selectedBank = {
          text: _.get(newBank, 'name', ''),
          value: _.get(newBank, '_id'),
        };
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return this.service;
    },
    _handleEditResponse(response) {
      const advance = _.get(response, 'data.ar-advance', {});
      if (_.isArray(this.currencies)) {
        const advanceCurrency = this.currencies.find((c) => c._id === _.get(advance, 'accounting.currency._id'));
        const exchangeRate = _.get(advanceCurrency, 'exchangeRate', 0);
        _.set(advance, 'accounting.currency.exchangeRate', exchangeRate);
      }
      _.assign(this.advance, advance);
    },
    _handleRetrieve(response) {
      const advance = _.get(response, 'data.ar-advance', {});
      if (_.isArray(this.currencies)) {
        const advanceCurrency = this.currencies.find((c) => c._id === _.get(advance, 'accounting.currency._id'));
        const exchangeRate = _.get(advanceCurrency, 'exchangeRate', 0);
        _.set(advance, 'accounting.currency.exchangeRate', exchangeRate);
      }
      _.assign(this.advance, advance);
    },
    _handleCreate(response) {
      this._handleRetrieve(response);
      const id = _.get(response, 'data.ar-advance._id', {});
      this.advance._id = id;
      this.$router.replace({ name: 'advance-edition', params: { entityId: id } });
    },
    _prepareForSave() {
      const advance = _.pick(this.advance,
        ['bankAccount', 'docNo', 'date', 'receiptDate', 'description', '_id']);
      advance.company = this.advance.company._id;
      advance.paymentMethod = this.advance.paymentMethod._id;
      advance.bankAccount = this.selectedBank.value;
      advance.accounting = ({
        amount: _.get(this.advance, 'accounting.amount'),
        currencyId: _.get(this.advance, 'accounting.currency._id'),
      });
      return _.pickBy(advance, _.identity);
    },
    onOptionSelect(selectedOption) {
      this.selectedBank = selectedOption;
    },
    save() {
      if (this.httpRequesting) return;
      const advance = this._prepareForSave();
      return this._save(advance, {
        successCreateMessage: 'AR Advance successfully created',
        successEditMessage: 'AR Advance successfully updated',
      });
    },
    onCompanySelected(company) {
      this.advance.company = company;
    },
    async voidAdvance(data) {
      if (this.httpRequesting) return;
      try {
        this.httpRequesting = true;
        if (this.advance.accounting.paid > 0) {
          throw new Error(`You will not be able to void the advance because it was used to pay for ${this.advance.appliedTo}.`);
        }
        const response = await this.service.void(this.advance._id, data);
        this._handleEditResponse(response);
        this.pushSuccess('Advance was voided successfully!');
      } catch (e) {
        this.pushError(e.message, e);
      } finally {
        this.httpRequesting = false;
      }
    },
    isDefaultCurrency(currency) {
      return currency._id === this.localCurrency._id;
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
