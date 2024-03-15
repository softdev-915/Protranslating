export default {
  mounted: function () {
    try {
      this.$refs.configInput[0].focus();
    } catch (e) {
      // ignore failed attempt to focus on input
    }
  },
  data() {
    return {
      ignoreVisibility: true,
      newConfigName: '',
    };
  },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    saveGridConfigAvailable: {
      type: Boolean,
    },
    gridConfigs: {
      type: Array,
    },
    showSelectAllButton: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    configsLen: function () {
      return this.gridConfigs.length;
    },
    selectedConfig: function () {
      const selected = this.gridConfigs.filter((c) => c.selected);
      if (selected.length) {
        return selected[0];
      }
      return null;
    },
    isCreatingConfig: function () {
      return this.gridConfigs.filter((c) => c.new).length > 0;
    },
    noConfigSelected: function () {
      return this.gridConfigs.filter((c) => c.selected).length === 0;
    },
    visibleCount: function () {
      if (this.selectedConfig) {
        return this.selectedConfig.columns.filter((c) => c.visible).length;
      }
      return this.columns.filter((c) => c.visible).length;
    },
    validConfigName: function () {
      if (this.newConfigName.trim().length === 0) {
        return false;
      }
      if (this.gridConfigs.filter((c) => c.name === this.newConfigName).length > 0) {
        return false;
      }
      return true;
    },
    isAllColumnsSelected() {
      return this.visibleCount === this.columns.length;
    },
    selectAllColumnsLabel() {
      return this.isAllColumnsSelected ? 'Deselect All' : 'Select All';
    },
  },
  methods: {
    columnMove(event, column, index, newIndex) {
      event.stopPropagation();
      this.$emit('grid-column-move', { column, index, newIndex });
    },
    onVisiblityChange(event, column) {
      event.stopPropagation();
      const { checked } = event.target;
      const newCol = { ...column };
      newCol.visible = checked;
      this.$emit('grid-column-visibility-change', newCol);
    },
    onSelectAllClick(event) {
      event.stopPropagation();
      this.$emit('grid-select-all-columns', !this.isAllColumnsSelected);
    },
    onNewConfig(event) {
      event.stopPropagation();
      setTimeout(() => {
        try {
          this.$refs.configInput[0].focus();
        } catch (e) {
          // ignore failed attempt to focus on input
        }
      }, 100);
      this.$emit('grid-config-new');
    },
    onConfigSave(configName) {
      this.$emit('grid-config-save', configName);
    },
    onGridConfigSelected(name) {
      this.$emit('grid-config-selected', name);
    },
    onGridConfigDelete(index) {
      this.$emit('grid-config-delete', index);
    },
  },
};
