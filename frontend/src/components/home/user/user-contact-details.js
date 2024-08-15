import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { hasRole } from '../../../utils/user';
import { jsonToUrlParam } from '../../../utils/browser';
import { isValidAddress } from '../../../utils/form';
import LanguageService from '../../../services/language-service';
import AddressInformation from '../address/address-information.vue';
import CustomerTierLevelSelector from '../company/customer-tier-level-selector.vue';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import LeadSourceSelector from './lead-source-selector.vue';
import LanguageMultiSelect from '../../language-multi-select/language-multi-select.vue';
import LanguageSelect from '../../language-select/language-select.vue';
import PhoneInput from '../../form/phone-input.vue';
import PhoneExtInput from '../../form/phone-ext-input.vue';
import UrlInput from '../../form/url-input.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import PtsEmailInput from '../../form/pts-email-input.vue';
import user from '../../../resources/user';

const languageSetter = (val) => {
  if (_.isArray(val)) {
    return val.map((lang) => _.pick(lang, ['name', 'isoCode']));
  }
  return [_.pick(val, ['name', 'isoCode'])];
};
const languageService = new LanguageService();
const buildInitialState = () => ({
  billingSameAsMailing: false,
  isValidBillingEmail: false,
  previousBillingAddress: {
    line1: '',
    line2: '',
    city: '',
    state: {
      name: '',
      code: '',
      country: {
        name: '',
        code: '',
      },
    },
    country: {
      name: '',
      code: '',
    },
    zip: '',
  },
  contactDetails: {
    qualificationStatus: '',
    salesRep: {
      _id: null,
      firstName: null,
      lastName: null,
      deleted: false,
      terminated: false,
    },
    leadSource: {
      _id: '',
    },
    linkedInUrl: '',
    mainPhone: {
      number: '',
      ext: '',
    },
    mailingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: {
        name: '',
        code: '',
        country: {
          name: '',
          code: '',
        },
      },
      country: {
        name: '',
        code: '',
      },
      zip: '',
    },
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: {
        name: '',
        country: {
          name: '',
          code: '',
          country: '',
        },
      },
      country: {
        name: '',
        code: '',
      },
      zip: '',
    },
    billingEmail: '',
  },
  languages: [],
  preferredLanguages: {
    srcLangs: [],
    tgtLangs: [],
  },
});

export default {
  inject: ['$validator'],
  components: {
    AddressInformation,
    CustomerTierLevelSelector,
    UserAjaxBasicSelect,
    LeadSourceSelector,
    PhoneInput,
    PhoneExtInput,
    UrlInput,
    SimpleBasicSelect,
    LanguageMultiSelect,
    LanguageSelect,
    PtsEmailInput,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return buildInitialState();
  },
  watch: {
    value: {
      immediate: true,
      handler: function (newValue) {
        this.contactDetails = newValue;
      },
      deep: true,
    },
    contactDetails: {
      handler(newContactDetails) {
        this.$emit('input', newContactDetails);
        this.$emit('validate-contact', this.isValid);
      },
      deep: true,
    },
    billingSameAsMailing(newValue) {
      if (newValue) {
        this.previousBillingAddress = this.contactDetails.billingAddress;
        this.contactDetails.billingAddress = this.contactDetails.mailingAddress;
      } else {
        this.contactDetails.billingAddress = this.previousBillingAddress;
      }
    },
    preferredLanguages: {
      deep: true,
      handler() {
        this.setPreferredLanguages();
      },
    },
    'user.preferences.preferredLanguageCombination': {
      immediate: true,
      handler(preferredLanguageCombination) {
        this.preferredLanguages.srcLangs = _.get(preferredLanguageCombination, 'srcLangs', []);
        this.preferredLanguages.tgtLangs = _.get(preferredLanguageCombination, 'tgtLangs', []);
      },
    },
    isValid: {
      handler(isValid) {
        this.$emit('validate-contact', isValid);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    contactDetailsSalesRepSelected() {
      let selected;
      try {
        const id = this.contactDetails.salesRep._id;
        if (id) {
          selected = {
            text: `${_.get(this, 'contactDetails.salesRep.firstName', '')} ${_.get(this, 'contactDetails.salesRep.lastName', '')}`,
            value: _.get(this, 'company.salesRep._id'),
            deleted: _.get(this, 'company.salesRep.deleted'),
            terminated: _.get(this, 'company.salesRep.terminated'),
          };
        }
      } catch (e) {
        selected = { text: '', value: '' };
      }
      return selected;
    },
    contactDetailsSalesRepName() {
      if (this.contactDetails && this.contactDetails.salesRep
        && !_.isEmpty(this.contactDetails.salesRep)) {
        return `${_.get(this, 'contactDetails.salesRep.firstName', '')} ${_.get(this, 'contactDetails.salesRep.lastName', '')}`;
      }
      return '';
    },
    hasUserReadAccess() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },
    urlText: function () {
      return _.get(this, 'contactDetails.linkedInUrl', '');
    },
    salesRepName() {
      if (this.contactDetails.salesRep && this.contactDetails.salesRep._id) {
        return `${this.contactDetails.salesRep.firsName} ${this.contactDetails.salesRep.lastName}`;
      }
      return '';
    },
    leadSourceName() {
      if (this.contactDetails.leadSource && this.contactDetails.leadSource._id) {
        return this.contactDetails.leadSource.name;
      }
      return '';
    },
    requestFilter() {
      return JSON.stringify({ contactName: `${this.user.firstName} ${this.user.lastName}` });
    },
    requestsLink() {
      return `requests?${jsonToUrlParam({ filter: this.requestFilter })}`;
    },
    hasMultipleTargetLanguages() {
      return _.get(this, 'preferredLanguages.tgtLangs.length', 0) > 1;
    },
    hasMultipleSourceLanguages() {
      return _.get(this, 'preferredLanguages.srcLangs.length', 0) > 1;
    },
    srcLangs: {
      get() {
        if (this.hasMultipleTargetLanguages) {
          return _.get(this, 'preferredLanguages.srcLangs[0]', {});
        }
        return this.preferredLanguages.srcLangs;
      },
      set(value) {
        this.preferredLanguages.srcLangs = languageSetter(value);
      },
    },
    tgtLangs: {
      get() {
        if (this.hasMultipleSourceLanguages) {
          return _.get(this, 'preferredLanguages.tgtLangs[0]', {});
        }
        return this.preferredLanguages.tgtLangs;
      },
      set(value) {
        this.preferredLanguages.tgtLangs = languageSetter(value);
      },
    },
    isValid() {
      const { billingEmail = '' } = this.contactDetails;
      return isValidAddress(this.contactDetails.billingAddress)
            && this.isValidBillingEmail
            && billingEmail !== '';
    },
    billingEmailErrorMessage() {
      const messaggeError = this.isValidBillingEmail ? '' : 'Incorrect email format. The email format should be: name@domain.x';
      return messaggeError;
    },
    isValidEmail() {
      return !_.isEmpty(this.billingEmailErrorMessage);
    },
    isNew() {
      return _.isNil(user._id);
    },
  },
  created() {
    this.qualificationStatusOptions = ['Contacting', 'Identifying', 'Lost', 'No Current Need', 'Won'];
    languageService.retrieve()
      .then((response) => {
        this.languages = _.get(response, 'data.list', []);
      }).catch((e) => {
        this.pushNotification({
          title: 'Error',
          message: 'Languages could not be retrieved',
          state: 'danger',
          response: e,
        });
      });
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    manageLeadSource() {
      this.$emit('lead-source-manage');
    },
    onSelectedQualificationStatus(newValue) {
      this.contactDetails.qualificationStatus = newValue.value;
    },
    onContactDetailsSalesRepChange(salesRep) {
      const firstName = _.get(salesRep, 'firstName', '');
      const lastName = _.get(salesRep, 'lastName', '');
      this.contactDetails.salesRep = {
        _id: salesRep.value,
        firstName,
        lastName,
        deleted: salesRep.deleted,
        terminated: salesRep.terminated,
      };
    },
    manageRequest(event) {
      event.preventDefault();
      this.$emit('manage-request', { filter: this.requestFilter });
    },
    setPreferredLanguages() {
      const { srcLangs, tgtLangs } = this.preferredLanguages;
      const isPreferredLanguagesSelected = srcLangs.length > 0 && tgtLangs.length > 0;
      if (isPreferredLanguagesSelected) {
        this.$emit('preferred-language-combination-selected', this.preferredLanguages);
      }
    },
    onEmailValidation(isValidBillingEmail) {
      this.isValidBillingEmail = isValidBillingEmail;
    },
  },
};
