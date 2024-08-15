const MAX_CUSTOM_FIELDS = 5;
export default {
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isMaxCustomFields() {
      return this.value.length === MAX_CUSTOM_FIELDS;
    },
  },
  methods: {
    addNewCustomField() {
      this.value.push({ value: '' });
    },
    removeCustomField(index) {
      if (this.isDisabled) return;
      this.$emit('remove-custom-field', index);
    },
  },
};
