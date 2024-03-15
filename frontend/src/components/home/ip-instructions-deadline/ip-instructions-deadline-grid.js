import { mapActions, mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import IpInstructionsDeadlineService from '../../../services/ip-instructions-deadline-service';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.ipInstructionsDeadlineService = new IpInstructionsDeadlineService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return this.hasRole('IP-INSTRUCTIONS-DEADLINE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('ip-instructions-deadline-creation');
    },
    onEdit(eventData) {
      this.$emit('ip-instructions-deadline-edition', eventData);
    },
  },
};
