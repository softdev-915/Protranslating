export default {
  props: {
    status: {
      type: String,
      required: true,
    },
    withTitle: {
      type: Boolean,
      default: true,
    },
  },
  created() {
    this.SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR = 'CONFIRMED_BY_TRANSLATOR';
    this.SEGMENT_STATUS_CONFIRMED_BY_EDITOR = 'CONFIRMED_BY_EDITOR';
    this.SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR = 'CONFIRMED_BY_QA_EDITOR';
  },
};
