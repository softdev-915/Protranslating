export default {
  methods: {
    trackSaveAndExportQuote(combination) {
      this.$ua.trackEvent(`Quote Creation ${combination}`, 'Click', 'Save & Export to PDF-Action');
    },
    trackSaveQuote(combination) {
      this.$ua.trackEvent(`Quote Creation ${combination}`, 'Click', 'Save Quote-Action');
    },
    trackDiscardQuote(combination) {
      this.$ua.trackEvent(`Quote Creation ${combination}`, 'Click', 'Discard Quote-Action');
    },
    trackDeleteQuote(combination) {
      this.$ua.trackEvent(`Quote Deletion ${combination}`, 'Click', 'Discard Quote');
    },
    trackApproveQuote(combination) {
      this.$ua.trackEvent(`Quote Creation ${combination}`, 'Click', 'Approve Quote-Action');
    },
    trackSubmitQuote(combination) {
      this.$ua.trackEvent(`Quote Approval ${combination}`, 'Click', 'Submit Order');
    },

    trackSubmitOrder(combination) {
      this.$ua.trackEvent(`Order Creation ${combination}`, 'Click', 'Submit Order');
    },
    trackDiscardOrder(combination) {
      this.$ua.trackEvent(`Order Creation ${combination}`, 'Click', 'Discard Order-Action');
    },
    trackDeleteOrder(combination) {
      this.$ua.trackEvent(`Order Deletion ${combination}`, 'Click', 'Discard Order');
    },
  },
};
