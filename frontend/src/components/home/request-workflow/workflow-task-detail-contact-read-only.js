import _ from 'lodash';

const HUMAN_READABLE_PROVIDER_STATUSES = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  onHold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  approved: 'Approved',
};

export default {
  props: {
    workflow: {
      type: Object,
      required: true,
    },
    srcLang: {
      type: String,
      required: true,
    },
    tgtLang: {
      type: String,
      required: true,
    },
  },
  computed: {
    tasks() {
      const formattedTasks = [];
      const tasks = _.get(this.workflow, 'tasks', []);
      tasks.forEach(((task) => {
        const ability = _.get(task, 'ability', '');
        const description = _.get(task, 'description', '');
        const providerTasks = _.get(task, 'providerTasks', []);
        providerTasks.forEach((pTask) => {
          formattedTasks.push({
            ability,
            description,
            providerTaskStatus: HUMAN_READABLE_PROVIDER_STATUSES[_.get(pTask, 'status')],
            providerDueDate: _.get(pTask, 'taskDueDate'),
          });
        });
      }));
      return formattedTasks;
    },
  },
};
