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
  },
  methods: {
    close() {
      this.$router.push({ name: 'ip-quote-dashboard' }).catch((err) => { console.log(err); });
    },
    navigateRequestEdition() {
      this.$router.push({
        name: 'quote-edition',
        params: { requestId: this.requestId },
      }).catch((err) => { console.log(err); });
    },
  },
};
