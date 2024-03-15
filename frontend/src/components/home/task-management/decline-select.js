import commonMixin from '../../search-select/mixins/commonMixin';
import optionAwareMixin from '../../search-select/mixins/optionAwareMixin';

export default {
  mixins: [commonMixin, optionAwareMixin],
  props: {
    selectedOption: {
      type: Object,
      default: () => ({ value: '', text: '' }),
    },
    title: {
      type: String,
    },
    subTitle: {
      type: String,
    },
  },
  created() {
    this.originalValue = this.selectedOption;
  },
  data() {
    return {
      showMenu: false,
      searchText: '',
      originalValue: { text: '', value: '' },
      mousedownState: false, // mousedown on option menu
      pointer: 0,
    };
  },
  methods: {
    openOptions() {
      this.showMenu = !this.showMenu;
      this.mousedownState = false;
    },
    closeOptions() {
      this.showMenu = false;
    },
    pointerSet(index) {
      this.pointer = index;
    },
    mousedownItem() {
      this.mousedownState = true;
    },
    blurSelect() {
      if (!this.mousedownState) {
        this.closeOptions();
      }
    },
    selectItem(option) {
      this.closeOptions();
      this.$emit('select', option);
    },
  },
};
