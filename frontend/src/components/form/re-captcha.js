import { initRecaptcha, resetRecaptcha } from '../../utils/form';

const SITE_KEY = '6LfXTxYUAAAAAB3Gw7IJ-9pnXeGisYUXAixtTSCe';

export default {
  props: {
    siteKey: {
      type: String,
      default: SITE_KEY,
    },
  },
  mounted() {
    this.loadRecaptcha();
  },
  data() {
    return {
      recaptcha: null,
      recaptchaWidgetId: null,
    };
  },
  watch: {
    recaptcha: function (newValue) {
      this.recaptcha = newValue;
      this.$emit('re-captcha-validation', newValue);
    },
  },
  methods: {
    loadRecaptcha() {
      this.$emit('re-captcha-loading', true);
      setTimeout(() => {
        if (typeof grecaptcha === 'undefined') {
          this.loadRecaptcha();
        } else {
          this.recaptchaWidgetId = initRecaptcha('g_recaptcha', this.siteKey, (response) => {
            this.recaptcha = response;
            this.$emit('re-captcha-loading', false);
          }, () => {
            this.recaptcha = null;
          });
          this.$emit('re-captcha-loading', false);
        }
      }, 500);
    },
    reset() {
      this.$emit('re-captcha-loading', true);
      this.recaptcha = null;
      resetRecaptcha(this.recaptchaWidgetId);
      let checkCaptchaLoadedInterval;
      // Wait till the captcha has finished loading and emit event
      const checkCaptchaLoaded = () => {
        if (typeof grecaptcha !== 'undefined') {
          this.$emit('re-captcha-loading', false);
          clearInterval(checkCaptchaLoadedInterval);
        }
      };
      checkCaptchaLoadedInterval = setInterval(checkCaptchaLoaded, 500);
    },
  },
};
