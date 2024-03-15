import CatToolSection from './cat-tool-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';

export default {
  components: {
    CatToolSection,
    SectionContainer,
  },
  mounted() {
    const self = this;
    self.$refs.userBreadcrumb.items = [{
      text: 'Tool Grid',
      link: '#',
      type: 'cat-tool-inline-grid',
      ts: Date.now(),
      query: null,
      active: true,
    }];
  },
};
