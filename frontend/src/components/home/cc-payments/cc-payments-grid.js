import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CcPaymentsService from '../../../services/cc-payment-service';

const service = new CcPaymentsService();

export default {
  data: () => ({ service }),
  components: {
    ServerPaginationGrid,
  },
  methods: {
    onEdit() {

    },
  },
};
