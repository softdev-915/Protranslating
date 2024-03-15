import { mapGetters } from 'vuex';
import SoftwareRequirementSection from './software-requirement-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import { hasRole } from '../../../../utils/user';

export default {
  components: {
    SoftwareRequirementSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'SOFTWARE-REQUIREMENT_READ_ALL');
    },
  },
};
