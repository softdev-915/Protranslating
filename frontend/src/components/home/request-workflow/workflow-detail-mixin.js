import _ from 'lodash';

const TASK_APPROVED_STATUS = 'approved';
const TASK_CANCELLED_STATUS = 'cancelled';
const TASK_COMPLETED_STATUS = 'completed';

export default {
  props: {
    isUserIpAllowed: {
      type: Boolean,
      default: false,
    },
    pcErrors: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    isPreviousProviderTaskFinished() {
      return _.map(this.tasks, (task, index) => {
        if (index > 0) {
          for (let i = index - 1; i >= 0; i--) {
            const previousTask = this.tasks[i];
            if (previousTask.providerTasks) {
              if (_.some(previousTask.providerTasks, pt => !this.isFinishedStatus(pt.status))) {
                return false;
              }
            }
          }
        }
        return true;
      });
    },
    previousTask() {
      return _.map(this.tasks, (task, index) => {
        if (index > 0) {
          return this.tasks[index - 1];
        }
      });
    },
  },
  methods: {
    isFinishedStatus(status) {
      return [
        TASK_APPROVED_STATUS,
        TASK_COMPLETED_STATUS,
        TASK_CANCELLED_STATUS,
      ].includes(status);
    },
  },
};
