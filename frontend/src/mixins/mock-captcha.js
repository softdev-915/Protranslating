/* global document */
import SessionFlags from '../utils/session/session-flags';

export default {
  created() {
    const sessionFlagsParser = new SessionFlags();
    this.isProductionEnvironment = sessionFlagsParser.browserStorage.findInCache('BE_NODE_ENV') === 'PROD';
    if (this.isProductionEnvironment) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=6Leio5wmAAAAAGuW7c2GK4nYNJlBl38MUrtZOXzI';
      document.head.appendChild(script);
      return;
    }
    this.recaptcha = 'fakeCaptcha';
    this.recaptchaValidated = true;
  },
  computed: {
    captchaVisible() {
      if (!this.isProductionEnvironment) {
        return false;
      }
      return !this.recaptchaValidated;
    },
  },
};

