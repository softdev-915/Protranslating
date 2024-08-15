import _ from 'lodash';
import { mapGetters } from 'vuex';

const API_USER_DEFAULT_MIN_PASSWORD_LENGTH = 256;

export default {
  inject: ['$validator'],
  props: {
    canEdit: {
      type: Boolean,
      default: false,
    },
    value: Object,
    isOverwritten: Boolean,
    isApiUser: Boolean,
  },
  data: () => ({
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
      useTwoFactorAuthentification: false,
    },
    tfaSection: {
      expanded: false,
      code: '',
    },
  }),
  computed: {
    ...mapGetters('app', ['lsp']),
    isValid() {
      if (!_.isNil(this.securityPolicy) && !_.isEmpty(this.securityPolicy)) {
        const { passwordComplexity } = this.securityPolicy;
        if (Object.keys(passwordComplexity).every((k) => passwordComplexity[k] === false)) {
          return false;
        }
        return _.isEmpty(_.get(this, 'errors.items', []));
      }
      return _.isEmpty(this.errors.items);
    },
    isDisabled() {
      return !this.canEdit || !this.isOverwritten;
    },
  },
  watch: {
    isApiUser(is) {
      if (is) {
        this.securityPolicy.minPasswordLength = API_USER_DEFAULT_MIN_PASSWORD_LENGTH;
      } else {
        this.securityPolicy.minPasswordLength = this.lsp.securityPolicy.minPasswordLength;
      }
    },
    securityPolicy: {
      handler(newValue) {
        this.$emit('input', newValue);
      },
      deep: true,
    },
    value(newValue) {
      this.securityPolicy = newValue;
    },
    isValid(valid) {
      this.$emit('security-policy-validation', valid);
    },
  },
  created() {
    this.securityPolicy = this.value;
    this.$emit('security-policy-validation', this.isValid);
  },
};
