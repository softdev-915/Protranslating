import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import InvoiceAdjustmentService from '../../../services/ar-adjustment-service';

export default {
  data: () => ({
    service: new InvoiceAdjustmentService(),
  }),
  props: {
    canCreate: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ServerPaginationGrid,
  },
  methods: {
    onCreateNew() {
      this.$router.push({ name: 'adjustment-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(event) {
      this.$router.push({ name: 'adjustment-detail', params: { entityId: event.item._id } }).catch((err) => { console.log(err); });
    },
  },
};
