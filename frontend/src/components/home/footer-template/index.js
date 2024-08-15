import { mapGetters } from 'vuex';
import FooterTemplateSection from './footer-template-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    FooterTemplateSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'FOOTER-TEMPLATE_READ_ALL');
    },
  },
};
