<template>
  <div class="row flex-nowrap projected-cost-row"  v-if="canRead" data-e2e-type="projected-cost-container">
    <div title="Breakdown" class="col-3" data-e2e-type="projected-cost-breakdown-read-only">
      {{ breakdownName }}
    </div>
    <div class="col-3">
      <div title="Unit" class="read-only-field" data-e2e-type="projected-cost-translation-unit-read-only">
        {{ translationUnitName }}
      </div>
      <div title="Quantity" data-e2e-type="projected-cost-quantity-read-only">
        {{ projectedCost.quantity }}
      </div>
    </div>
    <div title="Projected cost unit price" class="col-3" data-e2e-type="projected-cost-unit-price-read-only">
      {{ unitPriceText }}
    </div>
    <div class="col-3 pt-0 pl-0" data-e2e-type="projected-cost-total-container">
      <div title="Projected cost total amount" class="col-10" data-e2e-type="projected-cost-total-amount">
        {{ totalText }}
      </div>
    </div>
  </div>
</template>

<script src="./task-projected-cost-read-only.js"></script>