import _ from 'lodash';
import Vue from 'vue';
import userResource from '../resources/user';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';
import { isEmail } from '../utils/form';

const OVERRIDED_DEFAULT_COLUMNS = [{
  prop: 'createdAt',
  type: 'dateRange',
}];

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Email', type: 'string', prop: 'email', visible: true,
  },
  {
    name: 'First Name',
    type: 'string',
    prop: 'firstName',
    visible: true,
  },
  {
    name: 'Last Name', type: 'string', prop: 'lastName', visible: true,
  },
  {
    name: 'Roles',
    prop: 'rolesText',
    type: 'longtext',
    maxChars: 40,
    visible: true,
  },
  {
    name: 'User Type', type: 'string', prop: 'typeName', visible: true,
  },
  {
    name: 'Company',
    type: 'string',
    prop: 'companyName',
    visible: true,
  },
  {
    name: 'Using Default Policies', type: 'string', prop: 'isOverwrittenText', visible: true,
  },
  {
    name: 'Project Managers',
    type: 'string',
    prop: 'pmNames',
    visible: true,
  },
  {
    name: 'Abilities',
    type: 'string',
    prop: 'abilitiesText',
    visible: true,
  },
  {
    name: 'Remote',
    type: 'string',
    prop: 'remoteText',
    visible: false,
  },
  {
    name: 'Tools',
    type: 'string',
    prop: 'catToolsText',
    visible: true,
  },
  {
    name: 'Languages',
    type: 'longtext',
    prop: 'languageCombinationsText',
    visible: true,
  },
  {
    name: 'Groups',
    type: 'string',
    prop: 'groupsText',
    visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'inactiveText', visible: true,
  },
  {
    name: 'Terminated', type: 'string', prop: 'terminatedText', visible: true,
  },
  {
    name: 'Terminated At',
    prop: 'terminatedAt',
    type: 'string',
    visible: false,
  },
  {
    name: 'Locked', type: 'string', prop: 'isLockedText', visible: true,
  },
  {
    name: 'Last Login At',
    prop: 'lastLoginAt',
    type: 'string',
    visible: true,
  },
  {
    name: 'Password Change Date',
    prop: 'passwordChangeDate',
    type: 'string',
    visible: true,
  },
  {
    name: 'OFAC',
    type: 'string',
    prop: 'vendorDetails.ofac',
    val: (item) => _.get(item, 'vendorDetails.ofac', ''),
    visible: false,
  },
  {
    name: 'Form 1099 Box',
    type: 'string',
    prop: 'form1099Box',
    visible: false,
  },
  {
    name: 'Synced',
    type: 'string',
    prop: 'isSyncedText',
    val: (item) => _.defaultTo(item.isSyncedText, false),
    visible: true,
  },
  {
    name: 'Sync Error',
    type: 'string',
    prop: 'siConnector.error',
    visible: false,
    val: (item) => _.get(item, 'siConnector.error', ''),
  },
  {
    name: 'Last Sync Date',
    type: 'date',
    prop: 'siConnector.connectorEndedAt',
    visible: false,
    val: (item) => _.get(item, 'siConnector.connectorEndedAt', ''),
  },
  {
    name: 'Form 1099 Type',
    type: 'string',
    prop: 'form1099Type',
    visible: false,
  },
  {
    name: 'Certifications',
    type: 'string',
    prop: 'certificationsText',
    visible: false,
  },
  {
    name: 'HIPAA', type: 'string', prop: 'hipaaText', visible: false,
  },
  {
    name: 'ATA Certified', type: 'string', prop: 'ataCertifiedText', visible: false,
  },
  {
    name: 'Gender',
    type: 'string',
    prop: 'vendorDetails.gender',
    val: (item) => _.get(item, 'vendorDetails.gender', ''),
    visible: false,
  },
  {
    name: 'Minimum Hours',
    type: 'number',
    prop: 'minimumHoursText',
    visible: false,
  },
  {
    name: 'Escalated',
    type: 'string',
    prop: 'escalatedText',
    visible: false,
  },
  {
    name: 'Main Phone',
    type: 'string',
    prop: 'mainPhoneText',
    visible: false,
  },
  {
    name: 'Comments',
    type: 'string',
    prop: 'staffDetails.comments',
    val: (item) => _.get(item, 'staffDetails.comments', ''),
    visible: false,
  },
  {
    name: 'Vendor Company',
    type: 'string',
    prop: 'vendorDetails.vendorCompany',
    val: (item) => _.get(item, 'vendorDetails.vendorCompany', ''),
    visible: false,
  },
  {
    name: 'Competence Levels',
    type: 'string',
    prop: 'competenceLevelsText',
    visible: false,
  },
  {
    name: 'LSP Internal Departments',
    type: 'string',
    prop: 'internalDepartmentsText',
    visible: false,
  },
  {
    name: 'Phone Number',
    type: 'string',
    prop: 'phoneNumberText',
    visible: false,
  },
  {
    name: 'Address 1',
    type: 'string',
    prop: 'vendorDetails.address.line1',
    val: (item) => _.get(item, 'vendorDetails.address.line1', ''),
    visible: false,
  },
  {
    name: 'City',
    type: 'string',
    prop: 'vendorDetails.address.city',
    val: (item) => _.get(item, 'vendorDetails.address.city', ''),
    visible: false,
  },
  {
    name: 'State',
    type: 'string',
    prop: 'vendorDetails.address.state.name',
    val: (item) => _.get(item, 'vendorDetails.address.state.name', ''),
    visible: false,
  },
  {
    name: 'Zip',
    type: 'string',
    prop: 'vendorDetails.address.zip',
    val: (item) => _.get(item, 'vendorDetails.address.zip', ''),
    visible: false,
  },
  {
    name: 'Country',
    type: 'string',
    prop: 'vendorDetails.address.country.name',
    val: (item) => _.get(item, 'vendorDetails.address.country.name', ''),
    visible: false,
  },
  {
    name: 'Nationality',
    type: 'string',
    prop: 'nationalityText',
    visible: false,
  },
  {
    name: 'Country Of Origin',
    type: 'string',
    prop: 'vendorDetails.originCountry.name',
    val: (item) => _.get(item, 'vendorDetails.originCountry.name', ''),
    visible: false,
  },
  {
    name: 'Approval Method',
    type: 'string',
    prop: 'vendorDetails.approvalMethod',
    val: (item) => {
      if (item.type === 'Vendor') {
        return _.get(item, 'vendorDetails.approvalMethod', '');
      }
      return _.get(item, 'staffDetails.approvalMethod', '');
    },
    visible: false,
  },
  {
    name: 'Hire Date',
    type: 'string',
    prop: 'hireDateText',
    visible: false,
  },
  {
    name: 'Payment Method',
    type: 'string',
    prop: 'paymentMethodName',
    val: (item) => _.get(item, 'paymentMethodName', ''),
    visible: false,
  },
  {
    name: 'Fixed Cost',
    type: 'string',
    prop: 'fixedCostText',
    visible: false,
  },
  {
    name: 'PT Pay/Paypal/Veem',
    type: 'string',
    prop: 'vendorDetails.billingInformation.ptPayOrPayPal',
    val: (item) => _.get(item, 'vendorDetails.billingInformation.ptPayOrPayPal', ''),
    visible: false,
  },
  {
    name: 'WT Fee Waived',
    type: 'string',
    prop: 'wtFeeWaivedText',
    visible: false,
  },
  {
    name: 'Priority Pay',
    type: 'string',
    prop: 'priorityPaymentText',
    visible: false,
  },
  {
    name: 'Billing Terms',
    type: 'string',
    prop: 'billingTermsName',
    visible: false,
  },
  {
    name: 'Tax Form',
    type: 'string',
    prop: 'taxFormText',
    visible: false,
  },
  {
    name: 'Currency',
    type: 'string',
    prop: 'currencyName',
    visible: false,
  },
  {
    name: 'Bill Payment Notes',
    type: 'string',
    prop: 'vendorDetails.billingInformation.billPaymentNotes',
    val: (item) => _.get(item, 'vendorDetails.billingInformation.billPaymentNotes', ''),
    visible: false,
  },
  {
    name: 'Contact Status',
    type: 'string',
    prop: 'contactDetails.contactStatus',
    val: (item) => _.get(item, 'contactDetails.contactStatus', ''),
    visible: false,
  },
  {
    name: 'Vendor Type',
    type: 'string',
    prop: 'vendorDetails.type',
    visible: false,
  },
  {
    name: 'Vendor Status',
    type: 'string',
    prop: 'vendorDetails.vendorStatus',
    val: (item) => _.get(item, 'vendorDetails.vendorStatus', ''),
    visible: false,
  },
  {
    name: 'Qualification Status',
    type: 'string',
    prop: 'contactDetails.qualificationStatus',
    val: (item) => _.get(item, 'contactDetails.qualificationStatus', ''),
    visible: false,
  },
  {
    name: 'Job Title',
    type: 'string',
    prop: 'contactDetails.jobTitle',
    val: (item) => _.get(item, 'contactDetails.jobTitle', ''),
    visible: false,
  },
  {
    name: 'Sales Rep',
    type: 'string',
    prop: 'salesRepText',
    visible: false,
  },
  {
    name: 'Company Tier Level',
    type: 'string',
    prop: 'contactDetails.companyTierLevel',
    val: (item) => _.get(item, 'contactDetails.companyTierLevel', ''),
    visible: false,
  },
  {
    name: 'Lead Source',
    type: 'string',
    prop: 'leadSourceText',
    visible: false,
  },
  {
    name: 'Sync Error',
    type: 'string',
    prop: 'siConnector.error',
    visible: false,
    val: (item) => (_.get(item, 'siConnector.syncError', '')),
  },
  {
    name: 'Vendor Bill Balance',
    type: 'currency',
    prop: 'vendorDetails.billBalance',
    val: ({ vendorDetails = {} }) => vendorDetails.billBalance,
    visible: false,
  },
  {
    name: 'Vendor Debit Memo Available',
    type: 'currency',
    prop: 'vendorDetails.debitMemoAvailable',
    val: ({ vendorDetails = {} }) => vendorDetails.debitMemoAvailable,
    visible: false,
  },
  {
    name: 'Vendor Credit Memo Available',
    type: 'currency',
    prop: 'vendorDetails.creditMemoAvailable',
    val: ({ vendorDetails = {} }) => vendorDetails.creditMemoAvailable,
    visible: false,
  },
  {
    name: 'Vendor Total Balance',
    type: 'currency',
    prop: 'vendorDetails.totalBalance',
    val: ({ vendorDetails = {} }) => vendorDetails.totalBalance,
    visible: false,
  },
  {
    name: 'Flat Rate',
    type: 'string',
    prop: 'flatRateText',
    visible: true,
  },
  {
    name: 'Lawyer',
    type: 'boolean',
    prop: 'vendorDetails.isLawyer',
    visible: false,
  },
  {
    name: 'Practicing',
    type: 'boolean',
    prop: 'vendorDetails.isPracticing',
    visible: false,
  },
  {
    name: 'Bar Registered',
    type: 'boolean',
    prop: 'vendorDetails.isBarRegistered',
    visible: false,
  },
]);

const userTypes = {
  contact: 'Contact',
  staff: 'Staff',
  vendor: 'Vendor',
};

export default class UserService {
  constructor(resource = userResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
    OVERRIDED_DEFAULT_COLUMNS.forEach((colToOverride) => {
      const foundColumn = COLUMNS.find((col) => col.prop === colToOverride.prop);
      foundColumn.type = colToOverride.type;
    });
  }

  get userTypes() {
    return userTypes;
  }

  get columns() {
    return COLUMNS;
  }

  get(userId) {
    return resourceWrapper(this.resource.get({ id: userId, _id: userId }));
  }

  retrieve(params, columns) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params, columns }));
  }

  retrieveLean(query) {
    return resourceWrapper(this.resource.query(query));
  }

  retrieveProviders(params) {
    let paramsClone;
    if (params) {
      paramsClone = { ...params };
      Object.keys(paramsClone).forEach((key) => {
        if (paramsClone[key] === null || paramsClone[key] === undefined) {
          delete paramsClone[key];
        }
      });
    }
    return resourceWrapper(this.resource.query(paramsClone));
  }

  retrieveProjectManagers() {
    return resourceWrapper(this.resource.query({
      aggregate: false,
      informalType: 'projectManager',
      attributes: ['email', 'firstName', 'lastName'].join(' '),
    }));
  }

  getDocumentUrl(userId, documentId, filename) {
    return this.endpointBuilder(`user/${encodeURIComponent(userId)}/document/${encodeURIComponent(documentId)}/filename/${encodeURIComponent(filename)}`);
  }

  retrieveCsv() {
    return lspAwareUrl('user/export');
  }

  create(user) {
    return resourceWrapper(this.resource.save(user));
  }

  saveProfileImage(userId, image) {
    const url = this.endpointBuilder(`user/${userId}/image`);
    return resourceWrapper(Vue.http.put(url, { image }));
  }

  deleteProfileImage(userId) {
    const url = this.endpointBuilder(`user/${userId}/image`);
    return resourceWrapper(Vue.http.put(url));
  }

  updateUISettings(uiSettings) {
    return resourceWrapper(this.resource.update({ id: 'ui-settings' }, uiSettings));
  }

  edit(user) {
    return resourceWrapper(this.resource.update(user));
  }

  changePassword(newCredentials) {
    return resourceWrapper(this.resource.update({ id: 'password' }, newCredentials));
  }

  passwordExist(password) {
    return resourceWrapper(this.resource.update({ id: 'password-exist' }, password));
  }

  query(params) {
    return resourceWrapper(this.resource.query(params));
  }

  upload(userId, userFileType, formData) {
    const url = this.endpointBuilder(`user/${userId}/document/?fileType=${userFileType}`);
    return resourceWrapper(Vue.http.post(url, formData));
  }

  delete(userId, documentId) {
    const url = this.endpointBuilder(`user/${userId}/document/${documentId}`);
    return resourceWrapper(Vue.http.delete(url));
  }

  retrieveDataURL() {
    const url = this.endpointBuilder('user/2fa-data-url');
    return resourceWrapper(Vue.http.get(url));
  }

  toggle2FAState(credentials, action) {
    const url = this.endpointBuilder(`user/2fa-setup?action=${action}`);
    return resourceWrapper(Vue.http.post(url, credentials));
  }

  getVendorRateAverage(filters) {
    const customFilters = { averageVendorRate: 'average-vendor-rate', ...filters };
    return resourceWrapper(this.resource.query(customFilters));
  }

  getUserIdByEmail(email) {
    if (!isEmail(email)) return;
    const url = this.endpointBuilder(`user/email/${email}`);
    return resourceWrapper(Vue.http.get(url));
  }

  getVendorRates(userId) {
    const url = this.endpointBuilder(`user/${userId}/vendor-rates`);
    return resourceWrapper(Vue.http.get(url));
  }
  getVendorRatesWithDrafts(userId) {
    const url = this.endpointBuilder(`user/${userId}/vendor-rates?shouldDropDrafts=false`);
    return resourceWrapper(Vue.http.get(url));
  }
  getDuplicatedVendorRates(userId) {
    const url = this.endpointBuilder(`user/${userId}/duplicated-vendor-rates`);
    return resourceWrapper(Vue.http.get(url));
  }
  testRateIsDuplicate(userId, rate) {
    const url = this.endpointBuilder(`user/${userId}/test-rate-is-duplicate`);
    return resourceWrapper(Vue.http.post(url, rate));
  }
  saveVendorRate(userId, rate) {
    const url = this.endpointBuilder(`user/${userId}/vendor-rate`);
    return resourceWrapper(Vue.http.put(url, rate));
  }
  draftVendorRate(userId, rate) {
    const url = this.endpointBuilder(`user/${userId}/draft-vendor-rate`);
    return resourceWrapper(Vue.http.put(url, rate));
  }
  pasteVendorRates(userId, rates) {
    const url = this.endpointBuilder(`user/${userId}/paste-vendor-rates`);
    return resourceWrapper(Vue.http.put(url, rates));
  }
  deleteVendorRates(userId, rates) {
    const url = this.endpointBuilder(`user/${userId}/delete-vendor-rates`);
    return resourceWrapper(Vue.http.put(url, rates));
  }

  updateTimezone(timezone) {
    return resourceWrapper(Vue.http.put(lspAwareUrl('user/timezone'), { timezone }));
  }
}
