import { mapGetters, mapActions } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import AuditService from '../../../services/audit-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      auditService: new AuditService(),
      approving: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
  },
};
