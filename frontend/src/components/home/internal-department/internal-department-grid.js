import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import InternalDepartmentService from '../../../services/internal-department-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      internalDepartmentService: new InternalDepartmentService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'INTERNAL-DEPARTMENT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('internal-department-creation');
    },
    onEdit(eventData) {
      this.$emit('internal-department-edition', eventData);
    },
  },
};
