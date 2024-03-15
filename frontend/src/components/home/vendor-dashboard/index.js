import { mapGetters } from 'vuex';
import VendorDashboardSection from './vendor-dashboard-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    VendorDashboardSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return this.hasRole({ oneOf: ['VENDOR-DASHBOARD_READ_OWN', 'VENDOR-DASHBOARD-FILTER_READ_OWN'] });
    },
  },
};
