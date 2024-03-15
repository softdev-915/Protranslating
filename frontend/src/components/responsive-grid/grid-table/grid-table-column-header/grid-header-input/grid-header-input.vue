<template>
  <div class="input-group filter-container">
    <template v-if="column.type === 'dateRange'">
        <input ref="dateRangeInput"
        :disabled="disabled"
        aria-required="false"
        type="text"
        :class='{"tooltip-target": index !== 0}'
        class="filter-input tooltip-target"
        :aria-label="column.name"
        :name="column.name"
        :data-e2e-type="elementId"
        :value="inputData"
        @focus="showDateRange = true"
        @change="fireFilter()">
        <!-- do not propagate click events from inside this component to the body -->
        <dynamic-utc-range-flatpickr
          :data-e2e-type="dataRangeE2EType"
          :style="dateRangePosition"
          class="tooltip-content border border-dark rounded"
          :class="{'tooltip-content-left': index > 2}"
          v-model="rangeInput"
          v-show="showDateRange"
          @apply="onDateRangeApply" />
    </template>
    <template v-else>
      <input aria-required="false"
        type="text"
        class="filter-input"
        :disabled="disabled"
        :data-e2e-type="elementId"
        :aria-label="column.name"
        :name="column.name"
        v-model="inputData"
        @keyup.enter="fireFilter()">
    </template>
    <span class="input-group-btn clear-btn">
      <button aria-label="Clear filter"
        :disabled="disabled"
        class="btn btn-icon btn-secondary"
        type="button"
        data-e2e-type="grid-remove-filter-button"
        v-show="inputData"
        @click="clearFilter">
        <i class="fas fa-remove"></i>
      </button>
    </span>
  </div>
</template>

<script src="./grid-header-input.js"></script>
<style scoped lang="scss" src="./grid-header-input.scss"></style>
