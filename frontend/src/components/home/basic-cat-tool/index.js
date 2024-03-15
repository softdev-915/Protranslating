import { mapGetters } from 'vuex';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const validRoles = ['AUDIT_READ_ALL'];

export default {
  components: {
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return validRoles.some((role) => hasRole(this.userLogged, role));
    },
    sectionTitle() {
      return this.canRead ? 'Basic CAT Tool' : 'Forbidden';
    },
  },
};
