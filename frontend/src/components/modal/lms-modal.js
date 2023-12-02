export default {
  name: 'LmsModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    isDismissible: {
      type: Boolean,
      default: true,
    },
    modalDataE2e: {
      type: String,
      default: 'lms-modal',
    },
  },
  methods: {
    dismiss() {
      if (this.isDismissible) {
        this.$emit('input', false);
      }
    },
  },
};
