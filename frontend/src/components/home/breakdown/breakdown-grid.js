import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import BreakdownService from '../../../services/breakdown-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      breakdownService: new BreakdownService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'BREAKDOWN_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('breakdown-creation');
    },
    onEdit(eventData) {
      this.$emit('breakdown-edition', eventData);
    },
  },
};
