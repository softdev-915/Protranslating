import _ from 'lodash';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName', 'filterOption', 'emptyOption'];
const CUSTOM_LISTENERS = ['input'];

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: Object,
    },
    lspList: {
      type: Array,
      default: [],
    },
    formatOption: {
      type: Function,
      default: (option) => {
        const { officialName, name } = option;
        return { text: officialName || name, value: option };
      },
    },
    emptyOption: {
      type: Object,
      default: () => ({ text: '', value: {} }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return {
      loading: false,
      selected: null,
    };
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
    selected(newValue) {
      if (_.isObject(newValue) && !_.isEmpty(newValue._id)) {
        this.$emit('input', newValue);
      }
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

