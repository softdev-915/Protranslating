import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import LeadSourceService from '../../../services/lead-source-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      leadSourceService: new LeadSourceService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'LEAD-SOURCE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('lead-source-creation');
    },
    onEdit(eventData) {
      this.$emit('lead-source-edition', eventData);
    },
  },
};
