import { mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CustomQueryService from '../../../services/custom-query-service';
import { hasRole } from '../../../utils/user/index';
import CustomQueryGridLastResult from './custom-query-grid-last-result.vue';

export default {
  components: { ServerPaginationGrid },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'CUSTOM-QUERY_CREATE_OWN');
    },
  },
  created() {
    this.customQueryService = new CustomQueryService();
    this.components = { CustomQueryGridLastResult };
  },
  methods: {
    onCreateNew() {
      this.$emit('custom-query-creation');
    },
    onEdit(event) {
      this.$emit('custom-query-edition', event);
    },
  },
};
