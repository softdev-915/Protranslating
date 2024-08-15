<template>
  <div class="row flex-nowrap bill-row" data-e2e-type="bill-detail">
    <div title="Breakdown" class="col-3" data-e2e-type="bill-breakdown-read-only">
      {{ breakdownText }}
    </div>
    <div class="col-3" v-if="canEdit">
      <span class="d-block mb-2" data-e2e-type="bill-translation-unit-read-only" >{{ translationUnitText }}</span>
       <input
        :class="{'has-danger': bill.quantity === ''}"
        placeholder="Quantity"
        title="bill quantity"
        type="number"
        :disabled="!canEdit"
        min="0"
        class="form-control form-control-sm quantity-input"
        v-model.number="bill.quantity"
        data-e2e-type="bill-quantity" />
    </div>
    <div class="col-3" data-e2e-type="bill-translation-unit-read-only" title="Unit" v-else>
      {{ translationUnitText }}
      {{ bill.quantity }}
    </div>
    <div class="col-3" :class="{'has-danger': !isValidUnitPrice}">
      <currency-input
        title="Bill unit price"
        :class="{'disabled-v-money': !canEdit, 'has-danger': !isValidBillUnitPrice }"
        :disabled="!canEditUnitPrice"
        v-model="bill.unitPrice"
        aria-label="Unit price"
        :currency="null"
        class="form-control form-control-sm"
        data-e2e-type="bill-unit-price"
        :placeholder="unitPricePlaceholder" />
    </div>
    <div class="col-3 font-weight-bold" title="bill total amount" data-e2e-type="bill-total-amount">
      {{ total | toCurrency }}
    </div>
  </div>
</template>

<script src="./provider-task-bill.js"></script>

<style lang="scss" src="./provider-task-bill.scss"></style>
