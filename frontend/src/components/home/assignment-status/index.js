import { mapGetters } from 'vuex';
import AssignmentStatusSection from './assignment-status-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    AssignmentStatusSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'ASSIGNMENT-STATUS_READ_ALL');
    },
  },
};
