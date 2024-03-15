import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import NotificationService from '../../../services/notification-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      notificationService: new NotificationService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return false;
    },
    canSetup() {
      return hasRole(this.userLogged, 'RESTORE_UPDATE_ALL');
    },
  },
  methods: {
    onShowDetail(eventData) {
      this.$emit('notification-detail', eventData);
    },
    onSetupAction() {
      this.$emit('notification-advanced-settings');
    },
  },
};
