import PaymentsSection from './ar-payment-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const READ_ROLES = ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_READ_OWN', 'AR-PAYMENT_READ_COMPANY'];
const CREATE_ROLES = ['AR-PAYMENT_CREATE_ALL', 'AR-PAYMENT-ACCT_READ_ALL'];
const EDIT_ROLES = ['AR-PAYMENT_UPDATE_ALL', 'AR-PAYMENT_UPDATE_OWN'];

export default {
  name: 'Index',
  mixins: [userRoleCheckMixin],
  components: {
    PaymentsSection,
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
      return EDIT_ROLES.some((r) => this.hasRole(r));
    },
  },
};

