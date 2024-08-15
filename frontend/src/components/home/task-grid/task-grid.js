import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import TaskService from '../../../services/task-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  props: {
    query: {
      type: Object,
    },
  },
  created() {
    this.taskService = new TaskService(this.userLogged);
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canSort() {
      const query = _.get(this, '$route.query.filter', '');
      if (_.isEmpty(query)) {
        return false;
      }
      return Object.keys(JSON.parse(query)).length > 1;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEdit(event) {
      this.$emit('task-details', event);
    },
    keyProp(item, index) {
      return `${item._id}_${index}`;
    },
  },
};
