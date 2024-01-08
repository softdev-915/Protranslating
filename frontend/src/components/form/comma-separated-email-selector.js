import _ from 'lodash';
import { isEmail } from '../../utils/form';

const buildInitialState = () => ({
  inputValue: '',
});

export default {
  props: {
    readOnly: {
      type: Boolean,
      default: false,
    },
    value: Array,
  },

  data() {
    return buildInitialState();
  },

  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.inputValue = newValue.join(', ');
      },
    },
    inputValue(newInputValue) {
      const uniqueEmails = _.uniq(newInputValue.split(',').map((e) => e.trim()));
      this.$emit('input', uniqueEmails);
    },
    isValid() {
      this.$emit('email-selector-validated', this.isValid);
    },
  },

  computed: {
    isValid() {
      return this.inputValue.length === 0 || this.value.every((e) => isEmail(e));
    },
  },
};
