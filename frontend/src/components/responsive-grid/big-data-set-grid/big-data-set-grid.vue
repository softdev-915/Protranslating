<template>
  <div>
    <form ref="importedFileForm">
      <input type="file" name="file" class="hidden" accept=".csv" @change="onFileUpload($event)" ref="importedFile" />
    </form>
    <grid-query-manager
      v-model="currentQuery"
      :external-query="query">
    </grid-query-manager>
    <responsive-grid
      ref="responsiveGrid"
      :grid-name="gridName"
      :title="title"
      :can-create="canCreate"
      :can-setup="canSetup"
      :can-export="canExport"
      :can-sort="canSort"
      :can-toggle="!wasCsvImported"
      :query="currentQuery"
      :list-data="listData"
      :table-class="tableClass"
      :use-reset-filter-link="true"
      :use-header-filter="true"
      :key-for-item="keyForItemBuilder()"
      :columns="service.columns"
      :loading="loading"
      :exportingData="exportingData"
      :components="components"
      :rowSelection="rowSelection && !wasCsvImported"
      :rowSelectionDisabled="rowSelectionDisabled"
      :rowSelectionTitle="rowSelectionTitle"
      :rowHrefBuilder="rowHrefBuilder"
      :selectedRowCheckProperty="selectedRowCheckProperty"
      :selectedRows="selectedRows"
      :is-pagination-enabled="false"
      :activeRows="activeRows"
      :has-show-all-records-link="true"
      :has-import-link="hasImportLink"
      @grid-row-toggle="onGridRowToggle($event)"
      @all-rows-selected="onSelectAll"
      @row-selected="onRowSelected"
      @grid-reset-query="handleGridQueryReset($event)"
      @grid-sort="onSort($event)"
      @grid-filter="onFilter($event)"
      @grid-current-config="onConfiguredColumns($event)"
      @grid-entry-change="onEntryChange($event)"
      @grid-page-change="onPageChange($event)"
      @grid-data-export="onGridDataExport($event)"
      @grid-data-import="onGridDataImport($event)"
      @grid-show-all-records="handleGridShowAllRecords($event)"
      @grid-search="onSearch($event)"
      @grid-edit="onEdit($event)"
      @item-action="itemAction($event)"
      @grid-create-new="onCreateNew($event)"
      @grid-setup-action="onSetupAction($event)">
        <div slot="edit-modal">
          <slot name="edit-modal"></slot>
        </div>
    </responsive-grid>
    <iframe-download ref="csvFileIframeDownload" :url="csvFileUrl" @download-finished="onCsvFileDownloadFinished()" @download-error="onIframeDownloadError($event)"></iframe-download>
    <confirm-dialog
      data-e2e-type="show-all-records-confirm-dialog"
      ref="confirmDialog"
      :confirmationMessage="warningMessage"
      @confirm="onDialogConfirm">
    </confirm-dialog>
  </div>
</template>



<script src="./big-data-set-grid.js"></script>
