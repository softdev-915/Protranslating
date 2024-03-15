import { isNil } from 'lodash';
import UtcFlatpickr from '../../../form/utc-flatpickr.vue';

export default {
  name: 'IpDateInput',
  components: {
    UtcFlatpickr,
  },
  props: {
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    'data-e2e-type': {
      type: String,
      default: '',
    },
    value: {},
  },
  computed: {
    isValid() {
      if (!this.required) {
        return true;
      }
      return !isNil(this.value);
    },
  },
  methods: {
    onInput(value) {
      this.$emit('input', value);
    },
  },
};
