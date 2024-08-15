<template>
  <div class="row flex-nowrap task-invoice" :class="{'invoiced': invoice.isInvoiced }" data-e2e-type="invoice-detail">
    <div class="col-1">
    </div>
    <div class="col-1">
      <input
        tabindex="-1"
        title="Show in PDF"
        :disabled="true"
        v-model="invoice.pdfPrintable"
        class="form-control ml-1 ml-xl-0 pts-clickable"
        data-e2e-type="invoice-show"
        type="checkbox" />
    </div>
    <div title="Breakdown" class="col-3">
      <div data-e2e-type="invoice-breakdown-read-only" class="read-only-box">
        {{ get(invoice, 'breakdown.name', '') }}
      </div>
    </div>
    <div class="col-3">
      <div title="Unit" data-e2e-type="invoice-translation-unit-read-only" class="read-only-box mb-2">
        {{ get(invoice, 'translationUnit.name', '') }}
      </div>
      <div title="Invoice quantity" data-e2e-type="invoice-quantity-read-only">
        {{ invoice.quantity }}
      </div>
    </div>
    <div class="read-only-currency pl-3 col-3">
      <div title="Invoice unit price" data-e2e-type="invoice-unit-price-read-only" class="invoice-unit-price-read-only mb-3"> {{ invoice.unitPrice | to2DigitsMin }}</div>
      <div v-if="isForeignCurrencyRequest" data-e2e-type="invoice-foreign-unit-price-read-only" class="invoice-unit-price-read-only"> {{ invoice.foreignUnitPrice | to2DigitsMin }}</div>
    </div>
    <div class="col-2 invoice-total font-weight-bold pl-0" title="Invoice total amount" data-e2e-type="invoice-total-amount">
      {{ invoice.total | toCurrency }}
    </div>
  </div>
</template>

<script src="./task-invoice-read-only.js"></script>
<style lang="scss" src="./task-invoice-read-only.scss"></style>
