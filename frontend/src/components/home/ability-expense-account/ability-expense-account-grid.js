import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import AbilityExpenseAccountService from '../../../services/ability-expense-account-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.abilityExpenseAccountService = new AbilityExpenseAccountService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('ability-expense-account-creation');
    },
    onEdit(eventData) {
      this.$emit('ability-expense-account-edition', eventData);
    },
  },
};
