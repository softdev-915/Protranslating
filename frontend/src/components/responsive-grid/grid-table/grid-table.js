import _ from 'lodash';
import GridConfiguration from './grid-configuration/grid-configuration.vue';
import GridTableRow from './grid-table-row/grid-table-row.vue';
import GridTableColumnHeader from './grid-table-column-header/grid-table-column-header.vue';
import GridTableSelectHeader from './grid-table-select-header/grid-table-select-header.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import { isScrollbarAtBottom } from '../../../utils/browser';

const MAX_ARRAY_RESULTS_VISIBLE = 5;
const MAX_LONG_TEXT_RESULTS_VISIBLE = 140;
const DEFAULT_PAGE_ENTRIES = [10, 25, 50, 100];
const naiveKeyForItem = function (item) {
  const keys = Object.keys(item);
  const _id = _.get(item, '_id');
  const id = _.get(item, 'id', _id);
  return _.defaultTo(id, item[keys[0]]);
};

export default {
  components: {
    GridConfiguration,
    GridTableRow,
    GridTableColumnHeader,
    GridTableSelectHeader,
    SimpleBasicSelect,
    ConfirmDialog,
  },
  data() {
    return {
      maxVisible: MAX_ARRAY_RESULTS_VISIBLE,
      longTextMaxVisible: MAX_LONG_TEXT_RESULTS_VISIBLE,
      query: '',
      entrySize: 10,
      checkedEntrySize: 0,
      lastRecordReached: false,
      isLoading: true,
    };
  },
  props: {
    tableClass: String,
    title: {
      type: String,
      default: '',
    },
    canCreate: {
      type: Boolean,
      default: false,
    },
    canExport: {
      type: Boolean,
      default: true,
    },
    canSetup: {
      type: Boolean,
      default: false,
    },
    canToggle: {
      type: Boolean,
      default: false,
    },
    gridConfigs: {
      type: Array,
    },
    columns: {
      type: Array,
      required: true,
    },
    listData: {
      type: Object,
      default: {},
    },
    saveGridConfigAvailable: {
      type: Boolean,
      default: false,
    },
    page: {
      type: Number,
      default: 1,
    },
    limit: {
      type: Number,
      default: 10,
    },
    keyForItem: {
      type: Function,
      default: naiveKeyForItem,
    },
    sort: {
      type: String,
    },
    filter: {
      type: Object,
      default: () => ({}),
    },
    useHeaderFilter: {
      type: Boolean,
      default: false,
    },
    useResetFilterLink: {
      type: Boolean,
      required: false,
      default: false,
    },
    canSort: {
      type: Boolean,
      default: true,
    },
    canSortBySelect: {
      type: Boolean,
      default: false,
    },
    q: {
      type: String,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    exportingData: {
      type: Boolean,
      default: false,
    },
    maxPages: {
      type: Number,
      default: 4,
    },
    components: {
      type: Object,
      default: () => ({}),
    },
    rowSelection: {
      type: Boolean,
      default: false,
    },
    rowSelectionDisabled: {
      type: Boolean,
      default: false,
    },
    rowSelectionTitle: {
      type: String,
      default: 'Select',
    },
    rowHrefBuilder: {
      type: Function,
    },
    selectedRowCheckProperty: {
      type: String,
      default: '',
    },
    selectedRows: {
      type: Array,
      default: () => [],
    },
    activeRows: {
      type: Array, // array of rows that have been been toggle-checked
      default: () => [],
    },
    gridName: {
      type: String,
      default: '',
    },
    isPaginationEnabled: {
      type: Boolean,
      default: true,
    },
    isScrollPaginationEnabled: {
      type: Boolean,
      default: false,
    },
    hasShowAllRecordsLink: {
      type: Boolean,
      default: false,
    },
    hasImportLink: {
      type: Boolean,
      default: false,
    },
    gridConfigApplied: {
      type: Boolean,
      default: false,
    },
    cssRowClass: {
      type: Function,
    },
    customPaginationEntries: {
      type: Array,
    },
    showSelectAllButton: {
      type: Boolean,
      default: true,
    },
  },
  watch: {
    q(newQuery) {
      this.query = newQuery;
    },
    limit: function (newLimit) {
      this.entrySize = newLimit;
    },
    listData: function (data) {
      // If last record reached, go back one page, and disable next page button
      if (data.total === 0 && !this.filterApplied && this.page > 1) {
        this.changePage(this.page - 1);
        this.lastRecordReached = true;
      }
    },
    isReady: {
      immediate: true,
      handler(isReady) {
        this.$nextTick(() => {
          this.isLoading = !isReady;
        });
      },
    },
  },
  computed: {
    isReady() {
      return !this.loading && this.gridConfigApplied;
    },
    isFixedHeaderTable() {
      return this.tableClass === 'fixed-header';
    },
    tableCustomClass() {
      let className = this.tableClass;
      if (this.useHeaderFilter) {
        className += ' filter-table';
      }
      return className;
    },
    paginationControlsClass() {
      return this.useHeaderFilter ? 'col-xl-6 col-lg-6' : 'col-xl-2';
    },
    filterApplied() {
      return this.q || Object.keys(this.filter).length;
    },
    resetQueryLinkVisible() {
      return this.list.length === 0 && this.filterApplied && this.useResetFilterLink;
    },
    nextPageDisabled() {
      return this.list.length < this.limit || this.list.length === 0 || this.lastRecordReached;
    },
    entries() {
      return _.get(this, 'customPaginationEntries', DEFAULT_PAGE_ENTRIES);
    },
    visibleColumns: function () {
      return this.columns.filter((c) => c.visible);
    },
    gridListData: function () {
      if (this.listData) {
        return this.listData;
      }
      return {};
    },
    isTitleEmpty: function () {
      return this.title === '';
    },
    list: function () {
      if (this.listData && this.listData.list) {
        return this.listData.list;
      }
      return [];
    },
    resultSize: function () {
      if (this.listData) {
        return this.listData.total;
      }
      return 0;
    },
    pages: function () {
      if (this.listData && this.listData.total) {
        return Math.ceil(this.listData.total / this.entrySize);
      }
      return 1;
    },
    totalResults: function () {
      if (this.listData) {
        return this.listData.total;
      }
      return 0;
    },
    firstRecord: function () {
      if (this.listData.total > 0 && !this.resetQueryLinkVisible) {
        return ((this.entrySize * this.page) - this.entrySize) + 1;
      }
      return 1;
    },
    lastRecord: function () {
      if (this.resetQueryLinkVisible) {
        return this.limit;
      }
      if (this.listData.total > 0) {
        if (this.listData.total === this.limit) {
          return this.page * this.limit;
        }
        return this.firstRecord + (this.list.length - 1);
      }
      return this.limit;
    },
    rows: function () {
      if (Array.isArray(this.$refs.row)) {
        return this.$refs.row;
      }
      return [this.$refs.row];
    },
  },
  mounted() {
    if (this.isScrollPaginationEnabled) {
      const table = document.getElementsByClassName('pts-data-table')[0];
      if (!_.isNil(table)) {
        table.lastChild.onscroll = () => {
          const tableTag = document.getElementsByClassName('pts-data-table')[0];
          if (isScrollbarAtBottom(tableTag.lastChild)) {
            this.$emit('grid-scroll');
          }
        };
      }
    }
  },
  methods: {
    isRowSelected(item) {
      return this.selectedRows.includes(item._id);
    },
    isRowActive(item) {
      const isItemShown = _.isBoolean(item.show) ? item.show : item.show === 'true';
      return !_.isNil(this.activeRows.find((i) => i._id === item._id)) || isItemShown;
    },
    onGridDataImport() {
      this.$emit('grid-data-import');
    },
    onGridDataExport() {
      this.$emit('grid-data-export');
    },
    onGridSort(eventData) {
      this.$emit('grid-sort', eventData);
    },
    onGridFilter(eventData) {
      this.$emit('grid-filter', eventData);
    },
    onGridColumnResize(eventData) {
      this.$emit('grid-column-change', eventData);
    },
    onGridColumnVisibilityChange(eventData) {
      this.$emit('grid-column-change', eventData);
    },
    onGridColumnMove(eventData) {
      this.$emit('grid-column-move', eventData);
    },
    changePage(page) {
      if (this.lastRecordReached) {
        this.lastRecordReached = false;
      }

      if (_.get(this.$refs, 'selectAllCheckBox.checked', false)) {
        this.$refs.selectAllCheckBox.checked = false;
      }
      this.$emit('grid-page-change', page);
    },
    onGridResetQuery() {
      this.$emit('grid-reset-query');
    },
    showEdit(event) {
      this.$emit('grid-edit', event);
    },
    itemAction(event) {
      this.$emit('item-action', event);
    },
    search() {
      const term = this.query && this.query.length ? this.query : undefined;
      this.$emit('grid-search', term);
    },
    onEntryChange(entrySize) {
      if (this.page > 1) {
        this.checkedEntrySize = entrySize;
        this.$refs.confirmDialog.show();
      } else {
        this.entrySize = entrySize;
        this.$emit('grid-entry-change', entrySize);
      }
    },
    onGridConfigSave(eventData) {
      this.$emit('grid-config-save', eventData);
    },
    onGridConfigNew(eventData) {
      this.$emit('grid-config-new', eventData);
    },
    onGridConfigSelected(name) {
      this.$emit('grid-config-selected', name);
    },
    onGridConfigDelete(index) {
      this.$emit('grid-config-delete', index);
    },
    onGridCreateNew(eventData) {
      this.$emit('grid-create-new', eventData);
    },
    onGridSetupAction(eventData) {
      this.$emit('grid-setup-action', eventData);
    },
    onGridSelectAllColumns(eventData) {
      this.$emit('grid-select-all-columns', eventData);
    },
    onGridCollapseAll() {
      this.rows.forEach((r) => {
        r.collapseAll();
      });
    },
    onGridExpandAll() {
      this.rows.forEach((r) => {
        r.expandAll();
      });
    },
    onGridShowAllRecords() {
      this.$emit('grid-show-all-records');
    },
    onRowSelected(itemId, selected) {
      this.$emit('row-selected', itemId, selected);
    },
    onGridRowToggle(item) {
      this.$emit('grid-row-toggle', item);
    },
    selectAll(event) {
      event.stopPropagation();
      this.$emit('all-rows-selected', event.target.checked);
    },
    restartPagination({ confirm = true } = {}) {
      if (confirm) {
        this.entrySize = this.checkedEntrySize;
        this.$emit('grid-entry-change', this.entrySize);
        this.$emit('grid-page-change', 1);
      }
    },
    cancel() {
      this.$refs.selectEntries.selectOption(this.entrySize);
    },
  },
};
