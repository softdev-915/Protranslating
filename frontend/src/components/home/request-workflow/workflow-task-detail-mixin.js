import _ from 'lodash';
import PortalCatService from '../../../services/portalcat-service';

const portalCatService = new PortalCatService();

export default {
  props: {
    previousTask: {
      type: Object,
      default: null,
    },
    isPreviousProviderTaskFinished: {
      type: Boolean,
      default: false,
    },
    isUserIpAllowed: {
      type: Boolean,
      default: false,
    },
    pcErrors: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      taskProgress: null,
      isProgressLoading: false,
    };
  },
  computed: {
    isTaskIncludedInGroup() {
      return _.get(this, 'task.includedInGroup', false);
    },
  },
  methods: {
    async fetchTaskProgress() {
      const taskId = _.get(this, 'task._id');
      if (!this.isPortalCat || _.isNil(this.workflowId) || _.isNil(taskId)) {
        return;
      }
      this.isProgressLoading = true;
      const response = await portalCatService.getTaskProgress({
        requestId: this.requestId,
        workflowId: this.workflowId,
        taskId,
      }).catch(() => {});
      this.taskProgress = _.get(response, 'data.taskProgress', {});
      this.isProgressLoading = false;
    },
    getProviderTaskProgress(providerTask) {
      const providerId = _.get(providerTask, 'provider._id');
      return _.get(this, `taskProgress.${providerId}`);
    },
    isLastProviderTask(index) {
      const providerTasks = _.get(this, 'task.providerTasks', []);
      return index === providerTasks.length - 1;
    },
  },
};
