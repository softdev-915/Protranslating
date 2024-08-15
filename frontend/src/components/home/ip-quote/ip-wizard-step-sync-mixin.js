import _ from 'lodash';
/* global window, global*/

export default {
  created() {
    const currentStep = _.get(this.$route, 'query.step');
    if (_.isNil(currentStep) || currentStep !== '1') {
      const query = { ...this.$route.query, step: 1 };
      this.$router.replace({ name: this.$route.name, query });
    }
  },
  methods: {
    async scrollToTop() {
      const element = this.$refs.wizardHeader;
      if (element) {
        await this.$nextTick();
        await element.scrollIntoView({ behavior: 'smooth' });
      }
    },
  },
  watch: {
    currentStep(step) {
      const query = { ...this.$route.query, step: step + 1 };
      this.$router.replace({ name: this.$route.name, query });
    },
  },
};
