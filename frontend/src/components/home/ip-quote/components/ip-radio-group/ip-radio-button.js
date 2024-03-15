export default {
  props: {
    name: {
      type: String,
    },
    label: {
      type: String,
    },
    value: {
      type: String,
    },
  },
  computed: {
    radioButtonValue: {
      get() {
        return this.value;
      },
      set() {
        this.$emit('change', this.label);
      },
    },
  },
};
