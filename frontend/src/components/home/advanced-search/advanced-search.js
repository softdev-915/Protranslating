export default {
  data() {
    return {
      expanded: false,
    };
  },
  computed: {
    arrowClass() {
      return this.expanded ? 'fa-chevron-up' : 'fa-chevron-down';
    },
  },
};
