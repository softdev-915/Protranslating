import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import CatToolMultiSelect from '../../cat-tool-select/cat-tool-multi-select.vue';
import UserGroupsSelection from './user-groups-selection.vue';
import UserRolesSelection from './user-roles-selection.vue';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import PtsEmailInput from '../../form/pts-email-input.vue';
import { hasRole, getUserModifications } from '../../../utils/user';
import { jsonToUrlParam } from '../../../utils/browser';
import UserService from '../../../services/user-service';
import { findUserValidationError } from './user-validator';
import { capitalizeFirstLetter } from '../../../utils/strings';
import { entityEditMixin } from '../../../mixins/entity-edit';
import AbilityService from '../../../services/ability-service';
import UserStaffDetails from './user-staff-details.vue';
import UserVendorDetails from './user-vendor-details.vue';
import UserContactDetails from './user-contact-details.vue';
import UserStatusDetails from './user-status-details/user-status-details.vue';
import transformAddressInformation from '../address/address-information-helper';
import { defaultContactDetails, defaultStaffDetails, defaultVendorDetails } from './user-helpers';
import LanguageCombinationSelector from '../../language-combination-selector/index.vue';
import SecurityPolicy from '../security-policy/security-policy.vue';
import Password from '../../form/set-up-password.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import SiConnectorDetails from '../connector/si-connector-details.vue';
import ssoSettingsMixin from '../../../mixins/sso-settings-mixin';

const STAFF_USER_TYPE = 'Staff';
const VENDOR_USER_TYPE = 'Vendor';
const CONTACT_USER_TYPE = 'Contact';
const ONE_SECOND = 1000;
const commonStaffVendorProps = [
  'competenceLevels',
  'phoneNumber',
  'approvalMethod',
  'hireDate',
  'hiringDocuments',
  'rates',
];
const EMAIL_VALIDATION_ERROR = 'Incorrect email format. The email format should be: name@domain.x';
const setStaffVendorCommonProps = (targetProps, srcProps) => {
  commonStaffVendorProps.forEach((k) => {
    if (!_.isEmpty(srcProps[k])) {
      targetProps[k] = srcProps[k];
    }
  });
};

const toOptionFormat = (val) => ({
  value: capitalizeFirstLetter(val),
  text: capitalizeFirstLetter(val),
});

const buildInitialState = () => ({
  shouldCollapseAllRates: false,
  companySelected: {
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
    ssoSettings: {
      isSSOEnabled: false,
    },
  },
  showRoles: false,
  showGroups: false,
  showFileUpload: false,
  isValidEmail: false,
  isValidSecondaryEmail: true,
  isEmailDirty: false,
  inactiveNotifications: false,
  isValidStaff: false,
  isValidVendor: false,
  isValidContact: false,
  loading: false,
  isValidSecurityPolicy: false,
  isValidPassword: true,
  useExistingSecurityPolicies: true,
  user: {
    isApiUser: false,
    isLocked: false,
    readDate: null,
    roles: [],
    groups: [],
    oldEmail: null,
    email: '',
    secondaryEmail: '',
    inactiveSecondaryEmailNotifications: true,
    type: '',
    firstName: '',
    middleName: '',
    lastName: '',
    password: '',
    company: '',
    projectManagers: [],
    abilities: [],
    languageCombinations: [],
    mockData: [],
    catTools: [],
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
    contactDetails: defaultContactDetails(),
    staffDetails: defaultStaffDetails(),
    vendorDetails: defaultVendorDetails(),
    deleted: false,
    terminated: false,
    terminatedAt: null,
    forcePasswordChange: true,
    isOverwritten: false,
    preferences: {
      preferredLanguageCombination: '',
    },
    siConnector: {},
    monthlyApiQuota: 10000000,
    monthlyConsumedQuota: 0,
    lastApiRequestedAt: null,
  },
  userTypes: [],
  userType: { value: '', text: '' },
  retrievedUserByEmailId: '',
  managing: null,
  abilities: {
    options: [],
    searchText: '',
    items: [],
    lastSelectItem: {},
  },
  abilitiesRaw: [],
  projectManagers: {
    options: [],
    searchText: '',
    items: [],
    lastSelectItem: {},
  },
  catTools: {
    items: {},
  },
  tfaDataUrl: '',
});
const userService = new UserService();
const abilityService = new AbilityService();

export default {
  mixins: [entityEditMixin, ssoSettingsMixin],
  components: {
    CatToolMultiSelect,
    PtsEmailInput,
    CompanyAjaxBasicSelect,
    UserGroupsSelection,
    UserRolesSelection,
    UserStaffDetails,
    UserVendorDetails,
    UserContactDetails,
    LanguageCombinationSelector,
    UserStatusDetails,
    SecurityPolicy,
    Password,
    SimpleBasicSelect,
    SiConnectorDetails,
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.initUserEditPage();
  },
  mounted() {
    this.setCollapsed(true);
  },
  watch: {
    securityPolicy(newSecurityPolicy) {
      this.user.securityPolicy = newSecurityPolicy;
    },
    'user.isOverwritten'(isOverwritten) {
      this.useExistingSecurityPolicies = !isOverwritten;
    },
    useExistingSecurityPolicies(isChecked) {
      const securityPolicy = _.get(this.companySelected, 'securityPolicy', null);
      const isValidSecurityPolicy = !_.isNil(securityPolicy)
        && Object.keys(securityPolicy).every((key) => !_.isNil(_.get(securityPolicy, key)));
      this.user.isOverwritten = !isChecked;
      if (isChecked) {
        if (isValidSecurityPolicy && this.isContact) {
          this.user.securityPolicy = { ...securityPolicy };
        } else {
          this.user.securityPolicy = { ...this.lsp.securityPolicy };
        }
      }
    },
    'projectManagers.items': function (newProjectManagers) {
      this.user.projectManagers = newProjectManagers;
    },
    'abilities.items': function (newAbilities) {
      this.user.abilities = newAbilities;
    },
    isUserWithNoEmail: function (isUserWithNoEmail) {
      if (isUserWithNoEmail) {
        this.user.password = '';
      }
    },
    'user.email': function (newValue) {
      if (!this.isEmailDirty && newValue !== '') {
        this.isEmailDirty = true;
      }
    },
    'user.type': function (newValue) {
      this.userType = newValue ? toOptionFormat(newValue) : {
        value: '',
        text: '',
      };
      this._afterUserTypeChange(newValue);
    },
    'user.terminated': function (newValue) {
      if (newValue) {
        this.user.vendorDetails.turnOffOffers = true;
      }
    },
    // This flag controls if notifications of any type are sent for the user.
    //  For now the default value is 'all', but this could change,
    // that's why we are managing it with an array
    'user.inactiveNotifications': function (newValue) {
      this.inactiveNotifications = !_.isEmpty(newValue);
    },
    inactiveNotifications: function (newValue) {
      if (newValue) {
        this.$set(this.user, 'inactiveNotifications', [newValue]);
      } else {
        this.$set(this.user, 'inactiveNotifications', []);
      }
    },
    isSSOEnabled(newValue) {
      if (newValue && this.user.forcePasswordChange) {
        this.user.forcePasswordChange = false;
      }
    },
  },
  computed: {
    ...mapGetters('authorization', ['roles', 'groups']),
    ...mapGetters('app', ['lsp', 'userLogged']),
    entityName() {
      return 'user';
    },
    showUser() {
      return !this.showRoles && !this.showGroups && !this.showFileUpload;
    },
    implicitRoles: function () {
      let implicitRoles = [];
      if (this.user.groups) {
        this.user.groups.forEach((g) => {
          const groupsFound = this.groups.filter((gr) => gr.name === g.name);
          if (groupsFound.length) {
            implicitRoles = implicitRoles.concat(groupsFound[0].roles);
          }
        });
      }
      return implicitRoles;
    },
    emailErrorMessage() {
      if (this.isEmailDirty && !this.isValidEmail) {
        return EMAIL_VALIDATION_ERROR;
      }
      if ((!_.isEmpty(this.retrievedUserByEmailId) &&
        this.retrievedUserByEmailId !== this.user._id)) {
        return 'Duplicated User Email';
      }
      return '';
    },
    secondaryEmailErrorMessage() {
      if (!this.isValidSecondaryEmail) {
        return EMAIL_VALIDATION_ERROR;
      }
      if (this.user.email === this.user.secondaryEmail) {
        return 'Secondary email should be different from the main one';
      }
      return '';
    },
    hasSecondaryEmailError() {
      return !_.isEmpty(this.secondaryEmailErrorMessage);
    },
    hasEmailError() {
      return !_.isEmpty(this.emailErrorMessage);
    },
    showEmailErrorBorder() {
      return this.isEmailDirty && !_.isEmpty(this.emailErrorMessage);
    },
    canEditMonthlyApiQuota() {
      return !hasRole(this.userLogged, 'MONTHLY-API-QUOTA_UPDATE_ALL');
    },
    showMonthlyApiQuota() {
      return hasRole(this.userLogged, 'MONTHLY-API-QUOTA_READ_ALL');
    },
    isMonthlyApiQuotaIncorrect() {
      return !/^[0-9]+$/.test(this.user.monthlyApiQuota);
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL') || hasRole(this.userLogged, 'CONTACT_CREATE_ALL');
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'USER_UPDATE_ALL') || hasRole(this.userLogged, 'CONTACT_UPDATE_ALL');
    },
    canDelete: function () {
      return hasRole(this.userLogged, 'USER_DELETE_ALL');
    },
    canCreateStaff: function () {
      return hasRole(this.userLogged, 'STAFF_CREATE_ALL') || hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canCreateVendor: function () {
      return hasRole(this.userLogged, 'VENDOR_CREATE_ALL') || hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canCreateContact: function () {
      return hasRole(this.userLogged, 'CONTACT_CREATE_ALL') || hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canUpdateStaff: function () {
      return hasRole(this.userLogged, { oneOf: ['STAFF_UPDATE_ALL', 'USER_UPDATE_ALL'] });
    },
    canUpdateVendor: function () {
      return hasRole(this.userLogged, { oneOf: ['VENDOR_UPDATE_ALL', 'USER_UPDATE_ALL'] });
    },
    canUpdateContact: function () {
      return hasRole(this.userLogged, { oneOf: ['CONTACT_UPDATE_ALL', 'USER_UPDATE_ALL'] });
    },
    canCreateStaffType: function () {
      return hasRole(this.userLogged, 'STAFF_CREATE_ALL') && this.user.type === STAFF_USER_TYPE;
    },
    canCreateVendorType: function () {
      return hasRole(this.userLogged, 'VENDOR_CREATE_ALL') && this.user.type === VENDOR_USER_TYPE;
    },
    canCreateContactType: function () {
      return hasRole(this.userLogged, 'CONTACT_CREATE_ALL') && this.user.type === CONTACT_USER_TYPE;
    },
    canCreateStaffVendor: function () {
      return this.canCreateStaffType || this.canCreateVendorType;
    },
    canManageAbilities: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canManageLanguages: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canManageCatTool: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canManageProjectManagers: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canCreateOrEditAll: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL') || hasRole(this.userLogged, 'USER_UPDATE_ALL');
    },
    readOnly() {
      return !this.isNew
        && !(this.canCreateOrEditAll
          || this.canCreateStaffVendor
          || this.canCreateContactType
          || this.canEditOwnCompany);
    },
    canEditOwnCompany() {
      return hasRole(this.userLogged, 'USER_UPDATE_COMPANY');
    },
    canReadCompany: function () {
      return hasRole(this.userLogged, 'COMPANY_READ_ALL');
    },
    canCreateCompany: function () {
      return hasRole(this.userLogged, 'COMPANY_CREATE_ALL');
    },
    canEditCompany: function () {
      return hasRole(this.userLogged, 'COMPANY_UPDATE_ALL');
    },
    canEditRoles: function () {
      return hasRole(this.userLogged, 'ROLE_READ_ALL');
    },
    canEditGroups: function () {
      return hasRole(this.userLogged, 'GROUP_READ_ALL');
    },
    canEditEmail: function () {
      return this.isNew || hasRole(this.userLogged, 'USER-EMAIL_UPDATE_ALL');
    },
    canReadFiles: function () {
      return (this.isStaff || this.isVendor) && hasRole(this.userLogged, 'STAFF-FILE-MANAGEMENT_UPDATE_ALL');
    },
    cancelText: function () {
      return this.readOnly ? 'Exit' : 'Cancel';
    },
    canSetup2FA() {
      return !this.isNew && this.canEdit;
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isUserWithNoEmail: function () {
      return (!this.user.email || this.user.email === '') && this.user.type === CONTACT_USER_TYPE;
    },
    isNew() {
      const userId = _.get(this, 'user._id', '');
      return _.isEmpty(userId);
    },
    validEmail: function () {
      const emailValidationError = this.entityValidationErrors.find((e) => e.props.email);
      return emailValidationError === undefined;
    },
    isValidType: function () {
      const typeValidationError = this.entityValidationErrors.find((e) => e.props.type);
      return typeValidationError === undefined;
    },
    isValidCompany: function () {
      const companyValidationError = this.entityValidationErrors.find((e) => e.props.company);
      return companyValidationError === undefined;
    },
    isValidProjectManager: function () {
      const pmValidationError = this.entityValidationErrors.find((e) => e.props.projectManagers);
      return pmValidationError === undefined;
    },
    entityValidationErrors() {
      if (this.showUser) {
        // Execute validator only when showing the user view.
        // The groups or roles view will not trigger the validator.
        // Adding flag to avoid validating password if not necessary
        return findUserValidationError(this.user);
      }
      return [];
    },
    hasUserType() {
      return this.isContact || this.isStaff || this.isVendor;
    },
    isValid() {
      if (!this.isValidSecurityPolicy) {
        return false;
      }
      if (!this.showUser) return true;
      if (
        this.canEditEmail &&
        (!this.isValidEmail || this.hasEmailError || this.hasSecondaryEmailError)
      ) {
        return false;
      }
      const hasFormErrors = !_.isEmpty(this.entityValidationErrors) ||
        (_.get(this, 'errors.items.length', 0) > 0) ||
        !this.isValidPassword;
      if (this.isStaff) {
        if (!this.isValidStaff) {
          return false;
        }
      }
      if (this.isVendor) {
        if (!this.isValidVendor) {
          return false;
        }
      }
      if (this.isContact) {
        if (!this.isValidContact) {
          return false;
        }
      }
      if (this.isMonthlyApiQuotaIncorrect) {
        return false;
      }
      return !hasFormErrors;
    },
    canCreateOrEdit: function () {
      const canCreate = this.canCreate
        || (this.isStaff && this.canCreateStaff)
        || (this.isVendor && this.canCreateVendor)
        || (this.isContact && this.canCreateContact);
      return this.canEdit || (this.isNew && canCreate);
    },
    loadingGroups: function () {
      return this.groups.length === 0;
    },
    loadingRoles: function () {
      return this.roles.length === 0;
    },
    hasImplicitRoles: function () {
      return this.implicitRoles.length !== 0;
    },
    isStaff: function () {
      return this.user.type === 'Staff';
    },
    isVendor: function () {
      return this.user.type === 'Vendor';
    },
    isContact: function () {
      return this.user.type === 'Contact';
    },
    activitiesFilter() {
      return JSON.stringify({ users: `${this.user.firstName} ${this.user.lastName}` });
    },
    activitiesLink() {
      return `activities?${jsonToUrlParam({ filter: this.activitiesFilter })}`;
    },
    vendorMinimumChargeFilter() {
      return JSON.stringify({ vendorName: `${this.user.firstName} ${this.user.lastName}` });
    },
    vendorMinimumChargeLink() {
      return `vendor-minimum-charge?${jsonToUrlParam({ filter: this.vendorMinimumChargeFilter })}`;
    },
    selectedCompany() {
      return {
        text: this.companyHierarchy,
        value: _.get(this.user, 'company._id', ''),
      };
    },
    companyHierarchy() {
      const company = _.get(this.user, 'company');
      if (_.isEmpty(company.hierarchy)) {
        return company.name;
      }
      return company.hierarchy;
    },
    is2FAEnabled() {
      return _.get(this, 'user.useTwoFactorAuthentification', false);
    },
    isSSOEnabled() {
      return _.get(this, 'companySelected.ssoSettings.isSSOEnabled', false);
    },
    userMonthlyConsumedQuota() {
      return _.get(this.user, 'monthlyConsumedQuota', 0);
    },
    userLastApiRequestedAt() {
      return this.isNew ? null : _.get(this.user, 'lastApiRequestedAt');
    },
  },
  methods: {
    ...mapActions('authorization', ['retrieveGroups', 'retrieveRoles']),
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('sideBar', ['setCollapsed']),
    ...mapActions('app', ['logout', 'setLsp']),
    ...mapActions('form', ['clearFormState']),
    setMockData() {
      const routeQuery = _.get(this, '$route.query');
      const mockData = [];
      if (!_.isEmpty(routeQuery)) {
        Object.keys(routeQuery).forEach((queryParam) => {
          if (queryParam.match('mock')) {
            mockData.push({
              name: queryParam,
              value: routeQuery[queryParam],
            });
          }
        });
        this.user.mockData = mockData;
      }
    },
    onValidPasswordUpdate(isValid) {
      this.isValidPassword = isValid || !_.isNil(this.user.email.match('@sample.com'));
    },
    getUserIdByEmail: _.debounce(function () {
      userService.getUserIdByEmail(this.user.email)
        .then((response) => {
          this.retrievedUserByEmailId = response.data.userId;
        }).catch(() => {
          this.retrievedUserByEmailId = '';
        });
    }, ONE_SECOND),
    _service() {
      return userService;
    },
    _handleRetrieve(response) {
      const retrievedUser = response.data.user;
      this._afterEntityRetrieve(retrievedUser);
      this.userFromDb = _.cloneDeep(this.user);
    },
    _refreshEntity(freshEntity) {
      this._afterEntityRetrieve(freshEntity);
    },
    _handleEditResponse(response) {
      const responseEntity = response.data.user;
      this.shouldCollapseAllRates = true;
      this._afterEntityRetrieve(responseEntity);
      this.userFromDb = _.cloneDeep(this.user);
    },
    async _handleCreate(response) {
      const { path } = this.$route;
      const userId = _.get(response, 'data.user._id', '');
      if (!_.isEmpty(userId)) {
        await this.$router.replace({
          name: 'user-edition',
          params: { entityId: userId },
        });
        this.clearFormState({ path });
      }
    },
    _pickFormData() {
      return _.pick(this, ['user', 'abilities']);
    },
    _editErrorHandlers(err) {
      const code = _.get(err, 'status.code');
      const data = _.get(err, 'status.data');
      if (code === 409 && !data._id) {
        return () => {
          const notification = {
            title: 'Error',
            message: _.get(err, 'message', `A user with the email ${this.user.email} already exists`),
            state: 'warning',
            response: err,
          };
          this.pushNotification(notification);
        };
      }
    },
    _afterEntityRetrieve(user) {
      user.oldEmail = user.email !== null ? user.email : '';
      user.company = user.company || '';
      this.userType = (user.type ? toOptionFormat(user.type) : this.userType) || '';
      this.projectManagers.items = user.projectManagers || [];
      if (user.abilities && user.abilities.length) {
        this.abilities.items = user.abilities.map((a) => ({
          value: a,
          text: a,
        }));
      } else {
        this.abilities.items = [];
      }
      this.catTools.items = user.catTools ? user.catTools.map((c) => ({ value: c, text: c })) : [];
      if (user.type === 'Contact') {
        if (user.contactDetails && !user.contactDetails.salesRep) {
          user.contactDetails.salesRep = {
            _id: '',
            firstName: '',
            lastName: '',
            deleted: false,
            terminated: false,
          };
        }
        if (user.contactDetails && !user.contactDetails.leadSource) {
          user.contactDetails.leadSource = {};
        }
        this._setDefaultContactDetails();
        if (_.isNil(user.preferences)) {
          user.preferences = {
            preferredLanguageCombination: '',
          };
        }
      } else if (user.type === 'Vendor') {
        if (user.vendorDetails) {
          user.vendorDetails = _.merge({}, defaultVendorDetails(), user.vendorDetails);
        } else {
          user.vendorDetails = defaultVendorDetails();
        }
      } else if (user.type === 'Staff') {
        if (user.staffDetails) {
          user.staffDetails = _.merge({}, defaultStaffDetails(), user.staffDetails);
        } else {
          user.staffDetails = defaultStaffDetails();
        }
      }
      user.readDate = user.updatedAt;
      user.languageCombinations =
        user.languageCombinations.map(combination => ({ text: combination }));
      this.$set(this, 'user', user);
    },
    onEmailValidation(isValidEmail) {
      this.isValidEmail = isValidEmail;
      if (isValidEmail) {
        this.getUserIdByEmail();
      }
    },
    onSecondaryEmailValidation(isValidEmail) {
      this.isValidSecondaryEmail = isValidEmail;
    },
    onSecurityPolicyValidation(isValid) {
      this.isValidSecurityPolicy = isValid;
    },
    async onCompanySelected(selectedCompany) {
      if (!_.isEmpty(selectedCompany) &&
        !_.get(selectedCompany, 'areSsoSettingsOverwritten', false)
      ) {
        selectedCompany.ssoSettings = await this.getSsoSettings(selectedCompany);
      }
      this.user.company = selectedCompany;
      this.companySelected = selectedCompany;
      const securityPolicy = _.get(this, 'companySelected.securityPolicy');
      if (!_.isNil(securityPolicy) && this.useExistingSecurityPolicies) {
        this.user.securityPolicy = securityPolicy;
      }
    },
    manageRoles() {
      this.showRoles = true;
    },
    manageGroups() {
      this.showGroups = true;
    },
    manageLeadSource() {
      this.$emit('lead-source-manage');
    },
    manageAbility() {
      this.$emit('ability-manage');
    },
    manageLanguage() {
      this.$emit('language-manage');
    },
    manageCatTool() {
      this.$emit('cat-tool-manage');
    },
    manageProjectManagers() {
      this.$emit('user-manage');
    },
    manageInternalDepartments() {
      this.$emit('internal-department-manage');
    },
    manageCompetenceLevels() {
      this.$emit('competence-level-manage');
    },
    manageActivity(event) {
      event.preventDefault();
      this.$emit('activity-manage', { filter: this.activitiesFilter });
    },
    manageCompany() {
      this.$emit('company-manage');
    },
    managePaymentMethods() {
      this.$emit('payment-method-manage');
    },
    manageBillingTerms() {
      this.$emit('billing-term-manage');
    },
    manageTaxForms() {
      this.$emit('tax-form-manage');
    },
    manageBreakdowns() {
      this.$emit('breakdown-manage');
    },
    manageTranslationUnits() {
      this.$emit('translation-unit-manage');
    },
    manageCurrencies() {
      this.$emit('currency-manage');
    },
    // Events triggered from rates grid included in user-staff-details and user-vendor-details
    manageRateEntity(eventName) {
      this.$emit(eventName);
    },
    manageRequest(query) {
      this.$emit('request-manage', query);
    },
    manageVendorMinimumCharge() {
      this.$emit('vendor-minimum-charge-manage', { filter: this.vendorMinimumChargeFilter });
    },
    uploadFile() {
      this.showFileUpload = true;
    },
    save() {
      if (this.showRoles || this.showGroups || this.showFileUpload) {
        // if managing roles or groups, just switch back to the user
        this.showRoles = false;
        this.showGroups = false;
        this.showFileUpload = false;
      } else {
        this.$validator.validateAll().then((result) => {
          if (result && this.isValid) {
            const modifications = getUserModifications(this.user, this.userFromDb);
            this.setMockData();
            const user = this._prepareUser();
            this.shouldCollapseAllRates = false;
            this._save({ ...user, modifications });
          }
        });
      }
    },
    updateRolesInformation(roleData) {
      this.user.roles = roleData;
    },
    updateGroupsInformation(groupData) {
      this.user.groups = groupData;
    },
    isImplicitRole(role) {
      return this.implicitRoles.indexOf(role) >= 0;
    },
    findRemovedRoles(newGroups, oldGroups) {
      const deletedGroups = oldGroups
        .filter((g) => newGroups.filter((gr) => g === gr).length === 0);
      const deletedRoles = this.groups
        .filter((g) => deletedGroups.indexOf(g.name) >= 0).map((g) => g.roles);
      const availableRoles = newGroups
        .filter((g) => deletedGroups.indexOf(g.name) === -1).map((g) => g.roles);
      const difference = _.difference(deletedRoles, availableRoles);
      if (difference.length) {
        return difference[0];
      }
      return difference;
    },
    onRolesChange(roles) {
      this.user.roles = roles;
    },
    retrieveProjectManagers() {
      userService.retrieveProjectManagers().then((response) => {
        const users = response.data.list || [];
        this.projectManagers.options = [];
        users.forEach((u) => {
          const changedItem = _.find(this.projectManagers.items, { value: u._id });
          if (changedItem) {
            const i = this.projectManagers.items.indexOf(changedItem);
            this.projectManagers.items[i] = ({ value: u._id, text: `${u.firstName} ${u.lastName}` });
          }
          this.projectManagers.options.push({ value: u._id, text: `${u.firstName} ${u.lastName}` });
        });
      });
    },
    retrieveAbilities() {
      abilityService.retrieve().then((response) => {
        this.abilities.options = [];
        const abilityList = _.get(response, 'data.list', []);
        this.abilitiesRaw = abilityList;
        _.forEach(abilityList, (a) => {
          const changedItem = _.find(this.abilities.items, { name: a.name });
          if (changedItem) {
            const i = this.abilities.items.indexOf(changedItem);
            this.abilities.items[i] = ({ value: a.name, text: a.name, name: a.name });
          }
          this.abilities.options.push({ value: a.name, text: a.name, name: a.name });
        });
      });
    },
    initUserEditPage() {
      if (this.isNew) {
        Object.assign(this.user.securityPolicy, this.lsp.securityPolicy);
      }
      this.retrieveGroups();
      this.retrieveRoles();
      this.retrieveProjectManagers();
      this.retrieveAbilities();
      this._loadUserTypes();
    },
    _loadUserTypes() {
      this.userTypes = Object.keys(userService.userTypes)
        .filter((t) => this[`canCreate${capitalizeFirstLetter(t)}`] || this[`canUpdate${capitalizeFirstLetter(t)}`])
        .map(capitalizeFirstLetter);
    },
    _prepareUser() {
      const user = _.cloneDeep(this.user);
      let hireDateText = '';
      let salesRepText = '';
      let mainPhoneText = '';
      let certifications = [];
      let nationalityText = '';
      let minimumHoursText = '';
      let internalDepartments = [];
      const taxFormText = _.get(user, 'vendorDetails.billingInformation.taxForm', [])
        .map((t) => t.name).join(', ');
      if (_.isNil(user.company)) {
        delete user.company;
      } else {
        user.company = this.user.company._id;
      }
      user.projectManagers = _.isArray(user.projectManagers)
        ? user.projectManagers.map((pm) => pm.value)
        : [];
      user.abilities = _.isArray(user.abilities) ? user.abilities.map((a) => a.text) : [];
      user.catTools = _.isArray(user.catTools) ? user.catTools : [];
      if (typeof user._id === 'undefined') {
        // clear not needed props
        delete user.oldEmail;
      }
      if (this.isContact) {
        delete user.staffDetails;
        delete user.vendorDetails;
        if (user.contactDetails.mailingAddress) {
          user.contactDetails.mailingAddress = transformAddressInformation(user.contactDetails.mailingAddress);
        }
        if (user.contactDetails.billingAddress) {
          user.contactDetails.billingAddress = transformAddressInformation(user.contactDetails.billingAddress);
        }
        if (!user.contactDetails.salesRep || !user.contactDetails.salesRep._id) {
          delete user.contactDetails.salesRep;
        }
        if (!user.contactDetails.leadSource || !user.contactDetails.leadSource._id) {
          delete user.contactDetails.leadSource;
        }

        mainPhoneText = _.get(user, 'contactDetails.mainPhone.number', '')
          + _.get(user, 'contactDetails.mainPhone.ext', '');
        salesRepText = `${_.get(user, 'contactDetails.salesRep.firstName')} ${_.get(user, 'contactDetails.salesRep.lastName')}`;
      }
      if (this.isVendor) {
        if (user.vendorDetails.address) {
          user.vendorDetails.address = transformAddressInformation(user.vendorDetails.address);
        }
        if (!user.vendorDetails.nationality) {
          delete user.vendorDetails.nationality;
        }
        if (user.vendorDetails.billingInformation
          && user.vendorDetails.billingInformation.taxForm) {
          user.vendorDetails.billingInformation.taxForm = user.vendorDetails.billingInformation.taxForm.map((tf) => tf._id);
        }
        this.user.vendorDetails.registrationCountries =
          this.user.vendorDetails.registrationCountries.map(country => country._id);
        delete user.staffDetails;
        delete user.contactDetails;

        certifications = _.get(user, 'vendorDetails.certifications', []);
        nationalityText = _.get(user, 'vendorDetails.nationality.name', '');
        internalDepartments = _.get(user, 'vendorDetails.internalDepartments', []);
        hireDateText = moment(user.vendorDetails.hireDate).format('MM-DD-YYYY');
        if (user.vendorDetails.minimumHours != null) {
          minimumHoursText = user.vendorDetails.minimumHours.toString();
        }
        delete user.vendorDetails.rates;
      }
      if (this.isStaff) {
        delete user.vendorDetails;
        delete user.contactDetails;

        internalDepartments = _.get(user, 'staffDetails.internalDepartments', []);
        hireDateText = moment(user.staffDetails.hireDate).format('MM-DD-YYYY');
        if (_.get(user, 'staffDetails.rates')) {
          user.staffDetails.rates = [];
        }
      }
      if (user.oldEmail === null) {
        // avoid sendint null
        delete user.oldEmail;
      }
      if (_.get(user, 'contactDetails.contactStatus') === '') {
        // empty string is not a valid contactStatus value
        delete user.contactDetails.contactStatus;
      }

      const userDoc = _.extend(user, {
        taxFormText,
        salesRepText,
        hireDateText,
        mainPhoneText,
        nationalityText,
        minimumHoursText,
        leadSourceText: _.get(user, 'contactDetails.leadSource.name', ''),
        languageCombinations: _.get(user, 'languageCombinations', []).map(combination => combination.text),
      });
      if (internalDepartments.some((i) => _.has(i, '_id'))) {
        userDoc.internalDepartmentsText = internalDepartments.map((i) => i.name).join(', ');
      }
      if (certifications.some((i) => _.has(i, '_id'))) {
        userDoc.certificationsText = certifications.map((c) => c.name).join(', ');
      }
      return userDoc;
    },
    _prepareUserBreadcrumb() {
      const user = { ...this.user };
      user.customer = user.customer ? user.customer._id : '';
      user.projectManagers = _.isArray(user.projectManagers)
        ? user.projectManagers.map((pm) => pm.value)
        : [];
      user.abilities = _.isArray(user.abilities) ? user.abilities.map((a) => a.text) : [];
      user.catTools = _.isArray(user.catTools) ? user.catTools : [];
      if (typeof user._id === 'undefined') {
        // clear not needed props
        delete user.oldEmail;
      }
      return user;
    },
    onSelectUserType(newUserType) {
      if (!_.isEmpty(newUserType)) {
        this.$set(this.user, 'type', newUserType.text);
      }
    },
    onSelectProjectManager(items, lastSelectItem) {
      this.projectManagers.items = items;
      this.projectManagers.lastSelectItem = lastSelectItem;
    },
    onSelectAbilities(items, lastSelectItem) {
      this.abilities.items = items;
      this.abilities.lastSelectItem = lastSelectItem;
    },
    onSelectCatTool(items, lastSelectItem) {
      this.catTools.items = items;
      this.catTools.lastSelectItem = lastSelectItem;
    },
    _afterUserTypeChange(newValue) {
      if (newValue === CONTACT_USER_TYPE) {
        this._setDefaultContactDetails();
      }
      if (newValue === VENDOR_USER_TYPE) {
        this._setDefaultVendorDetails();
      }
      if (newValue === STAFF_USER_TYPE) {
        this._setDefaultStaffDetails();
      }
    },
    _setDefaultContactDetails() {
      if (!this.user.contactDetails) {
        this.user.contactDetails = defaultContactDetails();
      }
    },
    _setDefaultVendorDetails() {
      if (!this.user.vendorDetails) {
        this.$set(this.user, 'vendorDetails', defaultVendorDetails());
      }
      if (this.user.staffDetails) {
        // When changing a user type from staff to vendor, make sure to keep
        // common details
        setStaffVendorCommonProps(this.user.vendorDetails, this.user.staffDetails);
      }
    },
    _setDefaultStaffDetails() {
      if (!this.user.staffDetails) {
        this.user.staffDetails = defaultStaffDetails();
      }
      if (this.user.vendorDetails) {
        setStaffVendorCommonProps(this.user.staffDetails, this.user.vendorDetails);
      }
    },
    onVendorValidate(isValidVendor) {
      this.$set(this, 'isValidVendor', isValidVendor);
    },
    getUpdatedVendorDetails() {
      if (this.user.terminated) {
        this.user.vendorDetails.turnOffOffers = true;
      }
    },
    onStaffValidate(isValidStaff) {
      this.$set(this, 'isValidStaff', isValidStaff);
    },
    onContactValidate(isValidContact) {
      this.isValidContact = isValidContact;
    },
    onStatusChanged(path, value) {
      _.set(this.user, path, value);
    },
    onIsApiUserChange(isApiUser) {
      this.user.isApiUser = isApiUser;
      if (this.isSSOEnabled && !isApiUser) {
        this.user.forcePasswordChange = false;
      }
    },
    onPreferredLanguageCombinationChange(preferredLanguageCombination) {
      this.user.preferences.preferredLanguageCombination = preferredLanguageCombination;
    },
  },
};
