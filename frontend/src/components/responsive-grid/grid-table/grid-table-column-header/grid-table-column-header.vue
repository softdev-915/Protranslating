<template>
  <th :class="thClass" ref="th" :style="computedStyles">
    <span @click="fireSort()" data-e2e-type="grid-column-name">{{column.name}}</span>
    <span v-show="canSort" class="pts-sort-icon pull-right" @click="fireSort()">
      <i class="fas fa-sort" aria-hidden="true" v-if="column.sortable !== false" v-show="sort !== column.prop && sort !== '-' + column.prop"></i>
    </span>
    <span class="pull-right" @click="fireSort()" v-if="column.sortable !== false" v-show="canSort">
      <i class="fas fa-sort-amount-asc" v-show="sortAsc"></i>
      <i class="fas fa-sort-amount-desc" v-show="sortDesc"></i>
    </span>
    <span ref="columnResizer" class="resize-column-action pull-right">&nbsp;</span>
    <div v-if="useHeaderFilter && !column.hideHeaderFilter">
      <grid-header-input
        :disabled="loading || column.disabled"
        class='form-control'
        :index="index"
        :filter="filter"
        :column="column"
        @grid-filter="onGridFilter"
        @grid-column-filter-clear="onGridFilterClear"/>
    </div>
  </th>
</template>

<script src="./grid-table-column-header.js"></script>

<style scoped lang="scss" src="./grid-table-column-header.scss"></style>
