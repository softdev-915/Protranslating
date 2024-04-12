<template>
  <ul>
    <li class="action-text pts-clickable" v-show="hasImportLink">
      <span
        title="Import records"
        data-e2e-type="import-grid-button"
        @click="onGridDataImport()"
      >Import</span>
    </li>
    <li v-if="canExport" class="action-text pts-clickable" :class="{ 'blur-loading': exportingData }" data-e2e-type="export-grid-button-container">
      <span data-e2e-type="export-grid-button" title="Export data" @click="fireDataExport()">Export</span>
    </li>
    <li class="action-text pts-clickable" v-show="!collapsedAll">
      <span title="Collapse all" @click="fireCollapseAll()">Collapse All</span>
    </li>
    <li class="action-text pts-clickable" v-show="collapsedAll">
      <span title="Expand all" @click="fireExpandAll()">Expand All</span>
    </li>
    <li class="action-text pts-clickable" v-show="hasShowAllRecordsLink">
      <span title="Show all records" data-e2e-type="show-all-records-btn" @click="onGridShowAllRecords()">Show all records</span>
    </li>
    <li class="action-text pts-clickable">
      <span title="Clear filters" data-e2e-type="clear-all-filters-btn" @click="onGridResetQuery()">Clear filters</span>
    </li>
    <li class="action-text pts-clickable" v-show="canCreate" id="createNew"><span @click="fireCreateNew()">Create new</span></li>
    <li class="action-text pts-clickable" v-show="canSetup" id="settings">
      <span @click="fireSetupAction()">Advanced Settings</span>
    </li>
    <li data-e2e-type="manage-grid-li" class="action-text pts-clickable pr-0">
      <b-dropdown
        ref="config-dropdown"
        toggle-class="dropdownMenuButton"
        text="Manage grid"
        variant="secondary btn-icon"
        :right="true"
        :popper-opts="popperOpts"
        no-flip
      >
        <grid-configuration-dropdown
          :columns="sortedColumns"
          :grid-configs="gridConfigs"
          :save-grid-config-available="saveGridConfigAvailable"
          :show-select-all-button="showSelectAllButton"
          @grid-column-move="onGridColumnMove($event)"
          @grid-column-visibility-change="onGridColumnVisibilityChange($event)"
          @grid-config-save="onGridConfigSave($event)"
          @grid-config-new="onGridConfigNew($event)"
          @grid-config-selected="onGridConfigSelected($event)"
          @grid-config-delete="onGridConfigDelete($event)"
          @grid-select-all-columns="onGridSelectAllColumns($event)"
        />
      </b-dropdown>
    </li>
  </ul>
</template>

<script src="./grid-configuration.js"></script>

<style scoped lang="scss" src="./grid-configuration.scss"></style>
<style lang="scss" src="./grid-configuration-global.scss"></style>
