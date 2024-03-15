import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CompromisedPasswordService from '../../../services/compromised-password-service';

export default {
  components: { ServerPaginationGrid },
  created() {
    this.service = new CompromisedPasswordService();
  },
};
