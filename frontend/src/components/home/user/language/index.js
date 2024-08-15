import LanguageSection from './language-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';

export default {
  components: {
    LanguageSection,
    SectionContainer,
  },
  mounted() {
    const self = this;
    self.$refs.userBreadcrumb.items = [{
      text: 'Language Grid',
      link: '#',
      type: 'language-inline-grid',
      ts: Date.now(),
      query: null,
      active: true,
    }];
  },
};
