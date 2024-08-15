import { mapGetters } from 'vuex';
import PaymentMethodSection from './payment-method-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    PaymentMethodSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'PAYMENT-METHOD_READ_ALL');
    },
  },
};
