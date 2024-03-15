import _ from 'lodash';
import { mapGetters } from 'vuex';
import { selectMixin } from '../../mixins/select-mixin';
import { hasRole } from '../../utils/user';
import ExpenseAccountService from '../../services/expense-account-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'preFetchOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const service = new ExpenseAccountService();
const serviceRequestLocker = new ServiceRequestLocker(service);
const buildInitialState = () => ({ options: [], selected: null });

export default {
  components: { SimpleBasicSelect },
  mixins: [selectMixin],
  props: {
    value: {
      type: String,
    },
    expenseAccountsAvailable: {
      type: Array,
    },
    retrieveOnInit: {
      type: Boolean,
      default: false,
    },
    mandatory: {
      type: Boolean,
      default: false,
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
    if (this.expenseAccountsAvailable) {
      this.options = this.expenseAccountsAvailable;
    }
    if (this.fetchOnCreated) {
      this._retrieve();
      this.preFetchOption = {};
    } else {
      const value = _.get(this, 'value', {});
      this.preFetchOption = this.formatOption(value);
    }
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
  methods: {
    _retrieve() {
      if (hasRole(this.userLogged, 'EXPENSE-ACCOUNT_READ_ALL')) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
  },
};
