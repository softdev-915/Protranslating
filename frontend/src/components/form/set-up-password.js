import _ from 'lodash';
import { mapGetters } from 'vuex';
import { getPasswordValidationErrorMessage, isValidPassword } from '../../utils/form';
import ProtectedInput from './protected-input.vue';

export default {
  components: {
    ProtectedInput,
  },
  props: {
    hasOverwrittenSecurityPolicy: Boolean,
    showApiCheckbox: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    user: Object,
    isMandatory: Boolean,
    value: {
      type: String,
    },
    isSsoEnabled: Boolean,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    securityPolicy() {
      return _.get(this.user, 'securityPolicy');
    },
    isValid() {
      if (!this.isRequired) {
        return this.isValidUpdatePassword;
      }
      return this.isValidNewPassword;
    },
    isValidUpdatePassword() {
      return _.isEmpty(this.password) || this.isNewPasswordValid;
    },
    isValidNewPassword() {
      return !_.isEmpty(this.password) && this.isNewPasswordValid;
    },
    isNewPasswordValid() {
      return isValidPassword(this.password, this.securityPolicy);
    },
    getPasswordValidationErrorMessage() {
      return getPasswordValidationErrorMessage(this.password, this.securityPolicy);
    },
    showEmptyPassword() {
      return !this.dirtyPassword && !this.isValidUpdatePassword && this.isMandatory;
    },
    showOverwrittenSecurityPolicy() {
      return this.dirtyPassword && _.isEmpty(this.password) && this.hasOverwrittenSecurityPolicy;
    },
    placeholder() {
      if (this.isSsoEnabled) {
        return 'Password is disabled for contacts in companies using SSO';
      }
      return 'Enter your password based on the above security policy';
    },
  },
  data() {
    return {
      password: '',
      dirtyPassword: false,
      isApiUser: false,
    };
  },
  watch: {
    value: {
      handler(newValue) {
        this.password = newValue;
      },
      immediate: true,
    },
    user: {
      handler(newValue) {
        this.isApiUser = newValue.isApiUser;
      },
      immediate: true,
    },
    password(newValue) {
      this.dirtyPassword = true;
      this.$emit('input', newValue);
    },
    isValid(valid) {
      this.$emit('is-valid-password', valid);
    },
    isApiUser(isApiChecked) {
      this.$emit('on-api-change', isApiChecked);
    },
  },
  mounted() {
    this.$emit('is-valid-password', this.isValid);
  },
};
