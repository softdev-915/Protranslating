import TemplateSection from './template-section.vue';
import SectionContainer from '../../section-container/section-container.vue';

import { hasRole } from '../../../utils/user';

export default {
  components: {
    TemplateSection,
    SectionContainer,
  },
  computed: {
    canRead() {
      return hasRole(this.userLogged, 'TEMPLATE_READ_ALL');
    },
  },
};
