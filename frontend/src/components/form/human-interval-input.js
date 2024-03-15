import { isFinite, isEmpty } from 'lodash';
import humanInterval from 'human-interval';

const validateHumanInterval = (intervals) => intervals.every(
  (interval) => isFinite(humanInterval(interval.trim().toLowerCase())),
);

export default {
  data() {
    return {
      humanIntervalString: '',
    };
  },
  props: {
    value: {
      type: Array,
      default: [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    dataE2eType: {
      type: String,
      required: false,
      default: 'human-interval-input',
    },
  },
  watch: {
    isValid(newValid) {
      this.$emit('human-interval-valid', newValid);
    },
    value(newValue, oldValue) {
      if (isEmpty(oldValue)) {
        this.humanIntervalString = newValue.join(', ');
      }
    },
    humanIntervalString(newValue) {
      let value;
      if (isEmpty(newValue)) {
        value = [];
      } else {
        value = newValue.split(',').map((interval) => interval.trim());
      }
      this.$emit('input', value);
    },
  },
  computed: {
    isValid() {
      return isEmpty(this.value) || validateHumanInterval(this.value);
    },
  },
};
