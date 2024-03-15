import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import PaymentService from '../../../services/ar-payment-service';

export default {
  props: {
    canCreate: {
      type: Boolean,
      default: false,
    },
    canUpdate: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.service = new PaymentService();
  },
  methods: {
    onCreateNew() {
      this.$router.push({ name: 'payment-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(event) {
      this.$router.push({ name: 'payment-detail', params: { entityId: event.item._id } }).catch((err) => { console.log(err); });
    },
  },
};
