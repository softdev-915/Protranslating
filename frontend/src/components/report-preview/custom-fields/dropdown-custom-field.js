import AbstractCustomField from './abstract-custom-field.vue';

export default {
  extends: AbstractCustomField,
  props: {
    options: {
      type: Array,
      default: () => ([]),
    },
    subtitle: {
      type: String,
      default: '',
    },
  },
  methods: {
    onOptionSelect(option) {
      this.emitInputEvent(option.value);
    },
  },
  computed: {
    formattedOptions() {
      return this.options.map(option => ({ text: option, value: option }));
    },
    valueModel() {
      return { text: this.value, value: this.value };
    },
  },
};
