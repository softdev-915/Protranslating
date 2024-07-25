import _ from 'lodash';
import { mapGetters } from 'vuex';

export default {
  props: {
    fieldClass: {
      type: String,
    },
    passwordErrorMessage: {
      type: String,
    },
    value: {
      type: Object,
    },
  },
  data() {
    return {
      dirtyForm: false,
      password: '',
      newPassword: '',
      repeatPassword: '',
      loading: false,
      dirtyNewPassword: false,
      dirtyRepeatPassword: false,
      isPasswordVisible: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    isValidNewPassword: function () {
      return _.isEmpty(this.passwordErrorMessage);
    },
    isValidRepeatPassword: function () {
      return !_.isEmpty(this.repeatPassword.trim()) && this.newPassword === this.repeatPassword;
    },
    isValid: function () {
      return this.isValidNewPassword && this.isValidRepeatPassword;
    },
    showEmptyNewPassword: function () {
      return _.isEmpty(this.newPassword.trim()) && this.dirtyNewPassword && this.dirtyForm;
    },
    showInvalidRepeatPassword: function () {
      return !this.isValidRepeatPassword && this.dirtyRepeatPassword && this.dirtyForm;
    },
    showEmptyRepeatPassword: function () {
      return _.isEmpty(this.repeatPassword.trim()) && this.dirtyRepeatPassword && this.dirtyForm;
    },
    showSamePassword() {
      return this.newPassword === this.value.password && this.dirtyForm;
    },
  },
  watch: {
    newPassword() {
      this.dirtyNewPassword = true;
      this.$emit('input', {
        password: this.value.password,
        newPassword: this.newPassword,
        repeatPassword: this.repeatPassword,
        isValidConfirmPassword: this.isValid,
      });
    },
    repeatPassword() {
      this.dirtyRepeatPassword = true;
    },
    isValid(valid) {
      this.$emit('input', {
        password: this.value.password,
        newPassword: this.newPassword,
        repeatPassword: this.repeatPassword,
        isValidConfirmPassword: valid,
      });
    },
    value(newValue) {
      this.newPassword = newValue.newPassword;
      this.repeatPassword = newValue.repeatPassword;
      if (typeof newValue.dirtyForm !== 'undefined') {
        this.dirtyForm = newValue.dirtyForm;
      }
    },
  },
};
