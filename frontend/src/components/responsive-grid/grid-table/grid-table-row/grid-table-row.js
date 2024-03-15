import _ from 'lodash';
import localDateTime from '../../../../utils/filters/local-date-time';

const getSelectedText = () => {
  let text = '';
  if (typeof window.getSelection !== 'undefined') {
    text = window.getSelection().toString();
  } else if (typeof document.selection !== 'undefined' && document.selection.type === 'Text') {
    text = document.selection.createRange().text;
  }
  return text;
};

const naiveKeyForItem = function (item) {
  const keys = Object.keys(item);
  if (keys.indexOf('id') >= 0) {
    return item.id;
  } if (keys.indexOf('_id') >= 0) {
    return item._id;
  }
  return item[keys[0]];
};

export default {
  data() {
    return {
      colTypes: ['date', 'boolean', 'html', 'button', 'currency', 'longtext', 'component', 'toggle'],
      showAll: {},
    };
  },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    item: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    maxVisible: {
      type: Number,
      default: 5,
    },
    longTextMaxVisible: {
      type: Number,
      default: 140,
    },
    keyForItem: {
      type: Function,
      default: naiveKeyForItem,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    components: {
      type: Object,
      default: () => ({}),
    },
    rowEdition: {
      type: Boolean,
      default: false,
    },
    rowSelection: {
      type: Boolean,
      default: false,
    },
    isRowSelected: { type: Boolean, default: false },
    rowActive: { type: Boolean, default: false },
    rowSelectionDisabled: { type: Boolean, default: false },
    rowHrefBuilder: {
      type: Function,
    },
    canToggle: {
      type: Boolean,
      default: false,
    },
    cssRowClass: {
      type: Function,
      default: () => ({}),
    },
  },
  computed: {
    showMore: function () {
      const showMoreConfig = {};
      const { showAll } = this;
      const keys = this.columns.map((c) => c.prop).reduce((acc, cur) => {
        const obj = {};
        obj[cur] = null;
        return { ...acc, ...obj };
      }, {});
      Object.keys(keys).forEach((k) => {
        let maxLongText = this.longTextMaxVisible;
        const column = this.columns.find((c) => c.prop === k);
        let data = this.item[k];
        if (column && column.val) {
          maxLongText = column.maxChars || this.longTextMaxVisible;
          data = this.itemValue(this.item, column);
        }
        if (Array.isArray(data) && data.length > this.maxVisible) {
          showMoreConfig[k] = showAll[k] || false;
        } else if (column && column.type === 'longtext' && data && data.length > maxLongText) {
          showMoreConfig[k] = showAll[k] || false;
        } else {
          showMoreConfig[k] = null;
        }
      });
      return showMoreConfig;
    },
    collapsableColumns: function () {
      return this.columns.filter((c) => c.type === 'array' || c.type === 'longtext');
    },
    rowId: function () {
      if (this.highlighted) {
        return 'highlightedRow';
      }
      return this.index;
    },
    shouldDisableRowSelection() {
      return this.rowSelectionDisabled || this.item.disableCurrentRowSelection;
    },
    isHrefExist() {
      return _.isFunction(this.rowHrefBuilder);
    },
    rowElement() {
      return this.isHrefExist ? 'a' : 'span';
    },
  },
  watch: {
    isRowSelected(newValue) {
      this.$emit('row-selected', newValue);
    },
  },
  methods: {
    hrefBuilder(item) {
      if (this.isHrefExist) {
        return this.rowHrefBuilder(item);
      }
      // eslint-disable-next-line no-script-url
      return 'javascript: void(0)';
    },
    navigateTo(event, index) {
      if (!this.isHrefExist) {
        event.preventDefault();
        this.showEdit(event, index, false);
      }
    },
    cssCellClass: function (col, item) {
      let cssClass = '';
      if (col && item && typeof col.cssCell === 'function') {
        try {
          cssClass = col.cssCell(item);
        } catch (e) {
          cssClass = '';
        }
      }
      const colValue = this.itemValue(item, col);
      if (!_.isEmpty(colValue)) {
        cssClass += ' hasText';
      }
      return cssClass;
    },
    isDefaultColType(col) {
      return this.colTypes.every((type) => col.type !== type);
    },
    objectKeys(obj) {
      const clone = { ...obj };
      delete clone.$grid_options;
      return Object.keys(clone);
    },
    setShowAll(key, shouldShowAll) {
      this.$set(this.showAll, key, shouldShowAll);
    },
    collapseAll() {
      this.collapsableColumns.forEach((c) => {
        this.$set(this.showAll, c.prop, false);
      });
    },
    expandAll() {
      this.collapsableColumns.forEach((c) => {
        this.$set(this.showAll, c.prop, true);
      });
    },
    isArray(obj) {
      return Array.isArray(obj);
    },
    ellipsisText(text, maxChars, showAll) {
      // in case of undefined
      if (_.isEmpty(text)) {
        return '';
      }
      const max = maxChars || this.longTextMaxVisible;
      if (text.length < max || showAll) {
        return text;
      }
      return `${text.substring(0, max - 1)}...`;
    },
    stahp() {
      // dummy method to allow an event to be stopped from propagating
    },
    rangedArray(arr, showAll) {
      if (showAll !== true) {
        return arr.slice(0, this.maxVisible);
      }
      return arr;
    },
    showEdit(event, index, checkClassName = true) {
      const selectedText = getSelectedText();
      if (_.isEmpty(selectedText)) {
        if (!event.target.className || event.target.className.indexOf('col-item-text') === -1 || !checkClassName) {
          this.$emit('grid-edit', { index, item: this.item });
        }
      }
    },
    onItemAction(item, event) {
      this.$emit('item-action', { item: item, event: event });
    },
    onToggleAction(item, col) {
      this.$emit('grid-row-toggle', item);
      item[col.prop] = !item[col.prop];
    },
    itemDateValue(item, col) {
      const stringDateFormat = /\d\d-\d\d-\d\d\d\d \d\d:\d\d/;
      const val = this.itemValue(item, col);
      if (_.isNil(val) || _.isEmpty(val)) {
        return '';
      }
      if (val.match(stringDateFormat)) {
        return val;
      }
      return localDateTime(val, 'MM-DD-YYYY HH:mm');
    },
    itemValue(item, col) {
      if (typeof col.val === 'function') {
        let val = '';
        try {
          val = col.val(item);
        } catch (e) {
          // nothing to do
        }
        return val;
      }
      return _.get(item, col.prop);
    },
    stopCheckBoxEventPropagation(e) {
      e.stopPropagation();
    },
    checkBoxChange(eventData) {
      this.$emit('row-selected', eventData.target.checked);
    },
  },
};
