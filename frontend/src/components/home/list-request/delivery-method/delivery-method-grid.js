import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import DeliveryMethodService from '../../../../services/delivery-method-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.deliveryMethodService = new DeliveryMethodService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'DELIVERY-METHOD_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('delivery-method-creation');
    },
    onEdit(eventData) {
      this.$emit('delivery-method-edition', eventData);
    },
  },
};
