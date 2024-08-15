import { mapGetters } from 'vuex';
import AbilityExpenseAccountSection from './ability-expense-account-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    AbilityExpenseAccountSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_READ_ALL');
    },
  },
};
