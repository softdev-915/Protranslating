import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import AssignmentStatusService from '../../../services/assignment-status-service';

const assignmentStatusService = new AssignmentStatusService();

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {};
  },
  created() {
    this.assignmentStatusService = assignmentStatusService;
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'ASSIGNMENT-STATUS_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('assignment-status-creation');
    },
    onEdit(eventData) {
      this.$emit('assignment-status-edition', eventData);
    },
  },
};
