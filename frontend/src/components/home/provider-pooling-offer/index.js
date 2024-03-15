import { mapGetters } from 'vuex';
import ProviderPoolingOfferSection from './provider-pooling-offer-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    ProviderPoolingOfferSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'OFFER_READ_ALL');
    },
  },
};
