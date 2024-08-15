import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import PaymentMethodService from '../../../services/payment-method-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      paymentMethodService: new PaymentMethodService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'PAYMENT-METHOD_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('payment-method-creation');
    },
    onEdit(eventData) {
      this.$emit('payment-method-edition', eventData);
    },
  },
};
