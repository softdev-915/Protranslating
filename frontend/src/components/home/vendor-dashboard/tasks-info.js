import _ from 'lodash';

export default {
  props: {
    dashboardData: {
      type: Object,
      required: true,
    },
  },
  computed: {
    currentTasksCount() {
      return _.get(this, 'dashboardData.currentTasksCount', 0);
    },
    pendingTasksCount() {
      return _.get(this, 'dashboardData.pendingTasksCount', 0);
    },
    futureTasksCount() {
      return _.get(this, 'dashboardData.futureTasksCount', 0);
    },
    totalTasksCount() {
      return _.get(this, 'dashboardData.totalTasksCount', 0);
    },
  },
};
