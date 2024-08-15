import { emptyQuantity } from '../../../utils/workflow/workflow-helpers';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const UNITS = ['Reps', '101%', '100%', '99-95%', '94-85%', '84-75%', 'No Match', 'Fuzzy', 'Hourly', 'Pages', 'Minutes'];

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: Object,
      required: true,
    },
    canEditNow: {
      type: Boolean,
      default: false,
    },
    canEditTask: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    lockPreviouslyCompleted: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      quantity: emptyQuantity(),
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.quantity = newValue;
      },
    },
    quantity: {
      deep: true,
      handler(newValue) {
        this.$emit('input', newValue);
      },
    },
  },
  computed: {
    unitList() {
      return UNITS;
    },
    canEditQuantity() {
      return this.canEditNow && this.canEditTask && !this.lockPreviouslyCompleted;
    },
  },
  methods: {
    addUnit() {
      this.$emit('unit-add');
    },
    deleteUnit() {
      this.$emit('unit-delete');
    },
  },
};
