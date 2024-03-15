import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import OpportunityService from '../../../services/opportunity-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      opportunityService: new OpportunityService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'OPPORTUNITY_CREATE_ALL')
       || hasRole(this.userLogged, 'OPPORTUNITY_CREATE_OWN');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('opportunity-creation');
    },
    onEdit(eventData) {
      this.$emit('opportunity-edition', eventData);
    },
  },
};
