import { mapGetters } from 'vuex';
import VendorMinimumChargeSection from './vendor-minimum-charge-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    VendorMinimumChargeSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'VENDOR-MIN-CHARGE_READ_ALL');
    },
  },
};
