import { mapActions, mapGetters } from 'vuex';
import { selectMixin } from '../../../../../mixins/select-mixin';
import CurrencyService from '../../../../../services/currency-service';
import ServiceRequestLocker from '../../../../../services/service-request-locker';

const buildInitialState = () => ({
  options: [],
  loading: false,
  selectedOption: {},
});
const service = new CurrencyService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin],
  props: {
    value: {
      type: [Object, String],
    },
    isDisabled: {
      type: Boolean,
      default: true,
    },
    dataE2EType: {
      type: String,
      required: false,
      default: 'select',
    },
    currenciesAvailable: {
      type: Array,
    },
    placeholder: {
      type: String,
    },
    defaultOption: {
      type: Object,
      required: false,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.fillOptionList().then(this.setDefaultOption);
  },
  watch: {
    value(newValue) {
      this._selectOption(newValue);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'currencyList']),
    currencyOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((c) => ({
          text: c.name,
          value: c._id,
        }));
      }
      return [];
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setCurrencyList']),
    _selectOption(newValue) {
      if (typeof newValue === 'string' && Array.isArray(this.options)) {
        const currency = this.options.find((b) => b._id === newValue);
        if (currency) {
          this.selectedOption = {
            text: currency.name,
            value: currency._id,
          };
        } else {
          this.selectedOption = {
            text: '',
            value: '',
          };
        }
        this.$emit('input', this.selectedOption.value);
      }
    },
    onCurrencySelected(currency) {
      this.$emit('input', currency.value);
    },
    _retrieveCurrencies() {
      if (this.currencyList.length > 0) return;
      this.loading = true;
      return serviceRequestLocker.retrieve()
        .then((response) => {
          this.options = response.data.list;
          this.setCurrencyList(this.options);
          return this.options;
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Currencies could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
          this._selectOption(this.value);
        });
    },
    fillOptionList() {
      if (this.currenciesAvailable) {
        this.options = this.currenciesAvailable;
      } else {
        return this._retrieveCurrencies();
      }
      return Promise.resolve([]);
    },
    setDefaultOption() {
      if (this.defaultOption && !this.value) {
        const currency = this.options.find((o) => o.name === this.defaultOption.name);
        if (currency) {
          this._selectOption(currency._id);
        }
      }
    },
  },
};
