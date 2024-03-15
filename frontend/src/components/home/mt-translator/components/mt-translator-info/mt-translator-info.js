export default {
  props: {
    mtNode: {
      type: String,
      default: '',
    },
    mtModel: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      isExpanded: false,
    };
  },
  methods: {
    onExpandClick() {
      this.isExpanded = !this.isExpanded;
    },
  },
};
