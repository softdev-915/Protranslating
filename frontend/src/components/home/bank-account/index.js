import BankAccountSection from './bank-account-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: { BankAccountSection, SectionContainer },
  computed: {
    canRead() {
      return ['BANK-ACCOUNT_READ_ALL'].some((role) => this.hasRole(role));
    },
    canCreate() {
      return ['BANK-ACCOUNT_CREATE_ALL'].some((role) => this.hasRole(role));
    },
    canEdit() {
      return ['BANK-ACCOUNT_UPDATE_ALL'].some((role) => this.hasRole(role));
    },
  },
};
