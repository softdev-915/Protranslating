import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import DeliveryTypeService from '../../../services/delivery-type-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.deliveryTypeService = new DeliveryTypeService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'DELIVERY-TYPE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('delivery-type-creation');
    },
    onEdit(eventData) {
      this.$emit('delivery-type-edition', eventData);
    },
  },
};
