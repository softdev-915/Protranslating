import { catToolSelectMixin } from './cat-tool-select-mixin';
import { selectMixin } from '../../mixins/select-mixin';

export default {
  mixins: [catToolSelectMixin, selectMixin],
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    value: Array,
  },
  created() {
    if (this.value) {
      this.selected = this.value;
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.selected = newValue || [];
      },
    },
  },
  computed: {
    selectedOptions() {
      if (this.selected) {
        return this.selected.map((s) => ({ value: s, text: s }));
      }
    },
  },
};
