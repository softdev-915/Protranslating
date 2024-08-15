import CompetenceLevelSection from './competence-level-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';

export default {
  components: {
    CompetenceLevelSection,
    SectionContainer,
  },
  mounted() {
    const self = this;
    self.$refs.userBreadcrumb.items = [{
      text: 'Competence Level Grid',
      link: '#',
      type: 'competence-level-inline-grid',
      ts: Date.now(),
      query: null,
      active: true,
    }];
  },
};
