import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import GroupService from '../../../services/group-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      groupService: new GroupService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'GROUP_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('group-creation');
    },
    onEdit(eventData) {
      this.$emit('group-edition', eventData);
    },
  },
};
