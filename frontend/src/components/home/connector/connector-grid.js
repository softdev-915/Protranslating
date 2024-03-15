import ConnectorService from '../../../services/connector-service';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.service = new ConnectorService();
  },
  props: {
    query: Object,
  },
  methods: {
    onEdit(eventData) {
      this.$emit('connector-edition', eventData);
    },
  },
};
