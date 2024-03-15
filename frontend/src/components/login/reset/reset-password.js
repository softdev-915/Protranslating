import { mapActions, mapGetters } from 'vuex';
import serviceFactory from '../../../services';
import ReCaptcha from '../../form/re-captcha.vue';
import ConfirmPassword from '../../form/confirm-password/confirm-password.vue';
import LoginFooter from '../footer.vue';
import mockCaptcha from '../../../mixins/mock-captcha';

export default {
  mixins: [mockCaptcha],
  components: {
    ConfirmPassword,
    ReCaptcha,
    LoginFooter,
  },
  created: function () {
    if (this.$route.query) {
      this.code = this.$route.query.code;
    }
  },
  data() {
    return {
      passwords: {
        password: '',
        newPassword: '',
        repeatPassword: '',
        isValidConfirmPassword: false,
      },
      submitting: false,
      recaptcha: null,
      recaptchaValidated: false,
      recaptchaLoading: false,
    };
  },
  computed: {
    isValidCode: function () {
      return this.code && this.code.trim().length > 0;
    },
    isValidForm: function () {
      return this.isValidCode
        && this.passwords.newPassword.trim() !== ''
        && this.recaptchaValidated
        && this.passwords.isValidConfirmPassword;
    },
    submitDisabled() {
      return !this.isValidForm || this.submitting || this.recaptchaLoading;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapGetters('features', ['mock']),
    onRecaptchaValidation(recaptcha) {
      if (typeof recaptcha === 'string') {
        this.recaptcha = recaptcha;
        this.recaptchaValidated = true;
      }
    },
    onRecaptchaLoading(loading) {
      this.recaptchaLoading = loading;
    },
    onFormFailure() {
      if (!this.mock) {
        this.recaptcha = null;
        this.recaptchaValidated = false;
        this.$refs.reCaptcha.reset();
      }
    },
    submit() {
      if (this.mock) {
        this.recaptcha = '';
      }
      if (!this.isValidForm && this.recaptcha && this.code) {
        return;
      }
      this.submitting = true;
      serviceFactory.authService().sendNewPassword({
        code: this.code,
        password: this.passwords.newPassword,
        recaptcha: this.recaptcha,
      }).then(() => {
        this.pushNotification({ title: 'Success', message: 'Your password has been successfully changed', state: 'success' });
        this.$router.push({ name: 'login' });
      }).catch((response) => {
        this.onFormFailure();
        if (response.status && response.status.code === 400 && response.status.message === 'Recaptcha validation failed') {
          this.pushNotification({ title: 'Error', message: 'Recaptcha validation failed, please try again', state: 'warning' });
        } else if (response.status && response.status.code === 404) {
          this.pushNotification({ title: 'Error', message: 'The user provided does not exist. Check if the email is correctly spelled.', state: 'danger' });
        } else if (response.status && response.status.code === 400 && response.status.message === 'Invalid password cannot be email') {
          this.pushNotification({ title: 'Error', message: 'The password provided is invalid, new password cannot be the email.', state: 'warning' });
        } else if (response.status && response.status.code === 400 && response.status.message === 'Sorry, please choose a password that you have not used previously') {
          this.pushNotification({ title: 'Error', message: 'Sorry, please choose a password that you have not used previously.', state: 'warning' });
        } else if (response.status && response.status.code === 400 && response.status.message.indexOf('The new password must contain') !== -1) {
          this.pushNotification({ title: 'Error', message: response.status.message, state: 'warning' });
        } else if (response.status && response.status.code === 403 && response.status.message === 'Invalid reset password code') {
          this.pushNotification({ title: 'Error', message: 'The reset password code provided is invalid. Please re-start the process again', state: 'warning' });
          this.$router.push({ name: 'forgot-password' });
        } else if (response.status && response.status.code === 403 && response.status.message === 'Invalid user') {
          this.pushNotification({ title: 'Error', message: 'The user has been deactivated.', state: 'danger' });
        } else if (response.status && response.status.code === 409) {
          this.pushNotification({ title: 'Error', message: 'The reset password code has expired. Please re-start the process again', state: 'warning' });
          this.$router.push({ name: 'forgot-password' });
        } else {
          this.pushNotification({ title: 'Error', message: 'An error ocurred, please try again later', state: 'danger', response });
        }
      })
        .finally(() => {
          this.submitting = false;
        });
    },
  },
};
