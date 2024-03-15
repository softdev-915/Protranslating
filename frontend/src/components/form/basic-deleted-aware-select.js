export default {
  props: {
    value: {
      type: String,
    },
    options: {
      type: Array,
    },
    placeholder: {
      type: String,
      default: '',
    },
    selectedOption: {
      type: Object,
      default: () => ({ value: '', text: '' }),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    if (this.value) {
      this.selected = this.value;
    } else if (this.selectedOption && this.selectedOption.value) {
      this.selected = this.selectedOption.value;
    }
  },
  data() {
    return {
      selected: null,
    };
  },
  watch: {
    selected(newSelection) {
      this.$emit('input', newSelection);
    },
  },
  computed: {
    filteredOptions() {
      if (this.options) {
        return this.options.filter((o) => !o.terminated);
      }
      return [];
    },
  },
  methods: {
    select(eventData) {
      this.selected = eventData.value;
      this.$emit('select', eventData);
    },
    deletedCustomAttr(option) {
      if (option.terminated) {
        return 'entity-terminated';
      }
      if (option.deleted) {
        return 'entity-deleted';
      }
      return '';
    },
  },
};
