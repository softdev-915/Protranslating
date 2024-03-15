import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment-timezone';

import CommaSeparatedEmailSelector from '../../form/comma-separated-email-selector.vue';
import LspLogoImage from './lsp-logo-image.vue';
import SectionContainer from '../../section-container/section-container.vue';
import AddressInformation from '../address/address-information.vue';
import SecurityPolicy from '../security-policy/security-policy.vue';
import CurrencyExchange from './currency-exchange.vue';
import LspSettingsCustomQuery from './lsp-settings-custom-query.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import PaymentGatewaySelect from './payment-gateway-select.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import AutoTranslateSettings from './auto-translate-settings.vue';
import ProtectedInput from '../../form/protected-input.vue';
import { entityEditMixin } from '../../../mixins/entity-edit';
import UserRoleCheckMixin from '../../../mixins/user-role-check';
import transformAddressInformation from '../address/address-information-helper';
import { hasRole } from '../../../utils/user';
import localDateTime from '../../../utils/filters/local-date-time';
import LspService from '../../../services/lsp-service';
import PcSettings from './pc-settings.vue';
import MaskedPaymentGatewaySecretInput from './masked-payment-gateway-secret-input.vue';
import MaskedPaymentGatewayKeyInput from './masked-payment-gateway-key-input.vue';
import MtSettings from '../../mt-settings/mt-settings.vue';
import LanguageService from '../../../services/language-service';
import MaskedLspTaxIdInput from './masked-lsp-tax-id-input.vue';

const lspService = new LspService();
const languageService = new LanguageService();
const buildInitialState = () => ({
  wasLogoDeleted: false,
  wasLogoUpdated: false,
  isValidSecurityPolicy: true,
  logoProspect: null,
  httpRequesting: false,
  contactEmailsForVendorsIsValid: true,
  contactEmailsForContactsIsValid: true,
  isValidPcSettings: false,
  isValidAutoTranslateSettings: false,
  languages: [],
  lspEdit: {
    name: '',
    emailConnectionString: '',
    pcSettings: {
      mtEngine: null,
      mtThreshold: '',
      supportedFileFormats: [],
      lockedSegments: {
        segmentsToLock: [],
        newConfirmedBy: 'Editor/Post-Editor',
      },
    },
    logoImage: {
      base64Image: String,
    },
    vendorPaymentPeriodStartDate: null,
    addressInformation: {
      line1: '',
      line2: '',
      city: '',
      state: {
        _id: '',
        name: '',
        code: '',
        country: '',
      },
      country: {
        name: '',
        code: '',
        _id: '',
      },
      zip: '',
    },
    securityPolicy: {
      passwordExpirationDays: null,
      numberOfPasswordsToKeep: null,
      minPasswordLength: null,
      maxInvalidLoginAttempts: null,
      lockEffectivePeriod: null,
      timeoutInactivity: null,
      passwordComplexity: {
        lowerCaseLetters: true,
        upperCaseLetters: true,
        specialCharacters: true,
        hasDigitsIncluded: true,
      },
    },
    currencyExchangeDetails: [],
    customQuerySettings: {
      reportCache: 0,
    },
    lspAccountingPlatformLocation: '',
    financialEntityPrefix: '',
    phoneNumber: '',
    url: '',
    taxId: '',
    fax: '',
    revenueRecognition: {
      startDate: '',
      endDate: '',
    },
    paymentGateway: {
      name: '',
      id: '',
      key: '',
      secret: '',
      account: '',
      isProduction: false,
    },
    timezone: '',
    officialName: '',
    supportsIpQuoting: false,
    autoTranslateSettings: {
      minimumConfidenceLevel: 0,
      autoTranslateFileOutput: 'Unformatted TXT',
    },
    mtSettings: {
      useMt: false,
      languageCombinations: [],
    },
  },
  datepickerOptions: {
    enableTime: true,
    allowInput: false,
    disableMobile: 'true',
    timezone: null,
  },
});

export default {
  inject: ['$validator'],
  components: {
    SectionContainer,
    AddressInformation,
    LspLogoImage,
    CurrencyExchange,
    CommaSeparatedEmailSelector,
    SecurityPolicy,
    PcSettings,
    LspSettingsCustomQuery,
    UtcFlatpickr,
    PaymentGatewaySelect,
    SimpleBasicSelect,
    AutoTranslateSettings,
    ProtectedInput,
    MaskedPaymentGatewaySecretInput,
    MaskedPaymentGatewayKeyInput,
    MtSettings,
    MaskedLspTaxIdInput,
  },
  mixins: [entityEditMixin, UserRoleCheckMixin],
  data() {
    return buildInitialState();
  },
  created() {
    this._initialize(this.lsp._id);
    this.datepickerOptions = {
      onValueUpdate: null,
      enableTime: false,
      allowInput: false,
      disableMobile: 'true',
    };
    this.timezoneOptions = moment.tz.names();
    this.retrieveLanguages();
  },
  watch: {
    'lspEdit.financialEntityPrefix': {
      handler(newValue) {
        this.lspEdit.financialEntityPrefix = newValue.toUpperCase();
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),

    entityName() {
      return 'lsp';
    },
    readOnly() {
      return hasRole(this.userLogged, 'LSP-SETTINGS_READ_OWN') && !this.canEdit;
    },
    canEdit() {
      return hasRole(this.userLogged, 'LSP-SETTINGS_UPDATE_OWN');
    },
    canEditAccounting() {
      return hasRole(this.userLogged, 'LSP-SETTINGS-ACCT_UPDATE_OWN');
    },
    isValidStartDate() {
      return !this.canEditAccounting || !_.isEmpty(this.lspEdit.revenueRecognition.startDate);
    },
    isValidEndDate() {
      return !this.canEditAccounting || !_.isEmpty(this.lspEdit.revenueRecognition.endDate);
    },
    isValidPaymentGatewayName() {
      return !_.isEmpty(this.lspEdit.paymentGateway.name);
    },
    isValidPaymentGatewayId() {
      return !_.isEmpty(this.lspEdit.paymentGateway.id);
    },
    isValidPaymentGatewayKey() {
      return !_.isEmpty(this.lspEdit.paymentGateway.key);
    },
    isValidPaymentGatewaySecret() {
      return !_.isEmpty(this.lspEdit.paymentGateway.secret);
    },
    canEditAccountingPlatform() {
      return hasRole(this.userLogged, 'LSP-SETTINGS-ACCT_UPDATE_OWN');
    },
    isValidVendorPaymentPeriodStartDate() {
      if (!this.canEdit) {
        return true;
      }
      const { vendorPaymentPeriodStartDate } = this.lspEdit;
      return !_.isNil(vendorPaymentPeriodStartDate) && !_.isEmpty(vendorPaymentPeriodStartDate);
    },
    localVendorPaymentPeriodStartDate() {
      const vendorPaymentPeriodStartDate = _.get(this, 'lspEdit.vendorPaymentPeriodStartDate', new Date());
      return localDateTime(vendorPaymentPeriodStartDate, 'YYYY-MM-DD HH:mm');
    },
    isValidAccountingPlatform() {
      if (!this.canEditAccountingPlatform) {
        return true;
      }
      return !_.isEmpty(this.lspEdit.lspAccountingPlatformLocation);
    },
    isValidFinancialEntityPrefix() {
      return !_.isEmpty(this.lspEdit.financialEntityPrefix);
    },
    isValidTimezone() {
      return !_.isEmpty(this.lspEdit.timezone);
    },
    isValid() {
      return _.isEmpty(_.get(this, 'errors.items'))
      && this.contactEmailsForContactsIsValid
      && this.contactEmailsForVendorsIsValid
      && this.isValidSecurityPolicy
      && this.isValidAccountingPlatform
      && this.isValidFinancialEntityPrefix
      && (!this.canReadPcSettings || this.isValidPcSettings)
      && this.isValidStartDate
      && this.isValidEndDate
      && this.isValidVendorPaymentPeriodStartDate
      && this.isValidTimezone
      && this.isValidAutoTranslateSettings;
    },
    canEditCustomQueries() {
      return hasRole(this.userLogged, 'CUSTOM-QUERY_UPDATE_ALL');
    },
    localStartDate() {
      const requestDeliveryDate = _.get(this, 'lspEdit.revenueRecognition.startDate', '');
      return localDateTime(requestDeliveryDate, 'YYYY-MM-DD HH:mm');
    },
    localEndDate() {
      const requestDeliveryDate = _.get(this, 'lspEdit.revenueRecognition.endDate', '');
      return localDateTime(requestDeliveryDate, 'YYYY-MM-DD HH:mm');
    },
    canEditEmailConnectionString() {
      return hasRole(this.userLogged, 'LSP-SETTINGS-SMTP_UPDATE_OWN');
    },
    canReadEmailConnectionString() {
      return hasRole(this.userLogged, 'LSP-SETTINGS-SMTP_READ_OWN');
    },
    canEditPcSettings() {
      return hasRole(this.userLogged, 'LSP-SETTINGS-CAT_UPDATE_OWN');
    },
    canReadPcSettings() {
      return ['LSP-SETTINGS-CAT_READ_OWN', 'LSP-SETTINGS-CAT_UPDATE_OWN']
        .some((role) => hasRole(this.userLogged, role));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setLsp']),
    _service() {
      return lspService;
    },
    _handleRetrieve(response) {
      const lsp = _.get(response, 'body.data.lsp', null);
      if (lsp) {
        this.setLsp(lsp);
        this.lspEdit = { ...this.lspEdit, ...lsp };
      }
    },
    _handleEditResponse(response) {
      const lsp = _.get(response, 'data.lsp', {});
      const newReadDate = lsp.readDate;
      this.setLsp(lsp);
      if (!_.isNil(newReadDate)) {
        this.lspEdit = { ...this.lspEdit, ...lsp };
      }
    },
    updateLogo() {
      this.wasLogoUpdated = true;
      this.save();
      this.wasLogoUpdated = false;
    },
    deleteLogo() {
      this.wasLogoDeleted = true;
      this.save();
      this.wasLogoDeleted = false;
    },
    prepareForSave() {
      this.lspEdit.logoImage = this.lsp.logoImage;
      const clone = _.cloneDeep(this.lspEdit);
      if (!this.wasLogoUpdated && !this.wasLogoDeleted) {
        clone.logoImage = undefined;
      }
      if (!_.isNil(_.get(clone, 'pcSettings.mtEngine._id'))) {
        clone.pcSettings.mtEngine = clone.pcSettings.mtEngine._id;
      } else {
        clone.pcSettings = _.omit(clone.pcSettings, 'mtEngine');
      }
      if (!_.isEmpty(_.get(clone, 'pcSettings.supportedFileFormats'))) {
        clone.pcSettings.supportedFileFormats = clone.pcSettings.supportedFileFormats
          .map((format) => format._id);
      }
      if (!_.isEmpty(_.get(clone, 'pcSettings.lockedSegments.segmentsToLock'))) {
        clone.pcSettings.lockedSegments.segmentsToLock = clone.pcSettings.lockedSegments.segmentsToLock.map((segment) => segment._id);
      }
      if (clone.addressInformation) {
        transformAddressInformation(clone.addressInformation);
        clone.addressInformation.country = _.get(clone.addressInformation, 'country._id', clone.addressInformation.country);
        clone.addressInformation.state = _.get(clone.addressInformation, 'state._id', clone.addressInformation.state);
      }
      if (_.isArray(clone.currencyExchangeDetails)) {
        clone.currencyExchangeDetails = clone.currencyExchangeDetails.map((detail) => {
          detail.quotation = _.toNumber(detail.quotation);
          return detail;
        });
      }
      return clone;
    },
    save() {
      if (this.isValid) {
        this._save(this.prepareForSave());
      }
    },
    onVendorPaymentPeriodStartDateChange(newDate) {
      if (newDate === null) {
        this.lspEdit.vendorPaymentPeriodStartDate = null;
        return;
      }
      this.lspEdit.vendorPaymentPeriodStartDate = moment(newDate).utc();
    },
    onExchangeAdd(index, base) {
      const len = this.lspEdit.currencyExchangeDetails.length;
      const newExchange = {
        base,
        quote: '',
        quotation: 0,
      };
      const { currencyExchangeDetails } = this.lspEdit;
      if (index >= 0 && len > index) {
        const currencyExchangeDetailsClone = currencyExchangeDetails.slice(0);
        currencyExchangeDetailsClone.splice(index + 1, 0, newExchange);
        this.lspEdit.currencyExchangeDetails = currencyExchangeDetailsClone;
      } else if (len === index) {
        this.lspEdit.currencyExchangeDetails.push(newExchange);
      }
    },
    onExchangeDelete(index) {
      const { currencyExchangeDetails } = this.lspEdit;
      if (index <= currencyExchangeDetails.length) {
        const currencyExchangeDetailsClone = currencyExchangeDetails.slice(0);
        currencyExchangeDetailsClone.splice(index, 1);
        this.lspEdit.currencyExchangeDetails = currencyExchangeDetailsClone;
      }
    },
    onContactEmailsValidated(value, userType) {
      this[`contactEmailsFor${userType}IsValid`] = value;
    },
    onSecurityPolicyValidation(isValid) {
      this.isValidSecurityPolicy = isValid;
    },
    onPcSettingsValidation(isValid) {
      this.isValidPcSettings = isValid;
    },
    onAutoTranslateValidation(isValid) {
      this.isValidAutoTranslateSettings = isValid;
    },
    async retrieveLanguages() {
      const response = await languageService.retrieve();
      this.languages = _.get(response, 'data.list', []);
    },
  },
};
