<template>
  <div>
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
      :rowSelection="rowSelection"
      :row-selection-disabled="rowSelectionDisabled"
      :rowSelectionTitle="rowSelectionTitle"
      :rowHrefBuilder="rowHrefBuilder"
      :selectedRowCheckProperty="selectedRowCheckProperty"
      :selectedRows="selectedRows"
      :activeRows="activeRows"
      :is-pagination-enabled="isPaginationEnabled"
      :is-scroll-pagination-enabled="isScrollPaginationEnabled"
      @grid-scroll="onGridScroll"
      @all-rows-selected="onSelectAll"
      @row-selected="onRowSelected"
      @grid-row-toggle="onGridRowToggle($event)"
      @grid-reset-query="onGridQueryReset($event)"
      @grid-sort="onSort($event)"
      @grid-filter="onFilter($event)"
      @grid-current-config="onConfiguredColumns($event)"
      @grid-entry-change="onEntryChange($event)"
      @grid-page-change="onPageChange($event)"
      @grid-data-export="onGridDataExport($event)"
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
  </div>
</template>



<script src="./scroll-pagination-grid.js"></script>
