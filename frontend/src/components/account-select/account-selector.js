import _ from 'lodash';
import AccountService from '../../services/revenue-account-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import SimpleBasicSelect from '../form/simple-basic-select.vue';
import { selectMixin } from '../../mixins/select-mixin';
import userRoleCheckMixin from '../../mixins/user-role-check';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName', 'filterOption'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  options: [],
  selected: '',
});
const service = new AccountService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin, userRoleCheckMixin],
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
    },
    excludeAccount: {
      type: String,
    },
    showOptions: {
      type: Array,
      default: () => [],
    },
    accountsAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({ text: name, value: _id }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.accountsAvailable) {
      this.options = this.accountsAvailable;
    }
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
    canReadAccounts() {
      return this.hasRole('REVENUE-ACCOUNT_READ_ALL');
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    filterOption(option) {
      const excludeAccount = _.get(this, 'excludeAccount', '');
      if (excludeAccount !== '') {
        const optionId = _.get(option, '_id', '');
        return optionId !== excludeAccount;
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
      if (this.canReadAccounts && _.isEmpty(this.accountsAvailable)) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
    onAccountsListLoaded(options) {
      this.$emit('options-loaded', options);
    },
  },
};
