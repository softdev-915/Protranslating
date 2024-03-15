import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CurrencyService from '../../../services/currency-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      currencyService: new CurrencyService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'CURRENCY_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('currency-creation');
    },
    onEdit(eventData) {
      this.$emit('currency-edition', eventData);
    },
  },
};
