export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      required: true,
    },
    dataE2eType: {
      type: String,
      default: '',
    },
  },
};
