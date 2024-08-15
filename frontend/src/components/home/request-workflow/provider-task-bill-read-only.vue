<template>
  <div class="row flex-nowrap bill-row" data-e2e-type="bill-detail">
    <div title="Breakdown" class="col-3" data-e2e-type="bill-breakdown-read-only">
      {{ breakdownName }}
    </div>
    <div class="col-3">
      <span class="d-block mb-2" data-e2e-type="bill-translation-unit-read-only" title="Unit">
        {{ translationUnitName }}
      </span>
      <div data-e2e-type="bill-quantity-read-only">
        {{ bill.quantity }}
      </div>
    </div>
    <div class="col-3" data-e2e-type="bill-unit-price-read-only">
      {{ bill.unitPrice }}
    </div>
    <div class="col-3 font-weight-bold" title="bill total amount" data-e2e-type="bill-total-amount">
      {{ bill.total | toCurrency }}
    </div>
  </div>
</template>

<script src="./provider-task-bill-read-only.js"></script>
<style lang="scss" src="./provider-task-bill-read-only.scss"></style>
