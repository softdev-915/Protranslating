import _ from 'lodash';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const CUSTOMER_TIER_LEVEL_OPTIONS = ['1', '2', '3', 'Lead-No Language Need', 'Partner'];
const CUSTOM_PROPS = ['value', 'options'];
const CUSTOM_LISTENERS = ['input'];

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: String,
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return {
      selected: '',
    };
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
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
  created() {
    this.options = CUSTOMER_TIER_LEVEL_OPTIONS;
  },
};
