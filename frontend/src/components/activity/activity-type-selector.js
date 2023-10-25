const TYPE_OPTIONS = [
  'User Note',
  'Feedback',
];

export default {
  props: {
    value: {
      type: String,
    },
    placeholder: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      options: TYPE_OPTIONS,
      selected: {},
    };
  },
  created() {
    this.selectValue(this.value);
  },
  watch: {
    value(newValue) {
      this.selectValue(newValue);
    },
    selected(newSelected) {
      if (newSelected) {
        this.$emit('input', newSelected.value);
      } else {
        this.$emit('input', null);
      }
    },
  },
  computed: {
    typeOptions() {
      return this.options.map((m) => ({
        text: m,
        value: m,
      }));
    },
  },
  methods: {
    onTypeSelected(type) {
      this.selected = type;
    },
    selectValue(value) {
      if (value) {
        this.selected = { value: value, text: value };
      }
    },
  },
};
