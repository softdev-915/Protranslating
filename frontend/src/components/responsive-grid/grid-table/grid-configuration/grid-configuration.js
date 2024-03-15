import _ from 'lodash';
import GridConfigurationDropdown from './grid-configuration-dropdown/grid-configuration-dropdown.vue';

export default {
  components: {
    GridConfigurationDropdown,
  },
  data() {
    return {
      collapsedAll: true,
      popperOpts: {
        modifiers: {
          preventOverflow: { enabled: false },
          computeStyle: { enabled: false },
          hide: { enabled: false },
        },
      },
    };
  },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    canCreate: {
      type: Boolean,
    },
    canExport: {
      type: Boolean,
      default: true,
    },
    canSetup: {
      type: Boolean,
    },
    saveGridConfigAvailable: {
      type: Boolean,
    },
    gridConfigs: {
      type: Array,
    },
    exportingData: {
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
    showSelectAllButton: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    onGridShowAllRecords() {
      this.$emit('grid-show-all-records');
    },
    onGridResetQuery() {
      this.$emit('grid-reset-query');
    },
    onGridColumnVisibilityChange(eventData) {
      this.$emit('grid-column-visibility-change', eventData);
    },
    onGridColumnMove(eventData) {
      this.$emit('grid-column-move', eventData);
    },
    onGridConfigSave(eventData) {
      this.$emit('grid-config-save', eventData);
      this.$refs['config-dropdown'].hide(true);
    },
    onGridConfigSelected(name) {
      this.$emit('grid-config-selected', name);
    },
    onGridSelectAllColumns(eventData) {
      this.$emit('grid-select-all-columns', eventData);
    },
    onGridConfigDelete(index) {
      this.$emit('grid-config-delete', index);
    },
    onGridConfigNew(eventData) {
      this.$emit('grid-config-new', eventData);
    },
    onGridDataImport() {
      this.$emit('grid-data-import');
    },
    fireDataExport() {
      if (!this.exportingData) {
        this.$emit('grid-data-export');
      }
    },
    fireCollapseAll() {
      this.collapsedAll = true;
      this.$emit('grid-collapse-all');
    },
    fireExpandAll() {
      this.collapsedAll = false;
      this.$emit('grid-expand-all');
    },
    fireCreateNew() {
      this.$emit('grid-create-new');
    },
    fireSetupAction() {
      this.$emit('grid-setup-action');
    },
  },
  computed: {
    sortedColumns() {
      return _.orderBy(this.columns, [(column) => column.name], ['asc']);
    },
  },
};
