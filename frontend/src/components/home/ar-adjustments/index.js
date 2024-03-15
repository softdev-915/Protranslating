import AdjustmentsSection from './ar-adjustment-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const READ_ROLES = ['AR-ADJUSTMENT_READ_ALL', 'AR-ADJUSTMENT_READ_OWN', 'AR-ADJUSTMENT_READ_COMPANY'];
const CREATE_ROLES = ['AR-ADJUSTMENT_CREATE_ALL', 'AR-ADJUSTMENT-ACCT_READ_ALL'];

export default {
  name: 'Index',
  mixins: [userRoleCheckMixin],
  components: {
    AdjustmentsSection,
    SectionContainer,
  },
  computed: {
    canRead() {
      return READ_ROLES.some((r) => this.hasRole(r));
    },
    canCreate() {
      return this.hasRole(CREATE_ROLES);
    },
    canEdit() {
      return READ_ROLES.some((r) => this.hasRole(r));
    },
  },
};
