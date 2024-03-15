<template>
  <div class="container-fluid pts-data-table-container">
    <div class="row responsive-border pre-header grid-features p-0 mb-3">
      <div class="col-3 col-sm-2 col-lg-1 col-xl-1" v-if="isPaginationEnabled">
        <span class="inline-block header-item entries-container p-0">
          <simple-basic-select
            id="selectEntries"
            ref="selectEntries"
            :value="entrySize"
            @select="onEntryChange"
            title="Page size"
            class="non-focusable"
            :options="entries"
            data-e2e-type="grid-pagination-size"/>
        </span>
      </div>
      <confirm-dialog
        @confirm="restartPagination"
        @cancel="cancel"
        ref="confirmDialog"
        data-e2e-type="grid-pagination-change-confirmation-dialog"
        confirmationTitle="Need confirmation"
        confirmationMessage="Are you sure you want to change the number of records? If you do so you will be directed to page 1?"/>
      <div
        v-if="isPaginationEnabled"
        class="col-9 col-md-4 col-sm-10 col-lg-2 col-xl-2 mobile-align-right pagination-nav-controls"
        :class="paginationControlsClass">
        <span
          :class="{'link': resetQueryLinkVisible}"
          class="inline-block"
          @click="resetGridQuery()">
          <span class="mr-2">
            <span data-e2e-type="grid-current-base-index">{{firstRecord}}</span>
            <span class="pl-1">-</span>
            <span class="pl-1" data-e2e-type="grid-current-top-index">{{lastRecord}}</span>
          </span>
        </span>
        <span class="inline-block">
          <nav aria-label>
            <ul class="pagination">
              <li class="page-item" :class="{'disabled': firstRecord === 1}">
                <span class="screen-reader-text" aria-hidden="true">Go previous page</span>
                <a class="page-link" target="_self" @click="changePage(page - 1)">&lt;</a>
              </li>
              <li class="page-item" :class="{'disabled': nextPageDisabled }">
                <span class="screen-reader-text" aria-hidden="true">Go next page</span>
                <a class="page-link" target="_self" @click="changePage(page + 1)">&gt;</a>
              </li>
            </ul>
          </nav>
        </span>
      </div>
      <div
        class="inline-block col-12 col-md-6 col-lg-4 col-xl-4 search-container"
        v-show="!useHeaderFilter"
        role="search">
        <label for="searchInput" class="hidden">Search</label>
        <span class="header-item">
          <input
            id="searchInput"
            placeholder="Search"
            v-model.trim="query"
            type="text"
            class="form-control pl-2"
            @keyup.enter="search()"/>
        </span>
      </div>
      <div
        data-e2e-type="grid-configuration"
        class="col-12 col-md-12 col-lg-5 col-xl-5 grid-configuration-container ml-auto">
        <grid-configuration
          :columns="columns"
          :grid-configs="gridConfigs"
          :save-grid-config-available="saveGridConfigAvailable"
          :can-create="canCreate"
          :can-export="canExport"
          :can-setup="canSetup"
          :loading="isLoading"
          :exportingData="exportingData"
          :has-show-all-records-link="hasShowAllRecordsLink"
          :has-import-link="hasImportLink"
          :total-records="listData.totalRecords"
          :show-select-all-button="showSelectAllButton"
          @grid-data-import="onGridDataImport()"
          @grid-data-export="onGridDataExport($event)"
          @grid-column-move="onGridColumnMove($event)"
          @grid-column-visibility-change="onGridColumnVisibilityChange($event)"
          @grid-config-save="onGridConfigSave($event)"
          @grid-config-new="onGridConfigNew($event)"
          @grid-config-selected="onGridConfigSelected($event)"
          @grid-config-delete="onGridConfigDelete($event)"
          @grid-collapse-all="onGridCollapseAll()"
          @grid-expand-all="onGridExpandAll()"
          @grid-show-all-records="onGridShowAllRecords()"
          @grid-create-new="onGridCreateNew($event)"
          @grid-reset-query="onGridResetQuery($event)"
          @grid-setup-action="onGridSetupAction($event)"
          @grid-select-all-columns="onGridSelectAllColumns($event)"/>
      </div>
    </div>
    <div
      class="row responsive-border real-table-row table-responsive"
      :class="{ 'blur-loading': isLoading, 'noScroll': isFixedHeaderTable }">
      <table
        data-e2e-type="grid-table"
        class="table-sm table pts-data-table table-bordered table-hover table-striped table-stacked"
        :class="tableCustomClass">
        <thead>
          <tr role="row">
            <grid-table-select-header
              v-if="rowSelection"
              :row-selection-title="rowSelectionTitle"
              :can-sort="canSortBySelect"
              :sort="sort"
              :loading="isLoading"
              @grid-sort="onGridSort($event)"
              @select-all="selectAll" />
            <grid-table-column-header
              v-for="(col, index) in visibleColumns"
              :key="col.prop"
              :index="index"
              :column="col"
              :sort="sort"
              :can-sort="canSort"
              :filter="filter"
              :loading="isLoading"
              :use-header-filter="useHeaderFilter"
              @grid-sort="onGridSort($event)"
              @grid-filter="onGridFilter($event)"
              @grid-column-resize="onGridColumnResize($event)"/>
          </tr>
        </thead>
        <tbody>
          <grid-table-row
            ref="row"
            v-for="(item, index) in gridListData.list"
            :key="keyForItem(item, index)"
            :columns="visibleColumns"
            :index="((page - 1) * entrySize) + index"
            :item="item"
            :key-for-item="keyForItem"
            :max-visible="maxVisible"
            :components="components"
            :long-text-max-visible="longTextMaxVisible"
            :rowSelection="rowSelection"
            :rowSelectionDisabled="rowSelectionDisabled"
            :isRowSelected="isRowSelected(item)"
            :rowActive="isRowActive(item)"
            :row-href-builder="rowHrefBuilder"
            :can-toggle="canToggle"
            :css-row-class="cssRowClass"
            @grid-row-toggle="onGridRowToggle"
            @row-selected="onRowSelected(item._id, $event)"
            @grid-located-row="onLocatedRow($event)"
            @item-action="itemAction($event)"
            @grid-edit="showEdit($event)"/>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./grid-table.js"></script>
<style scoped lang="scss" src="./grid-table.scss"></style>
