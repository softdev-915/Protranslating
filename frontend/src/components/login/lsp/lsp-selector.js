import _ from 'lodash';
import LspService from '../../../services/lsp-service';
import { isEmail } from '../../../utils/form';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName', 'filterOption', 'emptyOption'];
const CUSTOM_LISTENERS = ['input'];
const lspService = new LspService();

export default {
  components: { SimpleBasicSelect },
  props: {
    email: {
      type: String,
      required: true,
    },
    recaptcha: {
      type: String,
      default: '',
    },
    value: {
      type: Object,
    },
    retrieveOnCreated: {
      type: Boolean,
      default: true,
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
      lspList: [],
      selected: null,
    };
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
    email: {
      handler(newEmail) {
        if (this.retrieveOnCreated && isEmail(newEmail)) {
          this.$emit('user-lsp-list-retrieving');
          this.lspList = lspService.retrieve({ email: newEmail, recaptcha: this.recaptcha });
        }
      },
      immediate: true,
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
  methods: {
    onOptionsLoaded(options) {
      this.$emit('user-lsp-list-retrieve', options);
    },
  },
};

