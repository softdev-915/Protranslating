export default {
  props: {
    type: {
      type: String,
      default: 'default',
    },
    disabled: {
      type: Boolean,
    },
  },
  computed: {
    buttonClass() {
      return `ip-button__${this.type}`;
    },
  },
};
