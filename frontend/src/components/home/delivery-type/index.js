import { mapGetters } from 'vuex';
import DeliveryTypeSection from './delivery-type-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    DeliveryTypeSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'DELIVERY-TYPE_READ_ALL');
    },
  },
};
