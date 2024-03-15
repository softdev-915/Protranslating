import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import CurrencyService from '../../services/currency-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import SimpleBasicSelect from '../form/simple-basic-select.vue';
import { selectMixin } from '../../mixins/select-mixin';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'fetchOnCreated', 'entityName', 'filterOption'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  options: [],
  selected: '',
});
const service = new CurrencyService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin],
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
    },
    excludeCurrency: {
      type: String,
    },
    showOptions: {
      type: Array,
      default: () => [],
    },
    currenciesAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({ text: name, value: _id }),
    },
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  watch: {
    value: {
      handler(newValue) {
        this.selected = newValue;
      },
      immediate: true,
    },
    currenciesAvailable: {
      handler(value) {
        this.optionsRetrieved = true;
        this.options = value;
      },
      immediate: true,
    },
    selected(newValue) {
      this.$emit('input', newValue);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'currencyList']),
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    ...mapActions('app', ['setCurrencyList']),
    filterOption(option) {
      const excludeCurrency = _.get(this, 'excludeCurrency', '');
      if (excludeCurrency !== '') {
        const optionId = _.get(option, '_id', '');
        return optionId !== excludeCurrency;
      }
      const showOptions = _.get(this, 'showOptions', []);
      if (!_.isEmpty(showOptions)) {
        const foundOption = showOptions.find((optionToShow) => {
          const optionId = _.get(option, '_id', '');
          return optionToShow === optionId;
        });
        return !_.isNil(foundOption);
      }
      return true;
    },
    _retrieve() {
      if (!_.isEmpty(this.currencyList)) {
        this.options = this.currencyList;
        return;
      }
      if (_.isEmpty(this.options)) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
    onCurrencyListLoaded(options) {
      if (options.length > 0 && this.currencyList.length === 0) {
        this.setCurrencyList(options);
      }
      this.$emit('options-loaded', options);
    },
  },
};
