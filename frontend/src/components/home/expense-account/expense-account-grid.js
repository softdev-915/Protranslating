import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ExpenseAccountService from '../../../services/expense-account-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.expenseAccountService = new ExpenseAccountService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('expense-account-creation');
    },
    onEdit(eventData) {
      this.$emit('expense-account-edition', eventData);
    },
  },
};
