import _ from 'lodash';

export default {
  name: 'InputWrapper',
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    value: {
      type: [Number, String],
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    'data-e2e-type': {
      type: String,
      default: '',
    },
  },
  methods: {
    updateInput(e) {
      this.$emit('input', e.target.value.replaceAll(',', ''));
    },
    prepareDisplayValue(value) {
      if (_.isNil(value)) {
        return '0';
      }
      const val = Number(value).toFixed(0);
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
  },
};
