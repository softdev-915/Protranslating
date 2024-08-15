import CcPaymentsSection from './cc-payments-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const READ_ROLES = ['CC-PAYMENT_READ_ALL', 'CC-PAYMENT_READ_OWN', 'CC-PAYMENT_READ_COMPANY'];

export default {
  mixins: [userRoleCheckMixin],
  components: {
    CcPaymentsSection,
    SectionContainer,
  },
  computed: {
    canRead() {
      return READ_ROLES.some((r) => this.hasRole(r));
    },
  },
};
