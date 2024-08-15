import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import locationSection from './location-section.vue';
import SectionContainer from '../../section-container/section-container.vue';

export default {
  components: {
    SectionContainer,
    locationSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'LOCATION_READ_ALL');
    },
  },
};
