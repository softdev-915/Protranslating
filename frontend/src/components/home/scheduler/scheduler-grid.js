import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import SchedulerService from '../../../services/scheduler-service';

export default {
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
      schedulerService: new SchedulerService(),
    };
  },
  computed: {
    canCreate: function () {
      return false;
    },
  },
  methods: {
    onEdit(eventData) {
      this.$emit('scheduler-edition', eventData);
    },
    onCreate() {
      this.$emit('scheduler-creation');
    },
  },
};
