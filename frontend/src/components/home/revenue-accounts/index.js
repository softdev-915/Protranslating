import AccountsSection from './revenue-accounts-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const READ_ROLES = ['REVENUE-ACCOUNT_READ_ALL'];
const CREATE_ROLES = ['REVENUE-ACCOUNT_CREATE_ALL'];
const EDIT_ROLES = ['REVENUE-ACCOUNT_UPDATE_ALL'];

export default {
  mixins: [userRoleCheckMixin],
  components: {
    AccountsSection,
    SectionContainer,
  },
  computed: {
    canRead() {
      return READ_ROLES.some((r) => this.hasRole(r));
    },
    canCreate() {
      return CREATE_ROLES.some((r) => this.hasRole(r));
    },
    canEdit() {
      return EDIT_ROLES.some((r) => this.hasRole(r));
    },
  },
};
