import { mapGetters } from 'vuex';
import BillingTermSection from './billing-term-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    BillingTermSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'BILLING-TERM_READ_ALL');
    },
  },
};
