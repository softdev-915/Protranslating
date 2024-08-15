import { mapGetters } from 'vuex';
import ExpenseAccountSection from './expense-account-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    ExpenseAccountSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_READ_ALL');
    },
  },
};
