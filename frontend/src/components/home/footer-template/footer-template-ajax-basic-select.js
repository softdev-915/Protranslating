import _ from 'lodash';
import { mapGetters } from 'vuex';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'formatOption', 'preFetchOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({ selected: null });

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = null }) => ({
        text: name,
        value: _id,
      }),
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      default: () => ([]),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
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
};
