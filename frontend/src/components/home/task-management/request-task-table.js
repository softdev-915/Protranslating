import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';
import TaskService from '../../../services/task-service';
import OfferInstructionsModal from './offer-instructions-modal.vue';

const COMPLETED_STATUS_NOT_OVERDUE_NEEDED = 'completed';
const PROVIDER_OFFERS = 'offers';
const taskService = new TaskService();

export default {
  components: {
    OfferInstructionsModal,
  },
  props: {
    provider: {
      type: Object,
      required: true,
    },
    priorityStatus: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
      required: false,
    },
    tasks: {
      type: Array,
    },
    selectedRows: {
      type: Array,
    },
  },
  data() {
    return {
      openedOfferId: null,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    tableColumns() {
      return taskService.getColumns(this.priorityStatus);
    },
    showTaskStatus() {
      return this.priorityStatus === COMPLETED_STATUS_NOT_OVERDUE_NEEDED;
    },
    showProviderTaskInstructions() {
      return this.priorityStatus === PROVIDER_OFFERS;
    },
    rowSelection() {
      return this.priorityStatus === PROVIDER_OFFERS;
    },
    hasScroll() {
      return _.get(this, 'tasks.length', 0) <= 3 ? 'no-scroll' : 'scroll';
    },
    orderedTasks() {
      if (!_.isEmpty(this.tasks) && this.tasks.length > 0) {
        return _.orderBy(this.tasks, (t) => {
          if (t.taskDueDate) {
            return moment(t.taskDueDate);
          }
        }, ['desc']);
      }
      return this.tasks;
    },
  },
  methods: {
    getTaskDetailLink(task) {
      return `${task.requestId}/details`;
    },
    onEditInline(task, event) {
      event.preventDefault();
      if (this.priorityStatus === PROVIDER_OFFERS) return;
      this.$emit('onTaskEdit', task);
    },
    isTaskPastCurrentDate(task) {
      const currentDate = moment().utc();
      const taskDueDate = moment(task.taskDueDate).utc();
      const validStatus = task.status !== COMPLETED_STATUS_NOT_OVERDUE_NEEDED;
      return currentDate.isAfter(taskDueDate) && validStatus;
    },
    stopCheckBoxEventPropagation(e) {
      e.stopPropagation();
    },
    isRowSelected(rowId) {
      return this.selectedRows.includes(rowId);
    },
    checkBoxChange(rowId) {
      this.$emit('row-selected', rowId);
    },
    selectAll(event) {
      event.stopPropagation();
      this.$emit('select-all', event.target.checked);
    },
  },
};
