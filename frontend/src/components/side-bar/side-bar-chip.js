export default {
  props: {
    loading: {
      type: Boolean,
      default: () => false,
    },
    number: {
      type: Number,
      default: () => 0,
    },
  },
  computed: {
    chipClass() {
      if (this.loading) {
        return 'fas fa-spinner fa-spin fa-3x fa-fw';
      } if (this.number === 0) {
        return 'side-bar-chip-black';
      }
      return 'side-bar-chip-orange';
    },
  },
};
