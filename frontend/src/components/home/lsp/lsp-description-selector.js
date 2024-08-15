import _ from 'lodash';
import LspService from '../../../services/lsp-service';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'emptyOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  lspList: [],
  selected: null,
});

const getLspIds = (lspIdsString) => {
  if (_.isNil(lspIdsString)) {
    return;
  }
  if (_.isEmpty(lspIdsString)) {
    return;
  }
  return _.split(lspIdsString, ',');
};
const lspService = new LspService();

export default {
  props: {
    title: String,
    placeholder: String,
    value: Object,
    recaptcha: {
      type: String,
      default: '',
    },
    formatOption: {
      type: Function,
      default: (option) => ({ text: _.get(option, 'description', ''), value: option }),
    },
    emptyOption: {
      type: Object,
      default: () => ({ text: '', value: {} }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },

  components: { SimpleBasicSelect },

  data() {
    return buildInitialState();
  },

  created() {
    this.lspList = this._retrieve();
  },

  computed: {
    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },

    customListeners() {
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
  methods: {
    _retrieve() {
      const retrieveOptions = { recaptcha: this.recaptcha };
      const lspIds = getLspIds(_.get(this, '$route.query.lsp'));
      if (!_.isNil(lspIds) && lspIds.length > 0) {
        retrieveOptions.lspIds = lspIds;
      }
      return lspService.retrieve(retrieveOptions);
    },
    getCustomAttr: (option) => {
      const lspName = _.get(option, 'value.name', '');
      const lspId = _.get(option, 'value._id', '');
      return `${lspName}:${lspId}`;
    },
    onOptionsLoaded(options) {
      this.$emit('user-lsp-list-retrieve', options);
    },
  },
};
