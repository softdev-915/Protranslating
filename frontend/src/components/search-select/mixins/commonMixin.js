import { escapedRegExp, matchStartRegExp } from '../utils';

/* mixin for all */
export default {
  props: {
    isError: {
      type: Boolean,
      default: false,
    },
    customAttr: {
      type: Function,
      default: () => '',
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    filterPredicate: {
      type: Function,
      default: (text, inputText) => text.match(escapedRegExp(inputText)),
    },
    filterByStart: {
      type: Function,
      default: (text, inputText) => text.match(matchStartRegExp(inputText)),
    },
    selectedOptionsClickable: {
      type: Boolean,
      default: false,
    },
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    nonRemovableValues: {
      type: Set,
      default: () => new Set(),
    },
    valueKey: {
      type: String,
      default: '_id',
    },
  },
  methods: {
    onSelectedOptionClick(event, option) {
      if (this.selectedOptionsClickable) {
        event.stopPropagation();
        this.$emit('selected-option-clicked', option);
      }
    },
  },
};
