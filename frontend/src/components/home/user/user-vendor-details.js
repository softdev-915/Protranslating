import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import CompetenceLevelSelector from '../../competence-level-select/competence-level-selector.vue';
import InternalDepartmentMultiSelector from '../../internal-department-select/internal-department-multi-selector.vue';
import AddressInformation from '../address/address-information.vue';
import ApprovalMethodSelector from './approval-method-selector.vue';
import OfacSelector from './ofac-selector.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import PaymentMethodSelector from '../company/billing-information/payment-method-selector.vue';
import BillingTermSelector from '../company/billing-information/billing-term-selector.vue';
import CurrencySelector from '../../currency-select/currency-selector.vue';
import RateGrid from './rate/rate-grid.vue';
import TaxFormMultiSelector from './tax-form-multi-selector.vue';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import FileManagement from './file-management.vue';
import MaskedTaxIdInput from './masked-tax-id-input.vue';
import CountrySelector from '../address/country-selector.vue';
import UserVendorCertificationDetails from './user-vendor-certification-details.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import { isValidDate, isValidAddress, isValidTaxId } from '../../../utils/form';
import { defaultVendorDetails } from './user-helpers';
import MinHoursSelector from './min-hours-selector';
import { toOption } from '../../../utils/select2';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import CountryService from '../../../services/country-service';
import ServiceRequestLocker from '../../../services/service-request-locker';

const countryService = new CountryService();
const countryServiceLocker = new ServiceRequestLocker(countryService);
const FORM_1099_OPTIONS = ['DIV', 'INT', 'MISC'];
const FORM_1099_BOX = ['1 - Rents', '2 - Royalties', '3 - Other Income'];
const GENDER_OPTIONS = ['Male', 'Female', 'Not Selected'];
const FLAT_RATE_AMOUNT_PRECISION = 2;
const ELIGIBLE_TAX_FORM = '1099 Eligible';

export default {
  inject: ['$validator'],
  mixins: [userRoleCheckMixin],
  components: {
    RateGrid,
    CompetenceLevelSelector,
    InternalDepartmentMultiSelector,
    AddressInformation,
    ApprovalMethodSelector,
    MinHoursSelector,
    UtcFlatpickr,
    PaymentMethodSelector,
    BillingTermSelector,
    CurrencySelector,
    TaxFormMultiSelector,
    RichTextEditor,
    FileManagement,
    MaskedTaxIdInput,
    CountrySelector,
    OfacSelector,
    SimpleBasicSelect,
    UserVendorCertificationDetails,
  },
  props: {
    value: {
      type: Object,
    },
    readOnly: {
      type: Boolean,
    },
    shouldCollapseAllRates: Boolean,
    user: {
      type: Object,
    },
    abilities: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      areValidRates: true,
      countryList: [],
      selectedCurrency: {
        text: '',
        value: '',
      },
      vendorDetails: defaultVendorDetails(),
      vendorTypeOptions: ['V1', 'V2', 'V3'],
      selectedRegistrationCountry: '',
    };
  },
  created() {
    this.flatRateAmountPrecision = FLAT_RATE_AMOUNT_PRECISION;
    this.$emit('validate-vendor', this.isValid);
    this.genderSelectOptions = GENDER_OPTIONS;
    this.form1099Options = FORM_1099_OPTIONS;
    this.form1099BoxOptions = FORM_1099_BOX;
    this.getCountries();
  },
  watch: {
    value: {
      immediate: true,
      handler: function (newValue) {
        this.vendorDetails = newValue;
      },
    },
    vendorDetails: {
      handler(newVendorDetails) {
        if (newVendorDetails.escalated) {
          newVendorDetails.turnOffOffers = true;
        }
        this.$emit('input', newVendorDetails);
        this.$emit('validate-vendor', this.isValid);
        this.$emit('get-vendor-details-update');
      },
      deep: true,
      immediate: true,
    },
    areValidRates() {
      this.$emit('validate-vendor', this.isValid);
    },
    selectedCurrency({ value }) {
      this.vendorDetails.billingInformation.currency = value;
    },
    isTaxIdRequired(value) {
      if (!value) {
        this.vendorDetails.billingInformation.taxId = '';
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    isFlatRateMonthlyBillInvalid: function () {
      const { billingInformation } = this.vendorDetails;
      return billingInformation.hasMonthlyBill && billingInformation.flatRate;
    },
    canEdit: function () {
      return ['CONTACT_UPDATE_ALL', 'USER_UPDATE_ALL'].some((role) => this.hasRole(role));
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canCreateVendorVendor: function () {
      return this.canCreateVendorType || this.canCreateVendorType;
    },
    canCreateOrEditAll: function () {
      return ['USER_CREATE_ALL', 'USER_UPDATE_ALL'].some((role) => this.hasRole(role));
    },
    canReadFiles: function () {
      return this.hasRole('STAFF-FILE-MANAGEMENT_UPDATE_ALL');
    },
    canEditTaxId: function () {
      return this.hasRole('TAXID_READ_ALL') || this.hasRole('TAXID_CREATE_ALL');
    },
    canEditRates() {
      return ['VENDOR-RATES_UPDATE_ALL', 'VENDOR-RATES_CREATE_ALL'].some((role) => this.hasRole(role));
    },
    canReadRates() {
      return this.hasRole('VENDOR-RATES_READ_ALL');
    },
    canEditPriorityPay() {
      return this.hasRole('BILL-ACCT_UPDATE_ALL');
    },
    canEditBillsOnHold() {
      return this.hasRole('BILL-ACCT_UPDATE_ALL');
    },
    canEditMonthlyBill() {
      return this.hasRole('USER_UPDATE_ALL') || this.hasRole('VENDOR_UPDATE_ALL');
    },
    canEditFlatRateAmount() {
      return !this.readOnly && _.get(this.vendorDetails, 'billingInformation.flatRateAmount', false);
    },
    utcFlatpickrOptions() {
      return {
        onValueUpdate: null,
        enableTime: true,
        allowInput: false,
        disableMobile: 'true',
      };
    },
    showTaxId() {
      return this.canEditTaxId && this.isTaxIdRequired;
    },
    has1099EligibleTaxForm() {
      const taxFormList = _.get(this.vendorDetails.billingInformation, 'taxForm', []);
      return !_.isNil(taxFormList.find(({ name }) => name.includes(ELIGIBLE_TAX_FORM)));
    },
    isTaxIdRequired() {
      return _.get(this.vendorDetails.billingInformation, 'taxForm', [])
        .filter((tf) => _.get(tf, 'taxIdRequired', false)).length > 0;
    },
    isValidForm1099Type() {
      return !_.isEmpty(_.get(this.vendorDetails.billingInformation, 'form1099Type', ''));
    },
    isValidForm1099Box() {
      return !_.isEmpty(_.get(this.vendorDetails.billingInformation, 'form1099Box', ''));
    },
    isTaxIdValid() {
      if (!this.isTaxIdRequired) {
        return true;
      }
      return isValidTaxId(_.get(this.vendorDetails, 'billingInformation.taxId', ''));
    },
    isValid() {
      if (_.isEmpty(_.get(this.vendorDetails, 'type'))) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'competenceLevels', []))) {
        return false;
      }
      if (!isValidAddress(this.vendorDetails.address)) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'approvalMethod', []))) {
        return false;
      }
      if (!isValidDate(this.vendorDetails.hireDate)) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'billingInformation.paymentMethod', ''))) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'billingInformation.billingTerms', ''))) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'billingInformation.taxForm', []))) {
        return false;
      }
      if (this.isTaxIdRequired && !this.isTaxIdValid) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'billingInformation.currency', ''))) {
        return false;
      }
      if (_.isEmpty(_.get(this.vendorDetails, 'hiringDocuments', []))) {
        return false;
      }
      const { billingInformation } = this.vendorDetails;
      const { hasMonthlyBill = false, flatRate = false } = billingInformation;
      if (hasMonthlyBill && flatRate) {
        return false;
      }
      return true;
    },
    availableCountries() {
      return _.differenceWith(
        this.countryList,
        this.vendorDetails.registrationCountries,
        (availableOption, selectedOption) => availableOption.name === selectedOption.name
      );
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    uploadFile: function () {
      this.$emit('upload-file');
    },
    manageCompetenceLevels: function () {
      this.$emit('manage-competence');
    },
    manageInternalDepartments: function () {
      this.$emit('manage-internal-departments');
    },
    managePaymentMethods: function () {
      this.$emit('manage-payment-methods');
    },
    manageBillingTerms: function () {
      this.$emit('manage-billing-terms');
    },
    manageTaxForms: function () {
      this.$emit('manage-tax-forms');
    },
    onManageRateEntity(entityEventName) {
      if (entityEventName) {
        this.$emit('manage-rate-entity', entityEventName);
      }
    },
    onManageVendorMinimumCharge() {
      this.$emit('manage-vendor-minimum-charge');
    },
    onRatesValidation(areValidRates) {
      this.areValidRates = areValidRates;
      this.$emit('validate-vendor', this.isValid);
    },
    toCurrencyFormat: ({ _id, isoCode }) => ({
      text: isoCode,
      value: _id,
    }),
    formatCurrencySelectOption: ({ isoCode, _id }) => ({
      text: isoCode,
      value: _id,
    }),
    getCountries() {
      return countryServiceLocker.retrieve().then((response) => {
        this.countryList = response.data.list.filter(e => !e.deleted);
      })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Country could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        });
    },
    addRegistrationCountry() {
      if (_.isEmpty(this.selectedRegistrationCountry)) {
        return;
      }
      this.vendorDetails.registrationCountries.push(this.selectedRegistrationCountry);
      this.selectedRegistrationCountry = '';
    },
    removeRegistrationCountry(index) {
      this.vendorDetails.registrationCountries.splice(index, 1);
    },
    onCurrenciesLoaded(currencies) {
      if (_.isNil(this.user._id)) {
        const localCurrency = _.get(this, 'lsp.currencyExchangeDetails.0.base', '');
        this.vendorDetails.billingInformation.currency = localCurrency;
      }
      let userCurrency = this.vendorDetails.billingInformation.currency;
      if (!_.isNil(this.user._id)) {
        userCurrency = this.vendorDetails.billingInformation.currency;
      }
      const currency = currencies.find((c) => c._id === userCurrency);
      this.selectedCurrency = toOption(currency);
    },
    currencyFormat({ isoCode = '', _id = '' }) {
      return ({ text: isoCode, value: _id });
    },
  },
};
