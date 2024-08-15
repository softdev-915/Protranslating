import { mapGetters } from 'vuex';
import LeadSourceSection from './lead-source-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    LeadSourceSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'LEAD-SOURCE_READ_ALL');
    },
  },
};
