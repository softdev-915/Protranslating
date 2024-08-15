import { get } from 'lodash';

export default {
  name: 'IpSelect',
  props: {
    options: {
      type: Array,
      required: true,
    },
    'item-key': {
      type: String,
      default: 'name',
    },
    value: {
      type: Object,
      default: null,
    },
    tabindex: {
      type: Number,
      default: 0,
    },
    placeholder: {
      type: String,
      default: '',
    },
    isRectangleStyle: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selected: null,
      opened: false,
    };
  },
  computed: {
    selectedShown() {
      return get(this.selected, `${this.itemKey}`, this.placeholder || 'None');
    },

    isValid() {
      if (this.required) return this.value;
      return true;
    },
  },
  mounted() {
    this.selected = get(this, 'value', null);
  },
  watch: {
    value: {
      handler(newValue) {
        this.selected = newValue;
      },
      immediate: true,
    },
  },
  methods: {
    toggle() {
      if (this.isDisabled) return;
      this.opened = !this.opened;
    },
    close() {
      this.opened = false;
    },
    select(option) {
      this.selected = option;
      this.$emit('input', option);
      this.close();
    },
  },
};
