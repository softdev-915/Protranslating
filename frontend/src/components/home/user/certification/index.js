import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import CertificationSection from './certification-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';

// ik-todo: move certification components from user folder

export default {
  components: {
    SectionContainer,
    CertificationSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },
  },
};
