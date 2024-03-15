import { selectMixin } from '../../mixins/select-mixin';
import { catToolSelectMixin } from './cat-tool-select-mixin';

export default {
  mixins: [selectMixin, catToolSelectMixin],
  props: {
    value: String,
    mandatory: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    toolsAvailable: {
      type: Array,
      default: () => [],
    },
  },
  created() {
    if (this.value) {
      this.selected = this.value;
    }
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
  },
  computed: {
    selectedOption() {
      if (this.selected) {
        return { value: this.selected, text: this.selected };
      }
    },
  },
};
