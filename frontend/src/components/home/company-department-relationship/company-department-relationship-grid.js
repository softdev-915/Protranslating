import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CompanyDepartmentRelationshipService from '../../../services/company-department-relationship-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.companyDepartmentRelationshipService = new CompanyDepartmentRelationshipService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'COMPANY-DEPT-RELATIONSHIP_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('company-department-relationship-creation');
    },
    onEdit(eventData) {
      this.$emit('company-department-relationship-edition', eventData);
    },
  },
};
