import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import LocationMultiSelector from '../location/location-multi-selector.vue';
import HumanIntervalInput from '../../form/human-interval-input.vue';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole, toUserName } from '../../../utils/user';
import CompanyService from '../../../services/company-service';
import CountryService from '../../../services/country-service';
import LanguageService from '../../../services/language-service';
import CompanyExternalAccountingService from '../../../services/company-external-accounting-code-service';
import SubnetGroup from '../../form/subnet-group.vue';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import CompanyAjaxBasicSelect from './company-ajax-basic-select.vue';
import BillingInformation from './billing-information/billing-information.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import CustomerTierLevelSelector from './customer-tier-level-selector.vue';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import AddressInformation from '../address/address-information.vue';
import CompanyGrid from './company-grid.vue';
import UserGrid from '../user/user-grid.vue';
import InternalDepartmentMultiSelector from '../../internal-department-select/internal-department-multi-selector.vue';
import SecurityPolicy from '../security-policy/security-policy.vue';
import PcSettings from './pc-settings/pc-settings.vue';
import SiConnectorDetails from '../connector/si-connector-details.vue';
import BalanceInformation from './balance-information/balance-information.vue';
import SsoSettings from './sso-settings/sso-settings.vue';
import IpDetails from './ip-details/index.vue';
import ssoSettingsMixin from '../../../mixins/sso-settings-mixin';
import CompanyExcludedProvidersTable from './excluded-providers/company-excluded-providers-table.vue';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import MtSettings from '../../mt-settings/mt-settings.vue';
import IndustrySelect from '../../industry-select/industry-select.vue';
import WorkflowTemplatesSection from './workflow-templates/company-workflow-templates-section.vue';

const countryService = new CountryService();
const companyService = new CompanyService();
const languageService = new LanguageService();
const companyExternalAccountingService = new CompanyExternalAccountingService();
const buildInitialCompany = () => ({
  _id: null,
  name: '',
  parentCompany: {
    _id: '',
    name: '',
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
  },
  status: '',
  industry: '',
  pursuitActive: false,
  dataClassification: 'Public',
  customerTierLevel: '',
  availableTimeToDeliver: [],
  website: '',
  primaryPhoneNumber: '',
  notes: '',
  salesRep: {
    _id: null,
    firsName: '',
    lastName: '',
    deleted: false,
    terminated: false,
  },
  mailingAddress: {
    line1: '',
    line2: '',
    city: '',
    state: {
      name: '',
      country: {},
    },
    country: {},
    zip: '',
  },
  billingAddress: {
    line1: '',
    line2: '',
    city: '',
    state: {
      name: '',
      country: {},
    },
    country: {},
    zip: '',
  },
  balanceInformation: {},
  billingEmail: '',
  cidr: [{
    ip: '0.0.0.0/0',
    description: 'All IPv4',
    valid: true,
  },
  {
    ip: '0:0:0:0:0:0:0:0/0',
    description: 'All IPv6',
    valid: true,
  }],
  retention: {
    days: 2555, // default: 7y
    hours: 0,
    minutes: 0,
  },
  billingInformation: {
    purchaseOrderRequired: false,
    onHold: false,
    onHoldReason: '',
    grossProfit: 0,
    rates: [],
  },
  readDate: null,
  internalDepartments: [],
  excludedProviders: [],
  serviceAgreement: false,
  locations: [],
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
  isOverwritten: false,
  mandatoryRequestContact: true,
  isMandatoryExternalAccountingCode: false,
  pcSettings: {
    mtThreshold: 75,
    lockedSegments: {
      includeInClientStatistics: false,
      includeInProviderStatistics: false,
      segmentsToLock: [],
      newConfirmedBy: 'Editor/Post-Editor',
    },
  },
  siConnector: {},
  areSsoSettingsOverwritten: false,
  ssoSettings: {
    isSSOEnabled: false,
    certificate: '',
    issuerMetadata: '',
    entryPoint: '',
    forgotPasswordPoint: '',
  },
  mtSettings: {
    useMt: false,
    languageCombinations: [],
  },
  allowCopyPasteInPortalCat: true,
});
const COMPANY_STATUS_OPTIONS = ['Prospecting', 'Won', 'Lost'];
const DATA_CLASSIFICATION_OPTIONS = ['Restricted', 'Public', 'Confidential'];

export default {
  mixins: [entityEditMixin, ssoSettingsMixin],
  components: {
    AddressInformation,
    BillingInformation,
    CompanyGrid,
    CustomerTierLevelSelector,
    SimpleBasicSelect,
    RichTextEditor,
    SubnetGroup,
    UserAjaxBasicSelect,
    UserGrid,
    InternalDepartmentMultiSelector,
    LocationMultiSelector,
    CompanyAjaxBasicSelect,
    SecurityPolicy,
    PcSettings,
    SiConnectorDetails,
    BalanceInformation,
    SsoSettings,
    IpDetails,
    CompanyExcludedProvidersTable,
    HumanIntervalInput,
    ConfirmDialog,
    MtSettings,
    IndustrySelect,
    WorkflowTemplatesSection,
  },
  data() {
    return {
      shouldCollapseAllRates: false,
      loading: false,
      useExistingSecurityPolicies: true,
      managing: null,
      company: buildInitialCompany(),
      companies: [],
      countries: [],
      loadingCountries: true,
      areValidRates: true,
      isValidBillingInformation: true,
      billingSameAsMailing: false,
      isValidSecurityPolicy: false,
      previousBillingAddress: {},
      isValidPcSettings: true,
      isValidSSOSettings: true,
      isValidAvailableTimeToDeliver: true,
      isSubCompanyGridExpanded: false,
      isContactGridExpanded: false,
      isExcludedProvidersTableExpanded: false,
      isRatesRetrieved: false,
      originalAvailableTimeToDeliver: [],
      confirmDialogOptions: {
        handler: null,
        message: '',
      },
      languages: [],
      isUserIpAllowed: true,
      externalAccountingCodes: [],
    };
  },
  created() {
    this.subCompanyGridColumns = [
      'Name',
      'Company status',
      'Industry',
      'Sales rep',
      'Created By',
      'Updated At',
      'Inactive',
      'Company Notes',
      'LSP Internal Departments',
      'Billing Notes',
      'Using Default Policies',
    ];
    countryService.retrieve().then((response) => {
      this.countries = _.get(response, 'data.list', []);
      if (this.isNew) {
        this._assignDefaultCountries();
      }
    })
      .catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Countries could not be retrieved',
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      }).finally(() => {
        this.loadingCountries = false;
      });
    this.companyStatusSelectOptions = COMPANY_STATUS_OPTIONS;
    this.dataClassificationSelectOptions = DATA_CLASSIFICATION_OPTIONS;
    this.retrieveLanguages();
  },
  watch: {
    'company.securityPolicy': function (newSecurityPolicy) {
      this.company.securityPolicy = newSecurityPolicy;
    },
    'company.isOverwritten': function (isOverwritten) {
      this.useExistingSecurityPolicies = !isOverwritten;
    },
    'company.name': function () {
      this.resetHierarchy();
    },
    useExistingSecurityPolicies(isChecked) {
      let parentSecurityPolicy = null;
      this.company.isOverwritten = !isChecked;
      if (isChecked) {
        const { parentCompany } = this.company;
        if (!_.isEmpty(_.get(parentCompany, '_id'))) {
          if (_.isNil(parentSecurityPolicy) && !_.isNil(_.get(parentCompany, 'securityPolicy'))) {
            parentSecurityPolicy = _.get(parentCompany, 'securityPolicy', null);
          }
        }
        this.company.securityPolicy = _.defaultTo(parentSecurityPolicy,
          _.clone(this.lsp.securityPolicy));
      }
    },
    billingSameAsMailing(isSame) {
      if (!isSame) {
        this.$set(this.company, 'billingAddress', this.previousBillingAddress);
        return;
      }
      this.previousBillingAddress = _.cloneDeep(this.company.billingAddress);
      const mailingAddressClone = _.cloneDeep(this.company.mailingAddress);
      this.$set(this.company, 'billingAddress', mailingAddressClone);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    companyHierarchy() {
      const { parentCompany } = this.company;
      const name = _.get(this, 'company.name');
      if (_.isEmpty(parentCompany)) {
        return name;
      }
      return `${parentCompany.hierarchy} : ${name}`;
    },
    billingErrors() {
      if (!_.isNil(this.billingInformationErrors)) {
        return this.billingInformationErrors.map((e) => e.message).join(', ');
      }
      return '';
    },
    entityName() {
      return 'company';
    },
    selectedParentCompany() {
      return {
        text: _.get(this.company, 'parentCompany.name'),
        value: _.get(this.company, 'parentCompany._id', ''),
      };
    },
    isValidName() {
      return !_.isEmpty(this.company.name);
    },
    isManage() {
      return this.$route.path.indexOf('/manage') > 0;
    },
    hasUserReadAccess() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },
    canChangeRetentionPolicy() {
      return hasRole(this.userLogged, 'COMPANY-DOC-RET-TIME_UPDATE_ALL');
    },
    canUpdateSecurity() {
      return hasRole(this.userLogged, 'COMPANY-SECURITY_UPDATE_ALL');
    },
    canAccessBillingInformation() {
      return this.canReadBillingInformation || this.canEditBillingInformation;
    },
    canReadLocations() {
      return hasRole(this.userLogged, 'LOCATION_READ_ALL');
    },
    canReadInternalDepartments() {
      return hasRole(this.userLogged, 'INTERNAL-DEPARTMENT_READ_ALL');
    },
    canReadBillingInformation() {
      return hasRole(this.userLogged, 'COMPANY-BILLING_READ_OWN') || hasRole(this.userLogged, 'COMPANY_READ_ALL');
    },
    canEditBillingInformation() {
      return hasRole(this.userLogged, 'COMPANY-BILLING_UPDATE_OWN') || hasRole(this.userLogged, 'COMPANY-BILLING_UPDATE_ALL');
    },
    canEditOwnCompany() {
      return hasRole(this.userLogged, 'COMPANY_UPDATE_OWN');
    },
    canEditPcSettings() {
      return hasRole(this.userLogged, 'COMPANY-SETTINGS-CAT_UPDATE_ALL');
    },
    canReadPcSettings() {
      return ['COMPANY-SETTINGS-CAT_READ_ALL', 'COMPANY-SETTINGS-CAT_UPDATE_ALL']
        .some(role => hasRole(this.userLogged, role));
    },
    canReadAndEditIpPatentRates() {
      return hasRole(this.userLogged, 'COMPANY-IP-RATES_UPDATE_ALL');
    },
    canReadDataClassification() {
      return hasRole(this.userLogged, 'DATA-CLASSIFICATION_READ_ALL');
    },
    canEditDataClassification() {
      return hasRole(this.userLogged, 'DATA-CLASSIFICATION_UPDATE_ALL');
    },
    shouldShowIPRatesSection() {
      return this.canReadAndEditIpPatentRates && !this.isNew;
    },
    isEmptyCIDR() {
      return _.isNil(this.company.cidr) || _.isEmpty(this.company.cidr);
    },
    salesRepSelected() {
      if (this.company && this.company.salesRep) {
        return {
          text: this.salesRepName,
          value: _.get(this, 'company.salesRep._id'),
          deleted: _.get(this, 'company.salesRep.deleted'),
          terminated: _.get(this, 'company.salesRep.terminated'),
        };
      }
      return { text: '', value: '' };
    },
    salesRepName() {
      const salesRep = _.get(this.company, 'salesRep', '');
      return toUserName(salesRep);
    },
    companyHasSalesRep() {
      return this.company && !_.isEmpty(this.company.salesRep) && this.company.salesRep._id;
    },
    confirmDialogHandler() {
      return _.get(this, 'confirmDialogOptions.handler', null);
    },
    confirmDialogMessage() {
      return _.get(this, 'confirmDialogOptions.message', '');
    },
    canCreate() {
      return hasRole(this.userLogged, 'COMPANY_CREATE_ALL');
    },
    canEdit() {
      if (!this.new) {
        return hasRole(this.userLogged, { oneOf: ['COMPANY_UPDATE_ALL', 'COMPANY_UPDATE_OWN'] });
      }
      return this.canCreate;
    },
    cancelText() {
      return this.canEdit ? 'Cancel' : 'Exit';
    },
    isNew() {
      return !this.company._id;
    },
    isValidSubnet() {
      if (!this.company.cidr || this.company.cidr.length === 0) {
        return false;
      }
      return this.company.cidr.findIndex((c) => !c.valid) === -1;
    },
    companyGridQuery() {
      if (this.company.name) {
        return { filter: `{ "hierarchy": "${this.company.name}", "isSubCompaniesSearch": true }` };
      }
      return {};
    },
    userGridQuery() {
      if (this.hasUserReadAccess && this.company._id) {
        return { filter: `{ "typeName": "Contact", "companyId": "${this.company._id}" }` };
      }
      return {};
    },
    excludedProvidersTableQuery() {
      if (this.hasUserReadAccess && this.company._id) {
        return { filter: `{ "companyId": "${this.company._id}" }` };
      }
      return {};
    },
    isValidStatus() {
      return typeof this.company.status === 'string' && this.company.status.length;
    },
    isValidIndustry() {
      return typeof this.company.industry === 'string' && this.company.industry.length;
    },
    isValidCustomerTierLevel() {
      return typeof this.company.customerTierLevel === 'string'
        && this.company.customerTierLevel.length;
    },
    isValidDataClassification() {
      const dataClassification = _.get(this, 'company.dataClassification', null);
      if (_.isNil(dataClassification)) return false;
      return _.isString(dataClassification)
        && this.dataClassificationSelectOptions
          .some((option) => option === dataClassification);
    },
    isMandatoryExternalAccountingCodeEditMode() {
      return this.externalAccountingCodes.length > 0;
    },
    isValid() {
      return this.isValidSubnet &&
        this.isValidName &&
        this.isValidStatus &&
        this.isValidIndustry &&
        this.isValidCustomerTierLevel &&
        this.isValidBillingInformation &&
        this.isValidSecurityPolicy &&
        this.isValidPcSettings &&
        this.isValidSSOSettings &&
        this.isValidDataClassification &&
        this.isValidAvailableTimeToDeliver &&
        _.isEmpty(_.get(this, 'errors.items', []));
    },
    loadingCompanies() {
      return !_.isArray(this.companies) || this.companies.length === 0;
    },
    loadingSubs: function (name) {
      return _.isArray(this[name].subcompanies);
    },
    companyUrl: {
      get() {
        return this.company.website;
      },
      set(value) {
        const protocol = 'http://';
        if (this.company.website.substr(0, protocol.length) !== protocol) {
          this.company.website = protocol + value;
        } else {
          this.company.website = value;
        }
      },
    },
    urlText() {
      if (this.company.website) {
        return this.company.website;
      }
      return '';
    },
    internalDepartments() {
      if (!_.isEmpty(_.get(this.company, 'internalDepartments'))) {
        return this.company.internalDepartments.map((i) => _.get(i, 'name', '')).join(', ');
      }
    },
    locations() {
      if (!_.isEmpty(_.get(this.company, 'locations'))) {
        return this.company.locations.map((l) => _.get(l, 'name', '')).join(', ');
      }
    },
    hasBalance() {
      return !_.isEmpty(this.company.balanceInformation);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setLsp']),
    _service() {
      return companyService;
    },
    _initialize(entityId) {
      if (entityId) {
        this.httpRequesting = true;
        companyService.get(entityId).then((response) => {
          this._handleRetrieve(response);
          // Check if the form has a previous state.
          const previousFormState = this.formState(this.formKey, this.formId);
          if (previousFormState) {
            Object.assign(this, previousFormState.data);
          }
        }).catch((err) => {
          const notification = {
            title: 'Error',
            message: `Could not retrieve ${this.entityName}`,
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        }).finally(() => {
          this.httpRequesting = false;
        });
      } else {
        const previousFormState = this.formState(this.formKey, this.$route.path);
        const previousFormCompanyId = _.get(previousFormState, 'data.company._id');
        if (!_.isEmpty(previousFormState) && _.isEmpty(previousFormCompanyId)) {
          if (this._assignPreviousFormState) {
            this._assignPreviousFormState(previousFormState.data);
          } else {
            Object.assign(this, previousFormState.data);
          }
        } else if (this._clear) {
          this._clear();
        }
        if (this.isNew) {
          this.company.securityPolicy = Object.assign({}, this.lsp.securityPolicy);
          this.company.mtSettings = Object.assign({}, this.lsp.mtSettings);
          this.company.pcSettings.lockedSegments.includeInClientStatistics = _.get(this.lsp, 'pcSettings.lockedSegments.includeInClientStatistics', false);
          this.company.pcSettings.lockedSegments.includeInProviderStatistics = _.get(this.lsp, 'pcSettings.lockedSegments.includeInProviderStatistics', false);
          this.company.pcSettings.lockedSegments.segmentsToLock = _.get(this.lsp, 'pcSettings.lockedSegments.segmentsToLock', []);
          this.company.pcSettings.lockedSegments.newConfirmedBy = _.get(this.lsp, 'pcSettings.lockedSegments.newConfirmedBy', '');
        }
      }
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.company.readDate');
      this.shouldCollapseAllRates = true;
      if (newReadDate) {
        this.company.readDate = newReadDate;
      }
      const ssoSettings = _.get(response, 'data.company.ssoSettings');
      if (!_.isNil(ssoSettings)) {
        this.company.ssoSettings = ssoSettings;
      }
      this.originalAvailableTimeToDeliver = this.company.availableTimeToDeliver;
    },
    _handleRetrieve(response) {
      const { company, isUserIpAllowed } = response.data;
      this.company = Object.assign(this.company, company);
      this.originalAvailableTimeToDeliver = this.company.availableTimeToDeliver;
      this.isUserIpAllowed = isUserIpAllowed;
      this.retrieveExternalAccountingCodes(company);
    },
    async _handleSaving() {
      const clone = this.prepareForEdition();
      try {
        const isSucceeded = await this._save(clone);
        this.$emit('save-company');
        if (isSucceeded && this.isManage) {
          this.$emit('entity-managed-save');
        }
      } catch (e) {
        const notification = {
          title: 'Error',
          message: 'Couldn\'t save company',
          state: 'danger',
          response: e,
        };
        this.pushNotification(notification);
      }
    },
    async _handleCreate(response) {
      const companyId = _.get(response, 'data.company._id', '');
      if (!_.isEmpty(companyId)) {
        await this.$router.replace({
          name: 'company-edition',
          params: { entityId: companyId },
        });
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'company', freshEntity);
    },
    _assignPreviousFormState(previousFormState) {
      Object.assign(this, previousFormState);
    },
    _clear() {
      this.$set(this, 'company', buildInitialCompany());
    },
    _pickFormData() {
      return _.pick(this, ['company', 'selectedParentCompany']);
    },
    onSalesRepChange(salesRep) {
      const firstName = _.get(salesRep, 'firstName', '');
      const lastName = _.get(salesRep, 'lastName', '');
      this.company.salesRep = {
        _id: salesRep.value,
        firstName,
        lastName,
        deleted: salesRep.deleted || false,
        terminated: salesRep.terminated || false,
      };
    },
    goToUrl(event) {
      if (!this.company.website.length) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    addSubnet() {
      this.company.cidr.push({ ip: '', description: '' });
    },
    removeSubnet(index) {
      if (this.company.cidr.length === 1) {
        // If it is the last one show a toaster
        const message = {
          title: 'Warning',
          message: 'No one will be able to download any files for this company',
          state: 'warning',
        };
        this.pushNotification(message);
      }
      this.company.cidr.splice(index, 1);
    },
    updateCIDR(index, data) {
      const obj = this.company.cidr[index];
      Object.assign(obj, data);
      if (obj.valid === undefined) {
        // if valid does not exist, take the value as valid since it is comming from the request
        obj.valid = true;
      }
      this.$set(this.company.cidr, index, obj);
    },
    subnetValid(index, data) {
      const obj = this.company.cidr[index];
      obj.valid = data;
      this.$set(this.company.cidr, index, obj);
    },
    addExcludedProvider(excludedProvider) {
      const provider = {
        isNew: excludedProvider.isNew,
        user: excludedProvider.user,
      };
      this.company.excludedProviders.push(provider);
    },
    updateExcludedProviderNote(excludedProviderData) {
      const { index, excludedProvider } = excludedProviderData;
      this.company.excludedProviders[index].user.notes = excludedProvider.user.notes;
    },
    removeExcludedProvider(providerId) {
      this.company.excludedProviders = _.reject(this.company.excludedProviders,
        (p) => (_.isEmpty(p) || p.user.userId === providerId));
    },
    async onParentCompanySelect(parentCompany) {
      if (this.useExistingSecurityPolicies && !_.isNil(_.get(parentCompany, 'securityPolicy'))) {
        this.company.securityPolicy = parentCompany.securityPolicy;
      }
      let ssoSettings = _.get(parentCompany, 'ssoSettings', undefined);
      if (!_.isEmpty(parentCompany)
        && !_.get(parentCompany, 'areSsoSettingsOverwritten', false)
      ) {
        ssoSettings = await this.getSsoSettings(parentCompany);
      }
      this.company.ssoSettings = ssoSettings;
      this.company.parentCompany = {
        name: parentCompany.name,
        _id: parentCompany.value,
        hierarchy: parentCompany.hierarchy,
        securityPolicy: _.get(parentCompany, 'securityPolicy'),
      };
      this.resetHierarchy();
    },
    onSecurityPolicyValidation(isValid) {
      this.isValidSecurityPolicy = isValid;
    },
    manage() {
      this.$emit('company-manage');
    },
    manageSalesRep() {
      this.$emit('user-manage');
    },
    manageInternalDepartment() {
      this.$emit('internal-department-manage');
    },
    manageLocations() {
      this.$emit('location-manage');
    },
    onManageBillingInformationEntity(manageEventName) {
      this.$emit(manageEventName);
    },
    onEditSubCompany(eventData) {
      this.$emit('company-edition', eventData);
    },
    onCreateSubCompany(eventData) {
      this.$emit('company-creation', eventData);
    },
    onEditContact(eventData) {
      this.$emit('user-edition', eventData);
    },
    onCreateContact(eventData) {
      this.$emit('user-creation', eventData);
    },
    onLeadSourceManage() {
      this.$emit('lead-source-manage');
    },
    prepareForEdition() {
      if (typeof this.company.billingAddress.country === 'string') {
        const countryId = _.get(this.company, 'billingAddress.country');
        _.set(
          this.company,
          'billingAddress.country',
          {
            _id: countryId,
            name: _.get(_.find(this.countries, (c) => c._id === countryId), 'name', ''),
          },
        );
      }
      if (typeof this.company.mailingAddress.country === 'string') {
        const countryId = _.get(this.company, 'mailingAddress.country');
        _.set(
          this.company,
          'mailingAddress.country',
          {
            _id: countryId,
            name: _.get(_.find(this.countries, (c) => c._id === countryId), 'name', ''),
          },
        );
      }
      const clone = _.cloneDeep(this.company);
      if (clone._id === null) {
        delete clone._id;
      }
      if (_.isEmpty(_.get(clone, 'parentCompany._id', ''))) {
        delete clone.parentCompany;
      } else if (_.isEmpty(_.get(clone.parentCompany, 'parentCompany._id', ''))) {
        delete clone.parentCompany.parentCompany;
      } else if (_.isEmpty(_.get(clone.parentCompany.parentCompany, 'parentCompany._id', ''))) {
        delete clone.parentCompany.parentCompany.parentCompany;
      }
      if (this.useExistingSecurityPolicies) {
        delete clone.securityPolicy;
      }
      if (clone.cidr) {
        // delete the valid input assigned by the frontend
        clone.cidr.forEach((c) => {
          delete c.valid;
        });
      }
      // Delete billing information if user can't edit it or company is new
      if (!this.canEditBillingInformation || this.isNew) {
        delete clone.billingInformation;
      }
      if (!_.isEmpty(_.get(clone, 'billingInformation.rates'))) {
        Object.keys(clone.billingInformation).forEach((field) => {
          if (
            !_.isBoolean(clone.billingInformation[field])
            && !_.isNumber(clone.billingInformation[field])
            && _.isEmpty(clone.billingInformation[field])
          ) {
            delete clone.billingInformation[field];
          }
        });
        clone.billingInformation.rates = clone.billingInformation.rates.map((r) => {
          if (_.isNil(r._id) || _.isEmpty(r._id)) {
            delete r._id;
          }
          if (_.isEmpty(r.sourceLanguage)) {
            delete r.sourceLanguage;
          }
          if (_.isEmpty(r.targetLanguage)) {
            delete r.targetLanguage;
          }
          return r;
        });
      }
      if (!this.isRatesRetrieved) {
        _.unset(clone, 'billingInformation.rates');
      }
      if (!_.isNil(_.get(clone, 'salesRep._id'))) {
        clone.salesRep = clone.salesRep._id;
      } else {
        delete clone.salesRep;
      }
      if (clone.mailingAddress) {
        this.processAddressInformation(clone.mailingAddress);
      }
      if (clone.billingAddress) {
        this.processAddressInformation(clone.billingAddress);
      }
      if (!_.isEmpty(_.get(clone, 'pcSettings.lockedSegments.segmentsToLock'))) {
        clone.pcSettings.lockedSegments.segmentsToLock =
          clone.pcSettings.lockedSegments.segmentsToLock.map(segment => _.get(segment, '_id', segment));
      }
      if (this.isNew) {
        clone._id = '';
      }
      return clone;
    },
    onCompanyMinChargeList(query) {
      this.$emit('company-minimum-charge-list', query);
    },
    onBillingInformationValidation(isValid) {
      this.isValidBillingInformation = isValid || this.isNew;
    },
    onAvailableTimeToDeliverValidation(isValid) {
      this.isValidAvailableTimeToDeliver = isValid;
    },
    processAddressInformation(address) {
      if (address) {
        const countryId = _.get(address, 'country._id', _.get(address, 'country'));
        if (_.isEmpty(countryId) || _.isObject(countryId)) {
          delete address.country;
        } else {
          address.country = countryId;
        }
        const stateId = _.get(address, 'state._id', _.get(address, 'state'));
        if (_.isEmpty(stateId) || _.isObject(stateId)) {
          delete address.state;
        } else {
          address.state = stateId;
        }
      }
    },
    onPcSettingsValidation(isValid) {
      this.isValidPcSettings = isValid;
    },
    onSSOSettingsValidation(isValid) {
      this.isValidSSOSettings = isValid;
    },
    resetHierarchy() {
      const hierarchy = _.get(this, 'company.parentCompany.hierarchy');
      if (_.isNil(hierarchy)) {
        this.company.hierarchy = this.company.name;
        return;
      }
      this.company.hierarchy = `${hierarchy} : ${this.company.name}`;
    },
    async save() {
      if (!this.isValid) {
        return;
      }

      this.shouldCollapseAllRates = false;
      const deletedTimeToDeliver = _.difference(
        this.originalAvailableTimeToDeliver,
        this.company.availableTimeToDeliver
      );

      if (this.isNew || _.isEmpty(deletedTimeToDeliver)) {
        return this._handleSaving();
      }
      try {
        const response = await companyService.getRequestsByCompanyTimeToDeliver(
          this.company._id,
          deletedTimeToDeliver
        );
        const requests = _.get(response, 'data', []);
        if (!_.isEmpty(requests)) {
          return this.openConfirmDialog();
        }
        return this._handleSaving();
      } catch (e) {
        const notification = {
          title: 'Error',
          message: 'Couldn\'t save company',
          state: 'danger',
          response: e,
        };
        this.pushNotification(notification);
      }
    },
    retrieveRates() {
      this.httpRequesting = true;
      companyService.retrieveCompanyRates(this.company._id)
        .then(({ data }) => (this.company.billingInformation.rates = _.get(data, 'rates', [])))
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Countries could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.httpRequesting = false;
          this.isRatesRetrieved = true;
        });
    },
    _assignDefaultCountries() {
      const US = this.countries.find((c) => c.code === 'US');
      if (_.isNil(US)) return;
      const defaultOption = _.pick(US, ['_id', 'name']);
      this.company.billingAddress.country = defaultOption;
      this.company.mailingAddress.country = defaultOption;
    },
    onConfirmDialogShow(event) {
      this.$refs.confirmDialog.show();
      this.confirmDialogOptions = event;
    },
    onDialogConfirm(event) {
      if (!_.isNil(this.confirmDialogHandler)) {
        this.confirmDialogHandler(event);
      }
    },
    openConfirmDialog() {
      const confirmDialogOptions = {
        handler: (result) => {
          if (!result.confirm) {
            this.company.availableTimeToDeliver = this.originalAvailableTimeToDeliver;
            return;
          }
          this._handleSaving();
        },
        message: 'You are deleting a value that has been used in at least one request. Are you sure?',
      };
      this.onConfirmDialogShow(confirmDialogOptions);
    },
    async retrieveLanguages() {
      const response = await languageService.retrieve();
      this.languages = _.get(response, 'data.list', []);
    },
    async retrieveExternalAccountingCodes(company) {
      const response = await companyExternalAccountingService.retrieve(
        { filter: { 'company._id': company._id } },
      );
      this.externalAccountingCodes = _.get(response, 'data.list', []).filter(extAccCode => !extAccCode.deleted);
    },
  },
};
