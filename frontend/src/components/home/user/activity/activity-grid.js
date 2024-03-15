import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ActivityService from '../../../../services/activity-service';
import UserService from '../../../../services/user-service';

const createRoles = [
  'ACTIVITY-NC-CC_CREATE_ALL',
  'ACTIVITY-NC-CC_CREATE_OWN',
  'ACTIVITY-VES1_CREATE_ALL',
  'ACTIVITY-CA_CREATE_ALL',
  'ACTIVITY-USER-NOTE_CREATE_ALL',
];
const USER_ACTIVITY_GRID_ROUTE_NAME = 'user-activity-grid';
const activityService = new ActivityService();
const userService = new UserService();

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      loading: false,
      user: {
        firstName: '',
        lastName: '',
      },
    };
  },
  props: {
    query: {
      type: Object,
    },
  },
  created() {
    this.loading = true;
    if (this.$route.name === USER_ACTIVITY_GRID_ROUTE_NAME) {
      const userId = Object.values(this.$route.params)[0]
        || this.$route.path.split('/')[2];
      if (userId) {
        userService.retrieveLean({
          userId,
          aggregate: false,
          attributes: ['firstName', 'lastName'].join(' '),
        }).then((response) => {
          this.user = _.get(response, 'data.user');
        }).finally(() => {
          this.loading = false;
        });
      }
    } else {
      this.loading = false;
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return createRoles.some((r) => hasRole(this.userLogged, r));
    },
    gridQuery() {
      if (_.isNil(this.query) && this.$route.name === USER_ACTIVITY_GRID_ROUTE_NAME) {
        return { filter: JSON.stringify({ users: `${this.user.firstName} ${this.user.lastName}` }) };
      }
      return this.query;
    },
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
