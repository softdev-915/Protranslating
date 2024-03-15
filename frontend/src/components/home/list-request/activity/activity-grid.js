import { mapActions } from 'vuex';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ActivityService from '../../../../services/activity-service';

const activityService = new ActivityService();

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ServerPaginationGrid,
  },
  props: {
    query: {
      type: Object,
    },
  },
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEditInline(eventData) {
      this.$emit('activity-edition', eventData);
    },
    onCreateInline() {
      this.$emit('activity-creation');
    },
    _activityService() {
      return activityService;
    },
  },
};
