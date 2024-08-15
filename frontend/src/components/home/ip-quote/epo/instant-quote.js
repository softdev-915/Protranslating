import _ from 'lodash';
import IpSelect from '../components/ip-select.vue';
import IpCardSection from '../components/ip-card-section.vue';
import ipQuoteHelperMixin from '../ip-quote-helper-mixin';

export default {
  mixins: [ipQuoteHelperMixin],
  props: {
    translationFees: {
      type: Array,
      default: () => [],
    },
    claimsTranslationFees: {
      type: Array,
      default: () => [],
    },
    disclaimers: {
      type: Array,
      default: () => [],
    },
    quoteCurrency: {
      type: Object,
      default: () => ({}),
    },
    epo: {
      type: Object,
      default: () => ({}),
    },
    currencies: {
      type: Array,
      default: () => ([]),
    },
    translationOnly: {
      type: Boolean,
      default: false,
    },
    isOrder: {
      type: Boolean,
      default: false,
    },
    epoTemplate: {
      type: String,
      default: '',
    },
    isNew: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      currencySelected: {
        _id: '',
        isoCode: '',
        default: false,
      },
      annuityPaymentRow: {
        name: 'Annuity Payment',
        message: 'This will be sent to you in a separate email',
      },
    };
  },
  components: {
    IpSelect,
    IpCardSection,
  },
  watch: {
    totalFee() {
      this.$emit('total-fee-calculated', this.totalFee);
    },
    quoteCurrency: {
      immediate: true,
      handler() {
        this.currencySelected = this.quoteCurrency;
      },
    },
    currencySelected(newCurrency, oldCurrency) {
      if (_.isNil(newCurrency) || _.isNil(oldCurrency)) return;
      if (newCurrency._id !== oldCurrency._id) {
        this.$emit('currency-selected', newCurrency);
      }
    },
  },
  computed: {
    translationFeeSorted() {
      return this.translationFees.sort(
        (a, b) => ((a.country > b.country || a.englishTranslation) ? 1 : -1),
      );
    },
    claimsTranslationFeesSorted() {
      return this.claimsTranslationFees.sort((a, b) => ((a.language > b.language) ? 1 : -1));
    },
    isPatentTranslationFeesEmpty() {
      return _.isEmpty(this.translationFees);
    },
    totalFee() {
      const fees = [...this.translationFees, ...this.claimsTranslationFees];
      return _.reduce(fees, (sum, fee) => sum + this.feeTotal(fee), 0).toFixed(2);
    },
    isB1Available() {
      return this.epo.kind === 'B1';
    },
    isClaimsGrantedCountries() {
      if (_.isNil(this.epo.otherLanguages)) {
        return false;
      }
      return this.epo.otherLanguages.some((l) => l.selected);
    },
    showAnnuityPaymentRow() {
      return _.get(this.epo, 'isAnnuityQuotationRequired', false) && !this.isOrder && !this.translationOnly;
    },
    finalTitle() {
      return `Your${this.isNew ? ' ' : ' Updated '}Instant Quote`;
    },
  },
  methods: {
    formatFee(fee) {
      const value = (+fee).toFixed(2);
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    feeTotal(fee) {
      const { isoCode } = this.quoteCurrency;
      let total = Number(fee.calculatedFee[isoCode]);
      if (!this.translationOnly) {
        total += fee.agencyFeeFixed[isoCode] + fee.officialFee[isoCode];
      }
      return total;
    },
    translationFeeE2eType(fee) {
      return `${fee.country ? fee.country : fee.language}-translation-fee`;
    },
  },
};
