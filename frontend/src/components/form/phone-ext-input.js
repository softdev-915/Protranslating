import _ from 'lodash';

export default {
  inject: ['$validator'],
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
      phoneExt: '',
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        this.phoneExt = newVal;
      },
    },
    phoneExt(newphoneExt) {
      this.$emit('input', newphoneExt);
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
