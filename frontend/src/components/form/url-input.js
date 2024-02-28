import SimpleBasicSelect from './simple-basic-select.vue';

const SCHEMES = [
  'http://',
  'https://',
];

export default {
  components: { SimpleBasicSelect },
  inject: ['$validator'],
  props: {
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      fullUrl: '',
      hostUrl: '',
      schemes: SCHEMES,
      protocol: '',
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        this.fullUrl = newVal;
        SCHEMES.some((schema) => {
          if (this.fullUrl.startsWith(schema)) {
            this.protocol = schema;
            return true;
          }
          return false;
        });
        this.hostUrl = newVal.replace(this.protocol, '');
      },
    },
    fullUrl(newUrl) {
      if (newUrl) {
        this.$emit('input', newUrl);
      }
    },
    hostUrl(newValue) {
      this.fullUrl = this.protocol + newValue;
    },
    protocol(newValue) {
      this.fullUrl = newValue + this.hostUrl;
    },
  },
  computed: {
    isEmpty() {
      return !this.required && this.url === '';
    },
  },
};
