import { mapGetters, mapActions } from 'vuex';
import _ from 'lodash';
import CurrencyExchangeActions from './currency-exchange-actions.vue';
import CurrencySelector from '../../currency-select/currency-selector.vue';

export default {
  components: {
    CurrencySelector,
    CurrencyExchangeActions,
  },
  props: {
    value: {
      type: Array,
    },
    canEdit: {
      type: Boolean,
    },
  },
  data() {
    return {
      exchangeDetails: [],
      currencies: [],
      loadingCurrencies: false,
    };
  },
  watch: {
    value: {
      immediate: true,
      handler: function (newValue) {
        if (newValue.length > 0) {
          this.exchangeDetails = newValue;
        }
      },
    },
  },
  computed: {
    ...mapGetters('app', ['localCurrency', 'lsp', 'currencyList']),
    details() {
      return this.value;
    },
    baseCurrencies() {
      return [this.localCurrency._id];
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setCurrencyList']),
    onCurrencyKeyPress(event) {
      if (event.charCode === 13) {
        event.preventDefault();
      }
    },
    shouldDisableCurrency(detail) {
      if (!this.canEdit) {
        return true;
      }
      return detail.base === detail.quote && !_.isNil(detail.base);
    },
    onExchangeAdd(index) {
      const base = _.get(this, 'value[0].base');
      const newExchange = {
        base,
        quote: '',
        quotation: 0,
      };
      this.value.splice(++index, 0, newExchange);
      this.$emit('input', this.value);
    },
    onExchangeDelete(index) {
      if (index === 0) {
        return false;
      }
      const currencyDetail = this.exchangeDetails[index];
      if (currencyDetail.base === currencyDetail.quote) {
        return false;
      }
      this.$emit('exchange-delete', index);
    },
    formatCurrencySelectOption: ({ isoCode, _id }) => ({
      text: isoCode,
      value: _id,
    }),
  },
};
