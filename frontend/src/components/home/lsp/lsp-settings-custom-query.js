export default {
  name: 'LspSettingsCustomQuery',
  props: {
    value: { required: true, type: Object },
  },
  data() {
    return {
      settings: { reportCache: 0 },
    };
  },
  watch: {
    value(newValue) {
      this.settings = newValue;
    },
    settings(newValue) {
      this.$emit('input', newValue);
    },
  },
};
