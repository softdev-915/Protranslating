import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../../utils/user';
import ServerPaginationGrid from '../../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ActivityTagService from '../../../../../services/activity-tag-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      activityTagService: new ActivityTagService(),
    };
  },
  props: {
    query: {
      type: Object,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'ACTIVITY-TAG_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEditInline(eventData) {
      this.$emit('activity-tag-edition', eventData);
    },
    onCreateInline() {
      this.$emit('activity-tag-creation');
    },
  },
};
