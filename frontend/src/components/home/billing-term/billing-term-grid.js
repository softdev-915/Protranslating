import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import BillingTermService from '../../../services/billing-term-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      billingTermService: new BillingTermService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'BILLING-TERM_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('billing-term-creation');
    },
    onEdit(eventData) {
      this.$emit('billing-term-edition', eventData);
    },
  },
};
