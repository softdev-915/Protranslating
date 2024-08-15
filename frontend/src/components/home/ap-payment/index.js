import { mapGetters } from 'vuex';
import ApPaymentSection from './ap-payment-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    ApPaymentSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'].some((r) => hasRole(this.userLogged, r));
    },
  },
};
