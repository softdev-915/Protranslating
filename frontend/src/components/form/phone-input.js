import _ from 'lodash';

export default {
  props: {
    value: {
      type: String,
      default: '',
    },
    name: {
      type: String,
    },
  },
  data() {
    return {
      phone: '',
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        this.phone = newVal;
      },
    },
    phone(newPhone) {
      this.$emit('input', newPhone);
    },
  },
  computed: {
    customProps() {
      return this.$props;
    },
    customListeners() {
      return _.omit(this.$listeners, ['input']);
    },
  },
};
