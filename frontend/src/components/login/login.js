
import _ from 'lodash';
import { mapActions, mapGetters, mapMutations } from 'vuex';
import PtsEmailInput from '../form/pts-email-input.vue';
import ReCaptchaV3 from '../form/re-captcha-v3.vue';
import LoginLspSelector from './lsp/login-lsp-selector.vue';
import LoginFooter from './footer.vue';
import serviceFactory from '../../services';
import { isEmail } from '../../utils/form';
import SessionFlags from '../../utils/session/session-flags';
import { successNotification, errorNotification } from '../../utils/notifications';
import mockCaptcha from '../../mixins/mock-captcha';
import LspService from '../../services/lsp-service';

const INCORRECT_CREDENTIALS_ERROR = 'Incorrect credentials';
const INVALID_HOTP_CODE_ERROR = 'Invalid hotp';
const HTTP_CODE_ACCEPTED = 202;
const TEST_USER_EMAILS_REGEX = /lms-92pts@sample1.com|lms-92-multi-lsp@sample1.com/;
const RECAPTCHA_SITE_KEY = '6Leio5wmAAAAAGuW7c2GK4nYNJlBl38MUrtZOXzI';
/* eslint-disable quote-props */
const samlErrorsMap = {
  '500': 'Unexpected error authenticating with SAML.',
  '400': 'No company data received from SAML.',
  '401': 'SSO is not enabled for your company. Contact your administrator.',
  '402': 'User trying to login via SSO does not exist.',
  '403': 'Bad credentials.',
};
const lspService = new LspService();

export default {
  mixins: [mockCaptcha],
  components: {
    PtsEmailInput,
    LoginLspSelector,
    ReCaptchaV3,
    LoginFooter,
  },
  data() {
    return {
      email: '',
      password: '',
      isPasswordVisible: false,
      submitting: false,
      emailSubmitted: false,
      lsp: {
        _id: '',
        name: '',
      },
      success: false,
      recaptcha: null,
      recaptchaValidated: false,
      recaptchaLoading: true,
      userLspList: [],
      isPasswordAccepted: false,
      hotp: '',
    };
  },
  watch: {
    userLspList(usersLsp) {
      // If user has only one LSP auto select it
      if (usersLsp && usersLsp.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        this.lsp = usersLsp[0];
      }
    },
    lsp(selectedLsp) {
      const forcePasswordChange = _.get(selectedLsp, 'forcePasswordChange', false);
      const isTestUser = TEST_USER_EMAILS_REGEX.test(this.email);
      const shouldChangePassword = forcePasswordChange && (!this.mock || isTestUser);
      if (shouldChangePassword) {
        this.$router.push({
          name: 'forgot-password',
          params: {
            email: this.email,
            showForceLegend: true,
            lsp: selectedLsp,
          },
        }).catch((err) => { console.log(err); });
      }
    },
  },
  created() {
    const flags = SessionFlags.getCurrentFlags();
    this.mock = _.get(flags, 'mock', false);
    this.checkSamlCode();
  },
  mounted: function () {
    if (!_.isNil(this.$refs.email)) {
      this.$refs.email.focus();
    }
  },
  computed: {
    ...mapGetters('app', ['firstRoute']),
    isValidForm: function () {
      if (!this.emailSubmitted) {
        return this.email.trim().length && isEmail(this.email);
      }
      if (!_.has(this, 'lsp._id') || _.isEmpty(this.lsp._id)) {
        return false;
      }
      return this.isSSOEnabled || this.password.length > 0;
    },
    showPasswordInput() {
      return !_.isEmpty(_.get(this, 'lsp._id'));
    },
    useTwoFactor() {
      return _.get(this, 'lsp.useTwoFactor') === true;
    },
    siteKey() {
      return RECAPTCHA_SITE_KEY;
    },
    isCaptchaVisible() {
      if (!this.emailSubmitted) {
        return false;
      }
      return !this.useTwoFactor;
    },
    loading() {
      return this.submitting || (this.isCaptchaVisible && this.recaptchaLoading);
    },
    isSSOEnabled() {
      return _.get(this, 'lsp.ssoSettings.isSSOEnabled', false);
    },
  },
  methods: {
    ...mapActions('app', ['setUser', 'triggerGlobalEvent', 'setLsp']),
    ...mapActions('notifications', ['pushNotification']),
    ...mapMutations('authorization', ['setCsrfToken']),
    reset() {
      if (!this.submitting) {
        this.email = '';
        this.password = '';
        this.emailSubmitted = false;
        this.lsp = null;
        setTimeout(() => this.$refs.email.focus(), 0);
      }
    },
    submitEmail(event) {
      event.preventDefault();
      if (!this.isValidForm || this.submitting) {
        return;
      }
      this.submitting = true;
      this.triggerGlobalEvent({ blurLoading: true });
      if (isEmail(this.email)) {
        lspService.retrieveLspListByEmail(this.email).then(((res) => {
          this.userLspList = _.get(res, 'data.list', []);
          this.emailSubmitted = true;
        }))
          .finally(() => {
            this.triggerGlobalEvent({ blurLoading: false });
            this.submitting = false;
          });
      }
    },
    submitPassword(event) {
      event.preventDefault();
      if (!this.isValidForm || this.submitting) {
        return;
      }
      if (!this.useTwoFactor && this.isCaptchaVisible) {
        return this.$refs.reCaptcha.execute();
      }
      this._submitPassword();
    },
    _submitPassword(recaptchaToken = null) {
      this.submitting = true;
      this.triggerGlobalEvent({ blurLoading: true });
      const credentials = {
        email: this.email,
        lspId: this.lsp._id,
        password: this.password,
        recaptcha: recaptchaToken,
      };
      serviceFactory.authService().login(credentials).then((response) => {
        const csrfToken = _.get(response, 'data.csrfToken', '');
        if (!_.isEmpty(csrfToken)) {
          this.setCsrfToken(csrfToken);
        } else {
          serviceFactory.logService().error('CSRF Error. Got empty token from auth service');
        }
        const responseCode = _.get(response, 'status.code');
        if (responseCode === HTTP_CODE_ACCEPTED) {
          this.isPasswordAccepted = true;
          this.pushNotification(successNotification('You have entered the correct password'));
          return;
        }
        this.setUser(response.data.user);
        this.setLsp(response.data.user.lsp);
        if (this.firstRoute) {
          const { query, path, params } = this.firstRoute;
          this.$router.push({ path, params, query }).catch((err) => { console.log(err); });
        } else {
          this.$router.push({ name: 'home' }).catch((err) => { console.log(err); });
        }
      }).catch((response) => {
        this._handleErrorResponse(response);
      })
        .finally(() => {
          this.triggerGlobalEvent({ blurLoading: false });
          this.submitting = false;
        });
    },
    submitHotp(event) {
      event.preventDefault();
      if (!this.isValidForm || this.submitting) {
        return;
      }
      this.submitting = true;
      this.triggerGlobalEvent({ blurLoading: true });
      serviceFactory.authService().verifyHotp({ hotp: this.hotp }).then((response) => {
        const csrfToken = _.get(response, 'data.csrfToken', '');
        if (!_.isEmpty(csrfToken)) {
          this.setCsrfToken(csrfToken);
        } else {
          serviceFactory.logService().error('CSRF Error. Got empty token from auth service');
        }
        this.setUser(response.data.user);
        this.setLsp(response.data.user.lsp);
        if (this.firstRoute) {
          const { query, path, params } = this.firstRoute;
          this.$router.push({ path, params, query });
        } else {
          this.$router.push({ name: 'home' });
        }
      }).catch((response) => {
        this._handleErrorResponse(response);
      })
        .finally(() => {
          this.triggerGlobalEvent({ blurLoading: false });
          this.submitting = false;
        });
    },
    _handleErrorResponse(response) {
      if (response.status >= 500) {
        this.pushNotification(errorNotification(`(HTTP: ${response.status})`, null, response, 'System error'));
        return;
      }
      const message = _.get(response, 'status.message', '');
      const isLocked = !_.isNil(message.match('locked|exceeded'));
      if (!response.status) {
        this.pushNotification(errorNotification('System error', null, response));
      } else if (message === INCORRECT_CREDENTIALS_ERROR) {
        this.pushNotification({
          title: 'Bad email or password',
          message: 'Check your credentials',
          state: 'warning',
        });
      } else if (message === INVALID_HOTP_CODE_ERROR) {
        this.pushNotification({
          title: 'Error!',
          message: 'Invalid Authentificator code',
          state: 'warning',
        });
      } else if (message.indexOf('expired') >= 0) {
        this.pushNotification({
          title: 'Password expired',
          message: 'Sorry, your password has expired. Please reset your password',
          state: 'warning',
        });
        setTimeout(() => {
          this.$router.push({
            name: 'forgot-password',
            params: {
              email: this.email,
              showForceLegend: true,
              lsp: this.lsp,
            },
          });
        }, 1000);
        this.reset();
      } else if (isLocked) {
        this.pushNotification(errorNotification(message, null, null, 'User locked'));
      } else {
        this.pushNotification({ title: 'Error!', message, state: 'warning' });
      }
    },
    onRecaptchaValidation(recaptchaToken) {
      this._submitPassword(recaptchaToken);
    },
    onRecaptchaError() {
      this.pushNotification({
        title: 'Error',
        message: 'Recaptcha failed to be solved',
        state: 'warning',
      });
    },
    onRecaptchaLoading(loading) {
      this.recaptchaLoading = loading;
    },
    loginViaSSO(event) {
      event.preventDefault();
      const entryPoint = _.get(this, 'lsp.ssoSettings.entryPoint');
      window.location.href = `${entryPoint}`;
    },
    checkSamlCode() {
      const samlError = _.get(this, '$route.query.samlError', null);
      if (!_.isNil(samlError)) {
        const samlErrorMessage = _.get(samlErrorsMap, samlError, samlErrorsMap['500']);
        this.pushNotification(errorNotification(samlErrorMessage, null, null, 'SAML Error'));
        const query = _.omit(this.$route.query, 'samlError');
        this.$router.replace({ name: this.$route.name, query });
      }
    },
  },
};
