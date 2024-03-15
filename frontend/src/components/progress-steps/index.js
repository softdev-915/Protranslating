export default {
  name: 'ProgressSteps',
  props: {
    steps: {
      type: Array,
      default: () => [],
    },
    current: {
      type: Number,
      default: 0,
    },
    stepClass: {
      type: String,
      default: 'step-four',
    },
  },
};
