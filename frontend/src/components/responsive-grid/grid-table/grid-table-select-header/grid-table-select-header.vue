<template>
  <th>
    <span data-e2e-type="grid-column-name">{{ rowSelectionTitle }}</span>
    <input data-e2e-type="grid-select-all-checkbox" type="checkbox" @change="$emit('select-all', $event)" ref="selectAllCheckBox" />
    <span v-show="canSort" class="pts-sort-icon pull-right" @click="fireSort()">
      <i class="fas fa-sort" aria-hidden="true" v-show="sort !== columnProp && sort !== '-' + columnProp"></i>
    </span>
    <span class="pull-right" @click="fireSort()" v-show="canSort">
      <i class="fas fa-sort-amount-asc" v-show="sortAsc"></i>
      <i class="fas fa-sort-amount-desc" v-show="sortDesc"></i>
    </span>
  </th>
</template>

<script src="./grid-table-select-header.js"></script>