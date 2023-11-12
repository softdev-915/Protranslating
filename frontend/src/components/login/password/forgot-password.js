import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import PtsEmailInput from '../../form/pts-email-input.vue';
import LspSelector from '../lsp/lsp-selector.vue';
import serviceFactory from '../../../services';
import ReCaptcha from '../../form/re-captcha.vue';
import LoginFooter from '../footer.vue';
import mockCaptcha from '../../../mixins/mock-captcha';

export default {
  mixins: [mockCaptcha],
  components: {
    PtsEmailInput,
    LspSelector,
    ReCaptcha,
    LoginFooter,
  },
  data() {
    return {
      email: '',
      emailValid: false,
      submitting: false,
      success: false,
      recaptcha: null,
      recaptchaValidated: false,
      recaptchaLoading: false,
      userLspList: [],
      showForceLegend: false,
      selectedLsp: {
        _id: '',
        name: '',
        forcePasswordChange: false,
      },
    };
  },
  watch: {
    userLspList(lspList) {
      // If user has only one LSP auto select it
      if (lspList && lspList.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        this.selectedLsp = lspList[0];
      }
    },
  },
  created() {
    const email = _.get(this, '$route.params.email');
    const lsp = _.get(this, '$route.params.lsp');
    this.showForceLegend = _.get(this, '$route.params.showForceLegend', false);
    this.email = email;
    if (_.get(lsp, '_id')) {
      this.selectedLsp = lsp;
    }
  },
  computed: {
    ...mapGetters('app', ['lsp']),
    ...mapGetters('features', ['mock']),
    shouldBlur: function () {
      if (this.hasFailed || this.success) {
        return false;
      }
      return this.recaptchaLoading || this.submitting;
    },
    isValidForm: function () {
      if (!_.has(this, 'selectedLsp._id') || _.isEmpty(this.selectedLsp._id)) {
        return false;
      }
      return this.emailValid && (this.recaptchaValidated || this.mock);
    },
    submitDisabled: function () {
      return !this.isValidForm || this.shouldBlur;
    },
    isSSOEnabled() {
      return _.get(this, 'selectedLsp.ssoSettings.isSSOEnabled', false);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onUserLspRetrieve(userLspList) {
      this.userLspList = userLspList;
    },
    refreshRecaptcha() {
      this.recaptcha = null;
      this.recaptchaValidated = false;
      this.$refs.reCaptcha.reset();
    },
    onRecaptchaValidation(recaptcha) {
      if (typeof recaptcha === 'string') {
        this.recaptcha = recaptcha;
        this.recaptchaValidated = true;
      }
    },
    onRecaptchaLoading(loading) {
      this.recaptchaLoading = loading;
    },
    onEmailValidation(valid) {
      this.emailValid = valid;
    },
    onFormFailure() {
      this.success = false;
      this.submitting = false;
      this.recaptcha = null;
      this.recaptchaValidated = false;
      if (!this.mock) {
        this.$refs.reCaptcha.reset();
      }
    },
    submit() {
      if (this.recaptchaLoading) {
        return;
      }
      if (!this.isValidForm) {
        return;
      }
      if (this.isSSOEnabled) {
        const entryPoint = _.get(this, 'selectedLsp.ssoSettings.entryPoint');
        window.location.href = `${entryPoint}`;
        return;
      }
      this.submitting = true;
      serviceFactory.authService().sendForgotPassword({
        email: this.email,
        lspId: this.selectedLsp._id,
        recaptcha: this.recaptcha,
      }).then(() => {
        this.success = true;
        this.submitting = false;
      }).catch((response) => {
        this.onFormFailure();
        if (response.status && response.status.code === 400 && response.status.message === 'Recaptcha validation failed') {
          this.pushNotification({ title: 'Error', message: 'Recaptcha validation failed, please try again', state: 'warning' }, response);
        } else {
          this.pushNotification({
            title: 'Error', message: 'An error ocurred, please try again later', state: 'danger', response,
          });
        }
      });
    },
  },
};
