import CompanySection from './company-section.vue';
import SectionContainer from '../../section-container/section-container.vue';

export default {
  components: {
    CompanySection,
    SectionContainer,
  },
  mounted() {
    const self = this;
    self.$refs.companyBreadcrumb.items = [{
      text: 'Companies Grid',
      link: '#',
      type: 'company-inline-grid',
      ts: Date.now(),
      query: null,
      active: true,
    }];
  },
};
