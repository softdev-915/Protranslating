import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ServiceTypeService from '../../../services/service-type-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.serviceTypeService = new ServiceTypeService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'SERVICE-TYPE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('service-type-creation');
    },
    onEdit(eventData) {
      this.$emit('service-type-edition', eventData);
    },
  },
};
