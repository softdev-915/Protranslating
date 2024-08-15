import { mapGetters } from 'vuex';
import OpportunitySection from './opportunity-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    OpportunitySection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'OPPORTUNITY_READ_ALL')
        || hasRole(this.userLogged, 'OPPORTUNITY_READ_OWN');
    },
  },
};
