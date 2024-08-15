import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import companyMinimumChargeSection from './company-minimum-charge-section.vue';
import SectionContainer from '../../section-container/section-container.vue';

export default {
  components: {
    SectionContainer,
    companyMinimumChargeSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'COMPANY-MIN-CHARGE_READ_ALL');
    },
  },
};
