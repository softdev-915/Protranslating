import differenceBy from 'lodash/differenceBy';
import last from 'lodash/last';
import unionWith from 'lodash/unionWith';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import reject from 'lodash/reject';
import common from './common';
import baseMixin from './mixins/baseMixin';
import commonMixin from './mixins/commonMixin';
import optionAwareMixin from './mixins/optionAwareMixin';

export default {
  mixins: [baseMixin, commonMixin, optionAwareMixin],
  props: {
    selectedOptions: {
      type: Array,
    },
    showMissingOptions: {
      type: Boolean,
      default: false,
    },
    cleanSearch: {
      type: Boolean,
      default: true,
    },
    removeHandler: {
      type: Function,
      default: option => !isNil(option),
    },
    customFilteredOptions: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      showMenu: false,
      searchText: '',
      originalValues: [],
      mousedownState: false, // mousedown on option menu
      pointer: 0,
    };
  },
  created() {
    this.originalValues = this.selectedOptions;
  },
  computed: {
    optionsWithOriginal() {
      if (this.originalValues.length && this.showMissingOptions) {
        const missingValues = differenceBy(this.originalValues, this.options);
        if (missingValues.length) {
          return this.options.concat(missingValues);
        }
      }
      return this.options;
    },
    inputText() {
      if (this.searchText) {
        this.openOptions();
        return '';
      }
      return this.placeholder;
    },
    textClass() {
      if (this.placeholder) {
        return 'default';
      }
      return '';
    },
    inputWidth() {
      return {
        width: `${((this.searchText.length + 1) * 8) + 20}px`,
      };
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
    nonSelectOptions() {
      return differenceBy(this.optionsWithOriginal, this.selectedOptions, 'value');
    },
    filteredOptions() {
      if (this.searchText) {
        if (this.customFilteredOptions) {
          return this.customFilteredOptions(this.searchText, this.nonSelectOptions);
        }
        return this.nonSelectOptions.filter((option) => {
          try {
            if (this.cleanSearch) {
              return this.filterPredicate(this.accentsTidy(option.text), this.searchText);
            }
            return this.filterPredicate(option.text, this.searchText);
          } catch (e) {
            return true;
          }
        });
      }
      return this.nonSelectOptions;
    },
  },
  methods: {
    deleteTextOrLastItem() {
      if (!this.searchText && this.selectedOptions.length > 0) {
        this.deleteItem(last(this.selectedOptions));
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
      this.closeOptions();
      this.openOptions();
    },
    nextItem() {
      common.nextItem(this);
      this.closeOptions();
      this.openOptions();
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
      const selectedOptions = unionWith(this.selectedOptions, [option], isEqual);
      this.closeOptions();
      this.searchText = '';
      this.$emit('select', selectedOptions, option, 'insert');
    },
    deleteItem(option) {
      const removeHandlerResult = this.removeHandler(option);
      if (!removeHandlerResult) {
        return;
      }
      if (this.nonRemovableValues.has(option.value)) {
        this.$emit('restricted-option-removal');
        return;
      }
      const selectedOptions = reject(this.selectedOptions, option);
      this.$emit('select', selectedOptions, option, 'delete');
    },
    accentsTidy(s) {
      let r = s.toString().toLowerCase();
      r = r.replace(new RegExp('[àáâãäå]', 'g'), 'a');
      r = r.replace(new RegExp('æ', 'g'), 'ae');
      r = r.replace(new RegExp('ç', 'g'), 'c');
      r = r.replace(new RegExp('[èéêë]', 'g'), 'e');
      r = r.replace(new RegExp('[ìíîï]', 'g'), 'i');
      r = r.replace(new RegExp('ñ', 'g'), 'n');
      r = r.replace(new RegExp('[òóôõö]', 'g'), 'o');
      r = r.replace(new RegExp('œ', 'g'), 'oe');
      r = r.replace(new RegExp('[ùúûü]', 'g'), 'u');
      r = r.replace(new RegExp('[ýÿ]', 'g'), 'y');
      return r;
    },
  },
};
