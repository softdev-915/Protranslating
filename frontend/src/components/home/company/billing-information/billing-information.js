import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import RichTextEditor from '../../../rich-text-editor/rich-text-editor.vue';
import CurrencySelector from '../../../currency-select/currency-selector.vue';
import RatesGrid from './rate/rate-grid.vue';
import { findBillingInformationValidationError } from './billing-information-validator';
import PaymentMethodSelector from './payment-method-selector.vue';
import BillingTermSelector from './billing-term-selector.vue';
import { jsonToUrlParam } from '../../../../utils/browser';
import AbilityService from '../../../../services/ability-service';

const abilityService = new AbilityService();
const buildInitialState = () => ({
  areValidRates: true,
  rateErrors: [],
  selectedBillingTerm: {},
  selectedPaymentMethod: {},
  billingInformation: {
    grossProfit: 0,
    billingTerm: {},
    paymentMethod: {},
    purchaseOrderRequired: false,
    notes: '',
    onHold: false,
    onHoldReason: '',
    quoteCurrency: {
      _id: '',
      name: '',
      isoCode: '',
    },
    rates: [],
  },
  selectedQuoteCurrency: '',
  isRateGridExpanded: false,
  abilities: [],
});

export default {
  inject: ['$validator'],
  components: {
    RichTextEditor,
    RatesGrid,
    PaymentMethodSelector,
    BillingTermSelector,
    CurrencySelector,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    companyId: {
      type: String,
    },
    shouldCollapseAllRates: Boolean,
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.setBillingInformation(this.value);
    this.loadAbilities();
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp', 'lspExchangeDetails', 'localCurrency', 'currencyList']),
    canEdit: function () {
      return (
        hasRole(this.userLogged, 'COMPANY-BILLING_UPDATE_OWN')
        || hasRole(this.userLogged, 'COMPANY-BILLING_UPDATE_ALL')
      );
    },
    isValidQuoteCurrency() {
      if (_.isEmpty(this.companyId)) {
        return true;
      }
      return !_.isEmpty(this.selectedQuoteCurrency);
    },
    isValid() {
      return _.isEmpty(this.entityValidationErrors)
      && this.areValidRates
      && this.isValidQuoteCurrency;
    },
    entityValidationErrors() {
      return findBillingInformationValidationError(this.billingInformation);
    },
    companyMinChargeFilter() {
      return JSON.stringify({ 'company._id': this.companyId });
    },
    companyMinChargeGridLink() {
      return `company-minimum-charge?${jsonToUrlParam({ filter: this.companyMinChargeFilter })}`;
    },
  },
  watch: {
    currencyList() {
      this.setBillingInformation(this.value);
    },
    value(newValue) {
      this.setBillingInformation(newValue);
    },
    billingInformation(newValue) {
      if (this.canEdit) {
        this.$emit('input', newValue);
      }
    },
    isValid(newValue) {
      this.$emit('billing-information-validation', newValue);
    },
    selectedPaymentMethod(newValue) {
      this.billingInformation.paymentMethod = newValue;
    },
    selectedBillingTerm(newValue) {
      this.billingInformation.billingTerm = newValue;
    },
    selectedQuoteCurrency(newValue) {
      if (_.isEmpty(newValue)) return;
      let currencyFound;
      if (!_.isEmpty(this.currencyList)) {
        currencyFound = this.currencyList.find((c) => c._id === _.get(newValue, 'value', newValue));
        if (_.isNil(currencyFound)) {
          currencyFound = this.localCurrency;
        }
        this.billingInformation.quoteCurrency = _.pick(currencyFound, ['_id', 'name', 'isoCode']);
      }
    },
  },
  methods: {
    manageCompanyMinChargeGrid(event) {
      event.preventDefault();
      this.$emit('company-minimum-charge-list', { filter: this.companyMinChargeFilter });
    },
    setBillingInformation(newValue) {
      if (_.isEqual(newValue, this.billingInformation)) {
        return;
      }
      this.billingInformation = { ...this.billingInformation, ...this.value };
      if (this.value.paymentMethod) {
        this.selectedPaymentMethod = _.defaultTo(this.value.paymentMethod, '');
      }
      if (this.value.billingTerm) {
        this.selectedBillingTerm = _.defaultTo(this.value.billingTerm, '');
      }
      if (!_.isEmpty(_.get(this, 'value.quoteCurrency._id'))) {
        this.selectedQuoteCurrency = this.value.quoteCurrency._id;
      } else {
        this.selectedQuoteCurrency = _.get(this, 'localCurrency._id', '');
      }
      this.$emit('input', this.billingInformation);
    },
    manageBillingTerms() {
      this.$emit('billing-information-manage-entity', 'billing-term-manage');
    },
    managePaymentMethods() {
      this.$emit('billing-information-manage-entity', 'payment-method-manage');
    },
    onManageRateEntity(entityEventName) {
      if (entityEventName) {
        this.$emit('billing-information-manage-entity', entityEventName);
      }
    },
    onRatesValidation(areValidRates) {
      this.areValidRates = _.get(this, 'billingInformation.rates.length', 0) === 0 || areValidRates;
    },
    formatCurrencySelectOption: ({ isoCode, _id }) => ({
      text: isoCode,
      value: _id,
    }),
    toggleRateGrid() {
      this.isRateGridExpanded = !this.isRateGridExpanded;
      if (this.isRateGridExpanded) {
        this.$emit('retrieve-rates');
      }
    },
    loadAbilities() {
      abilityService.retrieve().then((response) => {
        const abilityList = _.get(response, 'data.list', []);
        this.abilities = abilityList;
      });
    },
  },
};
