import _ from 'lodash';

export default {
  props: {
    entityId: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    requestEntity: null,
    quoteCurrency: null,
    translationOnly: false,
    originalRequest: null,
    countNames: [],
    originalCounts: {},
  }),
  computed: {
    isNew() {
      return _.isEmpty(this.entityId);
    },
    discardButtonText() {
      return this.isNew ? 'Discard Quote' : 'Discard Changes';
    },
    areCountsChanged() {
      if (this.isNew) {
        return true;
      }
      return this.countNames.some((countName) => {
        const value = Number(_.get(this, countName, 0));
        const originalValue = Number(_.get(this.originalCounts, countName, 0));
        return value !== originalValue;
      });
    },
    countryNames() {
      return this.selectedCountries.map(c => c.name);
    },
    countryNamesStr() {
      return this.countryNames.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join(', ');
    },
    totalFee() {
      return _.reduce(
        this.translationFees.filter(fee => !fee.neededQuotation),
        (sum, current) =>
          sum + this.calculateTotal(current),
        0,
      ).toFixed(2);
    },
    modalTitle() {
      return this.isOrder
        ? 'Order Saved!'
        : `Quote ${this.isNew ? 'Saved' : 'Updated'}!`;
    },
    modalDescription() {
      return this.isOrder
        ? `Order ${this.isNew ? 'created' : 'updated'} successfully!`
        : `Quote ${this.isNew ? 'created' : 'updated'} successfully!`;
    },
    finalTitle() {
      return `Your${this.isNew ? ' ' : ' Updated '}Instant Quote`;
    },
  },
  methods: {
    calculateTotal(fee) {
      const isoCode = this.quoteCurrency.isoCode;
      let total = Number(fee.translationFeeCalculated[isoCode]);
      if (!this.translationOnly) {
        total += fee.agencyFeeCalculated[isoCode] + fee.officialFeeCalculated[isoCode];
      }
      return total;
    },
    createOrUpdateRequest(isApproved = false) {
      if (this.isNew) {
        return this.createRequest(isApproved);
      }
      return this.updateRequest(isApproved);
    },
    redirectToEditPage() {
      const requestId = _.get(this.requestEntity, '_id', '');
      this.$router.push({
        name: 'quote-edition',
        params: { requestId },
      });
    },
    redirectToQuoteDetailPage() {
      const requestId = _.get(this.requestEntity, '_id', '');
      this.$router.push({
        name: 'request-quote-detail',
        params: { requestId },
      });
    },

    formatFee(fee) {
      const value = (+fee).toFixed(2);
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    formatNumber(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
  },
};
