import { mapActions } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ProviderInstructionsService from '../../../services/provider-instructions-service';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  components: {
    ServerPaginationGrid,
  },
  mixins: [userRoleCheckMixin],
  data() {
    return {
      providerInstructionsService: new ProviderInstructionsService(),
    };
  },
  computed: {
    canCreate: function () {
      return this.hasRole('PROVIDER-TASK-INSTRUCTIONS_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('provider-instructions-creation');
    },
    onEdit(eventData) {
      this.$emit('provider-instructions-edition', eventData);
    },
  },
};
