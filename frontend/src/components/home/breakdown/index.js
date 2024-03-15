import { mapGetters } from 'vuex';
import BreakdownSection from './breakdown-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    BreakdownSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'BREAKDOWN_READ_ALL');
    },
  },
};
