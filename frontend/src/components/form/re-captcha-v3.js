import { executeRecaptcha } from '../../utils/form';

const SITE_KEY = '6LcrnZEmAAAAAG0SA4miNPdcldejEN0gFzEN_PAS';
const FAKE_CAPTCHA_TOKEN = 'fakeCaptcha';

export default {
  props: {
    siteKey: {
      type: String,
      default: SITE_KEY,
    },
    mock: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
      default: 'submit',
    },
  },
  mounted() {
    this.loadRecaptcha();
  },
  methods: {
    loadRecaptcha() {
      if (this.mock) {
        return this.$emit('re-captcha-loading', false);
      }
      this.$emit('re-captcha-loading', true);
      setTimeout(() => {
        if (typeof grecaptcha === 'undefined') {
          this.loadRecaptcha();
        } else {
          this.$emit('re-captcha-loading', false);
        }
      }, 500);
    },
    execute() {
      if (this.mock) {
        return this.$emit('re-captcha-solved', FAKE_CAPTCHA_TOKEN);
      }
      executeRecaptcha(this.siteKey, this.action, (token) => {
        this.$emit('re-captcha-solved', token);
      }, (error) => {
        this.$emit('re-captcha-error', error);
      });
    },
  },
};
