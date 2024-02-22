export default {
  props: {
    value: {
      type: Number,
      default: 0,
    },
    hasQaIssues: Boolean,
  },
  computed: {
    progressColor() {
      if (this.value === 100) {
        if (this.hasQaIssues) {
          return 'yellow';
        }
        return 'lightgreen';
      }
      if (this.value === 0) {
        return 'red';
      }
      return 'lightsalmon';
    },
    displayedProgress() {
      return this.value.toFixed(2);
    },
    title() {
      if (this.hasQaIssues) {
        return 'Has QA issues';
      }
    },
  },
};
