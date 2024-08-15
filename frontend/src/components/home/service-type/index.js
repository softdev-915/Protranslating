import { mapGetters } from 'vuex';
import ServiceTypeSection from './service-type-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    ServiceTypeSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'SERVICE-TYPE_READ_ALL');
    },
  },
};
