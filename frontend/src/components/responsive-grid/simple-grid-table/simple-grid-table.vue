<template>
  <div class="container-fluid pts-data-table-container">
    <div class="row mb-2  align-items-center responsive-border pre-header grid-features p-0">
      <div class="col-1 pl-0">
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
      <div class="col-9"></div>
      <div class="page-counter col-1 p-0 text-right">
        <template v-if="firstRecord === lastRecord">{{ firstRecord }} of {{ totalResults }}</template>
        <template v-else>{{ firstRecord }}-{{ lastRecord }} of {{ totalResults }}</template>
      </div>
      <div class="col-1 p-0">
        <nav aria-label>
          <ul class="pagination mb-0 pull-right">
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
      </div>
    </div>
    <div
      class="row responsive-border real-table-row noScroll no-scroll-x"
      :class="{ 'blur-loading': isLoading }">
      <table
        data-e2e-type="grid-table"
        class="table-sm table pts-data-table table-bordered table-hover table-striped table-stacked"
        :class="tableCustomClass">
        <thead>
          <tr role="row">
            <grid-table-column-header
              v-for="(col, index) in visibleColumns"
              :key="col.prop"
              :index="index"
              :column="col"
              :sort="sort"
              :can-sort="false"
              :filter="filter"
              :loading="isLoading"
              :use-header-filter="false"
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
            :rowSelection="false"
            :rowSelectionDisabled="true"
            :row-href-builder="rowHrefBuilder"
            :css-row-class="cssRowClass"/>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script src="./simple-grid-table.js"></script>
