export default {
  props: {
    pageTemplates: {
      required: true,
      type: Array,
    },
    pageMarginValue: {
      type: String,
      default: '0',
    },
    footerTitle: {
      type: String,
      default: '',
    },
    currentPageNumber: {
      required: true,
      type: Number,
    },
    templateBlockId: {
      type: String,
      default: '',
    },
    dataE2eTypePreviewPage: {
      type: String,
      default: '',
    },
    dataE2eTypePageContent: {
      type: String,
      default: '',
    },
    dataE2eTypeFooter: {
      type: String,
      default: '',
    },
    dataE2eTypeFooterPageCount: {
      type: String,
      default: '',
    },
  },
  computed: {
    pageCount() {
      return this.pageTemplates.length;
    },
  },
};
