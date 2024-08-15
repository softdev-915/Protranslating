import _ from 'lodash';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const OFAC_OPTIONS = ['N/A', 'Clear', 'Blocked'];
const CUSTOM_PROPS = ['value', 'options', 'formatOption'];
const CUSTOM_LISTENERS = ['input'];

export default {
  components: { SimpleBasicSelect },
  data() {
    return {
      selected: '',
      defaultOptions: OFAC_OPTIONS,
    };
  },
  props: {
    value: String,
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  watch: {
    value: {
      handler(newValue) {
        this.selected = newValue;
      },
      immediate: true,
    },
    selected(newValue) {
      this.$emit('input', newValue);
    },
  },
  computed: {
    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    customListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
};
