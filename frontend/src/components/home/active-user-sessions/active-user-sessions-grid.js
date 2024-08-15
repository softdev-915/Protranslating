import { mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ActiveUserSessionsService from '../../../services/active-user-sessions-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      activeUserSessionsService: new ActiveUserSessionsService(),
      approving: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
};
