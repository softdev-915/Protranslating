export default {
  name: 'IpRadioButton',
  data() {
    return {
      checked: false,
    };
  },
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    defaultChecked: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: '',
    },
    value: {
      type: Boolean,
      default: false,
    },
    'data-e2e-type': {
      type: String,
      default: '',
    },
  },
  created() {
    this.checked = this.defaultChecked || this.value;
  },
  watch: {
    value(checked) {
      this.checked = checked;
    },
  },
  methods: {
    onChange($event) {
      this.checked = $event.target.checked;
      this.$emit('input', $event.target.checked);
    },
  },
};
