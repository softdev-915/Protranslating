import { isEmpty } from 'lodash';
import common from './common';
import baseMixin from './mixins/baseMixin';
import commonMixin from './mixins/commonMixin';
import optionAwareMixin from './mixins/optionAwareMixin';

export default {
  mixins: [baseMixin, commonMixin, optionAwareMixin],
  props: {
    showMissingOptions: {
      type: Boolean,
      default: false,
    },
    selectedOption: {
      type: Object,
      default: () => ({ value: '', text: '' }),
    },
    optionsAvailable: {
      type: Array,
      default: () => [],
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
  computed: {
    optionsWithOriginal() {
      if (this.originalValue.value && this.showMissingOptions) {
        const hasOriginalValue = this.options.filter((o) => o.value === this.originalValue).length === 1;
        if (!hasOriginalValue) {
          return this.options.concat([this.originalValue]);
        }
      }
      return this.options;
    },
    searchTextCustomAttr() {
      if (this.selectedOption && this.selectedOption.value) {
        return this.customAttr(this.selectedOption);
      }
      return '';
    },
    inputText() {
      if (this.searchText) {
        return '';
      }
      let text = this.placeholder;
      if (this.selectedOption.text) {
        text = this.selectedOption.text;
      }
      return text;
    },
    customAttrs() {
      try {
        if (Array.isArray(this.filteredOptions)) {
          return this.filteredOptions.map((o) => this.customAttr(o));
        }
      } catch (e) {
        // if there is an error, just return an empty array
      }
      return [];
    },
    textClass() {
      if (!this.selectedOption.text && this.placeholder) {
        return 'default';
      }
      return '';
    },
    menuClass() {
      return {
        visible: this.showMenu,
        hidden: !this.showMenu,
      };
    },
    menuStyle() {
      return {
        display: this.showMenu ? 'block' : 'none',
      };
    },
    filteredOptions() {
      if (this.searchText) {
        return this.optionsWithOriginal.filter((option) => {
          try {
            return this.filterPredicate(option.text, this.searchText);
          } catch (e) {
            return true;
          }
        });
      } else if (!isEmpty(this.optionsAvailable)) {
        return this.optionsWithOriginal.filter(o => this.optionsAvailable.some(t => t === o.text));
      }
      return this.optionsWithOriginal;
    },
  },
  methods: {
    deleteTextOrItem() {
      if (!this.searchText && this.selectedOption) {
        this.selectItem({});
        this.openOptions();
      }
    },
    openOptions() {
      common.openOptions(this);
    },
    blurInput() {
      common.blurInput(this);
    },
    closeOptions() {
      common.closeOptions(this);
    },
    prevItem() {
      common.prevItem(this);
    },
    nextItem() {
      common.nextItem(this);
    },
    enterItem() {
      common.enterItem(this);
    },
    pointerSet(index) {
      common.pointerSet(this, index);
    },
    pointerAdjust() {
      common.pointerAdjust(this);
    },
    mousedownItem() {
      common.mousedownItem(this);
    },
    selectItem(option) {
      this.searchText = ''; // reset text when select item
      this.closeOptions();
      if (this.selectedOption.value &&
        this.nonRemovableValues.has(this.selectedOption.value[this.valueKey])) {
        return this.$emit('restricted-option-removal');
      }
      this.$emit('select', option);
    },
  },
};
