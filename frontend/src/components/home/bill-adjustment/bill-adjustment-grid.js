import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import BillAdjustmentService from '../../../services/bill-adjustment-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.billAdjustmentService = new BillAdjustmentService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'BILL-ADJUSTMENT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEdit(eventData) {
      this.$emit('bill-adjustment-details', eventData);
    },
    onCreateInline() {
      this.$emit('bill-adjustment-creation');
    },
  },
};
