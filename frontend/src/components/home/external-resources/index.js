import { mapGetters } from 'vuex';
import ExternalResourcesSection from './external-resources-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const EXT_RES_READ_ALL = 'EXTERNAL-RESOURCES_READ_ALL';
const EXT_RES_UPDATE_ALL = 'EXTERNAL-RESOURCES_UPDATE_ALL';

export default {
  components: {
    ExternalResourcesSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, EXT_RES_READ_ALL)
      || hasRole(this.userLogged, EXT_RES_UPDATE_ALL);
    },
  },
};
