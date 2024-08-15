import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import SoftwareRequirementService from '../../../../services/software-requirement-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.softwareRequirementService = new SoftwareRequirementService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'SOFTWARE-REQUIREMENT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('software-requirement-creation');
    },
    onEdit(eventData) {
      this.$emit('software-requirement-edition', eventData);
    },
  },
};
