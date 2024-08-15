export default {
  props: {
    set: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: 'Placeholder',
    },
    value: {
      type: Array,
      default: () => [],
    },
    required: {
      type: Boolean,
      default: false,
    },
    'data-e2e-type': {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      chips: [],
      currentInput: '',
    };
  },
  created() {
    this.chips = this.value;
  },
  computed: {
    isValid() {
      if (this.required) return this.value.length > 0;
      return true;
    },
  },
  watch: {
    value: {
      handler(newValue) {
        this.chips = newValue;
      },
      immediate: true,
    },
    chips() {
      this.$emit('select', this.chips);
    },
  },
  methods: {
    saveChip() {
      const { chips, currentInput, set } = this;
      if ((set && chips.indexOf(currentInput) === -1) || !set) {
        chips.push(currentInput);
      }
      this.currentInput = '';
    },
    deleteChip(index) {
      this.chips.splice(index, 1);
    },
    backspaceDelete({ index }) {
      if (index === 8 && this.currentInput === '') {
        this.chips.splice(this.chips.length - 1);
      }
    },
  },
};
