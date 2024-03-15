import { mapGetters } from 'vuex';
import ActiveUserSessionsSection from './active-user-sessions-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const validRoles = ['ACTIVE-USER-SESSION_READ_ALL'];

export default {
  components: {
    SectionContainer,
    ActiveUserSessionsSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return validRoles.some(role => hasRole(this.userLogged, role));
    },
    sectionTitle() {
      return this.canRead ? 'Active User Sessions' : 'Forbidden';
    },
  },
  mounted() {
    if (this.canRead) {
      this.$refs.breadcrumb.items = [{
        text: 'Active User Sessions',
        link: '#',
        type: 'active-user-sessions-grid',
        ts: Date.now(),
        query: null,
        active: true,
      }];
    }
  },
};
