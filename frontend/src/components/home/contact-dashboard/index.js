import { mapGetters } from 'vuex';
import ContactDashboardSection from './contact-dashboard-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ContactDashboardSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return this.hasRole('CONTACT-DASHBOARD_READ_OWN') || this.hasRole('CONTACT-DASHBOARD-FILTER_READ_OWN');
    },
  },
};
