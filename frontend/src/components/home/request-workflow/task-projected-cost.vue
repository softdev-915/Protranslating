<template>
  <div class="row flex-nowrap projected-cost-row"  v-if="canRead() || canEdit()" data-e2e-type="projected-cost-container">
    <div title="Breakdown" class="col-3" data-e2e-type="projected-cost-breakdown-read-only">
      {{ breakdownName }}
    </div>
    <!--Units fields-->
    <div class="col-3">
      <div title="Unit" class="read-only-field" data-e2e-type="projected-cost-translation-unit-read-only">
        {{ translationUnitName }}
      </div>
      <div title="Quantity" data-e2e-type="projected-cost-quantity-read-only">
        {{ projectedCost.quantity }}
      </div>
    </div>
    <!-- Pricing fields -->
    <div class="col-3" data-e2e-type="projected-cost-unit-price-read-only">
      {{ projectedCost.unitPrice.toFixed(4) }}
    </div>
    <div title="Projected cost unit price" class="col-3 pt-0 pl-0" data-e2e-type="projected-cost-total-container" :class="{'blur-loading-row': loadingAveragePrice }">
      <div title="Projected cost total amount" class="col-10" data-e2e-type="projected-cost-total-amount">
        {{ total.toFixed(4) }}
      </div>
    </div>
  </div>
</template>

<script src="./task-projected-cost.js"></script>

<style lang="scss" src="./task-projected-cost.scss"></style>