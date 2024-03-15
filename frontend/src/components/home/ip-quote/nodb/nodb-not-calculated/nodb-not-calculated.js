import _ from 'lodash';

export default {
  name: 'nodb-not-calculated',
  props: {
    requestNumber: {
      type: String,
      default: 'YYDDMM-#',
    },
    requestId: {
      type: String,
      default: '',
    },
    sourceLanguage: {
      type: String,
      default: '',
    },
    quotedCountries: {
      type: String,
      default: '',
    },
    isNew: {
      type: Boolean,
      default: true,
    },
    areCountsChanged: {
      type: Boolean,
      default: false,
    },
    isNewCountryAdded: {
      type: Boolean,
      default: false,
    },
    isInstantSourceLanguage: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    close() {
      this.$router.push({ name: 'ip-quote-dashboard' }).catch((err) => { console.log(err); });
    },
    navigateRequestEdition() {
      this.$router.push({
        name: 'quote-edition',
        text: 'Quote Edition',
        params: { requestId: this.requestId },
      }).catch((err) => { console.log(err); });
    },
  },
  computed: {
    messageText() {
      const language = this.sourceLanguage.trim();
      const tail = `our team is now updating your customized quote for the following countries (${this.quotedCountries}).`;
      if (this.isNew) {
        return `Since the patent was published in ${language}, our team will prepare your customized quote for the following countries (${this.quotedCountries})`;
      }
      if (this.areCountsChanged && !this.isInstantSourceLanguage) {
        return `Since your patent is published in ${language}, and the patent count values have been updated with values different from the original quote, ${tail}`;
      }
      if (this.areCountsChanged) {
        return `Since your quote contains custom quote countries and the patent counts values have been updated with values different from the original quote, ${tail}`;
      }
      if (this.isNewCountryAdded) {
        return `Due to your patent being published in ${language} and your selection of at least one new country not available in the original quote, ${tail}`;
      }
      return '';
    },
    titleText() {
      return _.isEmpty(this.messageText) ? 'Quote Updated!' : 'You are almost there!';
    },
    neededQuote() {
      return !_.isEmpty(this.quotedCountries);
    },
  },
};
