import _ from 'lodash';

export default {
  props: {
    value: {
      type: Object,
      required: true,
    },
    readDate: {
      type: String,
      default: () => '',
    },
  },
  created() {
    if (this.value._id) {
      // We clone the object to avoid having the same instance in value and originalValue.
      this.originalValue = _.cloneDeep(this.value);
    }
  },
  data() {
    return {
      originalValue: null,
    };
  },
  watch: {
    readDate() {
      // if read date changes it means that it was saved and refreshed
      // We clone the object to avoid having the same instance in value and originalValue.
      this.originalValue = _.cloneDeep(this.value);
    },
    // When expanding a workflow we want to add the tasks to the original value
    'value.tasks': function (newTasks, oldTasks) {
      if (_.isEmpty(oldTasks) && !_.isEmpty(this.value._id)) {
        this.originalValue = _.cloneDeep(this.value);
      }
    },
  },
};
