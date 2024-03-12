import AbstractCustomField from './abstract-custom-field.vue';

export default {
  extends: AbstractCustomField,
  props: {
    options: {
      type: Array,
      default: () => ([]),
    },
  },
  methods: {
    onOptionSelect(option) {
      this.$emit('input', option);
    },
  },
  computed: {
    formattedOptions() {
      return this.options
        .map(option => (option.text && option.value ? option : ({ text: option, value: option })));
    },
  },
};
