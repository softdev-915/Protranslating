import { mapGetters } from 'vuex';
import DeliveryMethodSection from './delivery-method-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import { hasRole } from '../../../../utils/user';

export default {
  components: {
    DeliveryMethodSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'DELIVERY-METHOD_READ_ALL');
    },
  },
};
