import _ from 'lodash';
import gridConfigStorage from '../../utils/grid/grid-config-storage';
import mergeColumns from '../../utils/grid/grid-column-merge';
import GridTable from './grid-table/grid-table.vue';

const createGridConfigs = (columns) => ([{
  name: 'Custom', columns: columns.slice(0), selected: true, new: true, customFilters: '', limit: 10,
}]);
const addVal = (columns, selected) => {
  const colLen = selected.columns.length;
  columns.forEach((c) => {
    for (let i = 0; i < colLen; i++) {
      if (c.prop === selected.columns[i].prop) {
        selected.columns[i].val = c.val;
        selected.columns[i].type = c.type;
        break;
      }
    }
  });
};

const toBackendColumns = (columns) => columns.map((c) => {
  const col = {
    name: c.name,
    prop: c.prop,
    visible: c.visible,
  };
  if (c.width) {
    col.width = c.width;
  }
  return col;
});

export default {
  components: {
    GridTable,
  },
  props: {
    showSearch: {
      type: Boolean,
    },
    rowSelection: {
      type: Boolean,
      default: false,
    },
    rowSelectionTitle: {
      type: String,
    },
    rowHrefBuilder: {
      type: Function,
    },
    selectedRowCheckProperty: {
      type: String,
      default: '',
    },
    useResetFilterLink: {
      type: Boolean,
      default: false,
      required: false,
    },
    canToggle: {
      type: Boolean,
      default: false,
    },
    canCreate: {
      type: Boolean,
      default: false,
    },
    canExport: {
      type: Boolean,
      default: true,
    },
    canSort: {
      type: Boolean,
      default: true,
    },
    canSortBySelect: {
      type: Boolean,
      default: false,
    },
    canSetup: {
      type: Boolean,
      default: false,
    },
    gridName: {
      type: String,
      required: true,
    },
    query: {
      type: Object,
    },
    useHeaderFilter: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    columns: {
      type: Array,
      required: true,
    },
    tableClass: {
      type: String,
    },
    listData: {
      type: Object,
      required: true,
    },
    keyForItem: {
      type: Function,
    },
    editTitle: {
      type: Function,
    },
    loading: {
      type: Boolean,
    },
    exportingData: {
      type: Boolean,
      default: false,
    },
    components: {
      type: Object,
      default: () => ({}),
    },
    selectedRows: {
      type: Array,
      default: () => [],
    },
    activeRows: {
      type: Array, // array of rows that have been been toggle-checked
      default: () => [],
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
    rowSelectionDisabled: {
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
      default: false,
    },
  },
  data() {
    return {
      gridConfigs: [],
      originalGridConfigsCount: 0,
      gridConfigApplied: false,
    };
  },
  created: function () {
    this.gridConfigs = [];
    gridConfigStorage.retrieveFromServer().then(() => gridConfigStorage.get(this.gridName).then((gridConfigs) => {
      this.gridConfigs = gridConfigs || [];
      let filterStringValue = '';
      let activeConfig = {};

      if (this.gridConfigs.length) {
        activeConfig = this.gridConfigs.find((c) => c.selected);
        // if there is a grid config, check that it's not missing new columns
        // or contains deleted columns.
        this.gridConfigs.forEach((config) => {
          mergeColumns(config, this.columns);
          // Override with custom filters
          if (config.name === 'Custom' && typeof config.customFilters !== 'undefined') {
            filterStringValue = config.customFilters;
          }
        });
        // ensure vuejs reacts to changes
        // indexModified.forEach(i => this.$set(this.gridConfigs, i, this.gridConfigs[i]));
      }

      if (filterStringValue !== '') {
        let filterOverrideObj = {};
        try {
          filterOverrideObj = JSON.parse(filterStringValue);
        } catch (e) {
          filterOverrideObj = {};
        }
        this.$emit('grid-filter', { filtersOverride: filterOverrideObj });
      }

      if (activeConfig && activeConfig.limit) {
        this.$emit('grid-entry-change', activeConfig.limit);
      }
      this.originalGridConfigsCount = this.gridConfigs.length;
    }));
  },
  mounted() {
    gridConfigStorage.get(this.gridName).then((gridConfigs) => {
      gridConfigs = gridConfigs || [];
      let filterStringValue = '';
      if (gridConfigs.length) {
        gridConfigs.forEach((config) => {
          // Override with custom filters
          if (config.name === 'Custom' && typeof config.customFilters !== 'undefined') {
            filterStringValue = config.customFilters;
          }
        });
      }

      if (filterStringValue !== '') {
        let filterOverrideObj = {};
        try {
          filterOverrideObj = JSON.parse(filterStringValue);
        } catch (e) {
          filterOverrideObj = {};
        }
        this.$emit('grid-filter', { filtersOverride: filterOverrideObj });
      }
      this.gridConfigApplied = true;
    });
  },
  computed: {
    saveGridConfigAvailable: function () {
      return this.gridConfigs.length !== 0
        && this.originalGridConfigsCount !== this.gridConfigs.length;
    },
    gridConfigsLen: function () {
      return this.gridConfigs.length;
    },
    filter: function () {
      let filter = {};
      if (this.query && this.query.filter) {
        try {
          filter = JSON.parse(this.query.filter);
        } catch (e) {
          // do nothing
        }
      }
      return filter;
    },
    sort: function () {
      return _.defaultTo(this.query.sort, null);
    },
    page() {
      return _.get(this, 'query.page', 1);
    },
    q() {
      return _.defaultTo(this.query.q, null);
    },
    limit() {
      return _.defaultTo(this.query.limit, undefined);
    },
    configuredColumns: function () {
      if (this.gridConfigs.length) {
        const selectedItem = this._selecteGridConfig();
        if (selectedItem.index !== -1) {
          const { selected } = selectedItem;
          selected.columns = selected.columns.filter((sc) => !_.isNil(this.columns.find((c) => c.prop === sc.prop)));
          return selected.columns;
        }
      }
      return this.columns;
    },
  },
  watch: {
    configuredColumns(newConfiguredColums, old) {
      if (newConfiguredColums && newConfiguredColums.length) {
        this.$emit('grid-current-config', newConfiguredColums);
      } else if (old) {
        // only emit if the old value had some kind of value
        this.$emit('grid-current-config', null);
      }
    },
  },
  methods: {
    onGridScroll() {
      this.$emit('grid-scroll');
    },
    _unselectAllGridConfigs() {
      for (let i = 0; i < this.gridConfigs.length; i++) {
        this.$set(this.gridConfigs[i], 'selected', false);
      }
    },
    _selecteGridConfig() {
      const selectedItem = { selected: null, index: -1 };
      if (this.gridConfigs.length) {
        for (let i = 0; i < this.gridConfigs.length; i++) {
          if (this.gridConfigs[i].selected) {
            selectedItem.selected = this.gridConfigs[i];
            selectedItem.index = i;
          }
        }
        if (selectedItem.index !== -1) {
          addVal(this.columns, selectedItem.selected);
        }
      }
      return selectedItem;
    },
    _assertGridConfigExist() {
      if (!this.gridConfigs.length) {
        this._unselectAllGridConfigs();
        this.gridConfigs = createGridConfigs(this.columns);
      } else {
        this.$set(this.gridConfigs[0], 'selected', true);
      }
    },
    onGridConfigSave() {
      this._assertGridConfigExist();
      const selectedItem = this._selecteGridConfig();
      if (selectedItem.index !== -1) {
        const { selected } = selectedItem;
        delete selected.new;
        this.$set(this.gridConfigs, selectedItem.index, selected);
        gridConfigStorage.save(this.gridName, this.gridConfigs.map((c) => {
          const cloned = { ...c };
          cloned.columns = toBackendColumns(cloned.columns);
          return cloned;
        }), () => {
          // eslint-disable-next-line
          this.onGridFilterConfigSave();
        });
      } else {
        // save filters too
        this.onGridFilterConfigSave();
      }
    },
    onGridFilterConfigSave() {
      // read parameters via url
      // fetch existing colum config
      // add filter config
      // update the config
      const selectedItem = this._selecteGridConfig();
      if (typeof this.filter === 'object') {
        selectedItem.selected.customFilters = JSON.stringify(this.filter);
      }
      if (typeof this.limit === 'number') {
        selectedItem.selected.limit = this.limit;
      }
      this.$set(this.gridConfigs, selectedItem.index, selectedItem.selected);
      gridConfigStorage.save(this.gridName, this.gridConfigs);
    },
    onGridConfigNew() {
      let { columns } = this;
      const selectedItem = this._selecteGridConfig();
      if (selectedItem.index !== -1) {
        const { selected } = selectedItem;
        columns = selected.columns;
      }
      this._unselectAllGridConfigs();
      this.gridConfigs = createGridConfigs(columns);
    },
    onGridColumnChange(columnResize) {
      this._assertGridConfigExist();
      const selectedItem = this._selecteGridConfig();
      const colsLen = selectedItem.selected.columns.length;
      for (let i = 0; i < colsLen; i++) {
        if (selectedItem.selected.columns[i].prop === columnResize.prop) {
          this.$set(this.gridConfigs[selectedItem.index].columns, i, columnResize);
          break;
        }
      }
    },
    onGridSelectAllColumns(shouldSelectAll) {
      this._assertGridConfigExist();
      const selectedItem = this._selecteGridConfig();
      const newSelectedColumns = selectedItem.selected.columns.map((c, i) => {
        const col = Object.assign({}, c);
        if (i === 0 && !shouldSelectAll) {
          col.visible = true;
          return col;
        }
        col.visible = shouldSelectAll;
        return col;
      });
      this.$set(this.gridConfigs[selectedItem.index], 'columns', newSelectedColumns);
    },
    onSort(sortColumn) {
      this.$emit('grid-sort', sortColumn);
    },
    onFilter(filterParams) {
      this.$emit('grid-filter', filterParams);
    },
    onGridResetQuery() {
      this.$emit('grid-reset-query');
    },
    onPageChange(page) {
      this.$emit('grid-page-change', page);
    },
    onGridColumnMove(columnMove) {
      this._assertGridConfigExist();
      const { index } = columnMove;
      const { newIndex } = columnMove;
      const selectedItem = this._selecteGridConfig();
      const aux = selectedItem.selected.columns[newIndex];
      this.$set(this.gridConfigs[selectedItem.index].columns, newIndex,
        this.gridConfigs[selectedItem.index].columns[index]);
      this.$set(this.gridConfigs[selectedItem.index].columns, index, aux);
    },
    onGridConfigSelected(name) {
      if (name === null) {
        this._unselectAllGridConfigs();
      } else {
        for (let i = 0; i < this.gridConfigs.length; i++) {
          if (this.gridConfigs[i].name === name) {
            this.$set(this.gridConfigs[i], 'selected', true);
            break;
          }
        }
      }
      gridConfigStorage.save(this.gridName, this.gridConfigs);
    },
    onGridConfigDelete(name) {
      for (let i = 0; i < this.gridConfigs.length; i++) {
        if (this.gridConfigs[i].name === name) {
          this.$delete(this.gridConfigs, i);
          break;
        }
      }
      gridConfigStorage.save(this.gridName, this.gridConfigs);
    },
    onGridDataExport() {
      this.$emit('grid-data-export');
    },
    onSearch(search) {
      this.$emit('grid-search', search);
    },
    onEdit(eventData) {
      this.$emit('grid-edit', eventData);
    },
    itemAction(eventData) {
      this.$emit('item-action', eventData);
    },
    onEntryChange(eventData) {
      this.$emit('grid-entry-change', eventData);
    },
    onGridCreateNew(eventData) {
      this.$emit('grid-create-new', eventData);
    },
    onGridSetupAction(eventData) {
      this.$emit('grid-setup-action', eventData);
    },
    onGridShowAllRecords() {
      this.$emit('grid-show-all-records');
    },
    onGridDataImport() {
      this.$emit('grid-data-import');
    },
    onGridRowToggle(item) {
      this.$emit('grid-row-toggle', item);
    },
    onRowSelected(_id, selected) {
      this.$emit('row-selected', _id, selected);
    },
    onSelectAll(selected) {
      this.$emit('all-rows-selected', selected);
    },
  },

};
