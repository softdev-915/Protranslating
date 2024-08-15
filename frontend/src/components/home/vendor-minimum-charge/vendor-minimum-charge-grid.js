import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import VendorMinimumCharge from '../../../services/vendor-minimum-charge-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.vendorMinimumChargeService = new VendorMinimumCharge();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'VENDOR-MIN-CHARGE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('vendor-minimum-charge-creation');
    },
    onEdit(eventData) {
      this.$emit('vendor-minimum-charge-edition', eventData);
    },
  },
};
