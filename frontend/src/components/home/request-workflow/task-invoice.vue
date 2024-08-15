<template>
  <div class="row flex-nowrap task-invoice" :class="{'invoiced': invoice.isInvoiced, 'read-only': !canEdit }" data-e2e-type="invoice-detail">
    <div class="col-1">
      <button :disabled="!canEdit" tabindex="-1" @click="onInvoiceDetailAdd" class="fas fa-plus mb-2" data-e2e-type="invoice-add-button"></button>
      <button :disabled="!canEdit" tabindex="-1" @click="onInvoiceDetailDelete" class="fas fa-close" data-e2e-type="invoice-delete-button"></button>
    </div>
    <div class="col-1">
      <input
        tabindex="-1"
        title="Show in PDF"
        :disabled="!canEdit"
        v-model="invoice.pdfPrintable"
        class="form-control ml-1 ml-xl-0 pts-clickable"
        data-e2e-type="invoice-show"
        type="checkbox" />
    </div>
    <div class="col-3" v-if="canEdit">
      <breakdown-ajax-basic-select
        tabindex="0"
        data-e2e-type="invoice-breakdown"
        :selected-option="selectedBreakdown"
        :fetch-on-created="false"
        :is-disabled="isDiscountAbility || isRequestCancelled"
        @select="onBreakDownSelected"
        placeholder="Breakdown"
        title="Breakdown list"
      />
    </div>
    <div title="Breakdown" data-e2e-type="invoice-breakdown-read-only" class="col-3" v-else>
      {{ selectedBreakdown.text }}
    </div>
    <div class="col-3">
      <div :class="{'has-danger': !isValidTranslationUnit}" v-if="canEdit">
        <translation-unit-ajax-basic-select
          data-e2e-type="invoice-translation-unit"
          :selected-option="selectedTranslationUnit"
          :fetch-on-created="false"
          :is-disabled="isDiscountAbility || isRequestCancelled"
          @select="onTranslationUnitSelected"
          placeholder="Transl. Unit"
          title="Unit list"
        />
      </div>
      <div title="Unit" class="read-only-translation-unit mb-2" data-e2e-type="invoice-translation-unit-read-only" v-else>
        {{ translationUnitText }}
      </div>
      <input
        v-if="canEditUnitPriceAndQuantity"
        :class="{'has-danger': !isValidQuantity}"
        placeholder="Quantity"
        title="Invoice quantity"
        type="number"
        min="0"
        class="form-control form-control-sm quantity-input"
        v-model.number="invoice.quantity"
        data-e2e-type="invoice-quantity" />
      <div data-e2e-type="invoice-quantity-read-only" v-else>
      {{ invoice.quantity }}
      </div>
    </div>
    <div class="col-3"
      :class="{'read-only-currency': !canEditUnitPriceAndQuantity,
      'pl-2': !canEditUnitPriceAndQuantity}">
      <currency-input
        v-if="!isForeignCurrencyRequest && canEditUnitPriceAndQuantity"
        title="Invoice unit price"
        :currency="null"
        :precision="8"
        v-model="invoice.unitPrice"
        aria-label="Unit price"
        :class="[{'has-danger': !isValidUnitPrice}, 'form-control form-control-sm']"
        data-e2e-type="invoice-unit-price"
        :placeholder="unitPricePlaceholder" />
      <div v-else data-e2e-type="invoice-unit-price-read-only" class="invoice-unit-price-read-only mb-3"> {{ invoice.unitPrice | to2DigitsMin }}</div>
      <currency-input
        v-if="isForeignCurrencyRequest && canEditUnitPriceAndQuantity"
        title="Invoice foreign unit price"
        :currency="null"
        :precision="8"
        v-model="invoice.foreignUnitPrice"
        aria-label="Foreign unit price"
        :class="[{'has-danger': !isValidForeignUnitPrice}, 'form-control form-control-sm']"
        data-e2e-type="invoice-foreign-unit-price"
        :placeholder="unitPricePlaceholder" />
      <div v-else-if="isForeignCurrencyRequest" data-e2e-type="invoice-foreign-unit-price-read-only" class="invoice-unit-price-read-only"> {{ invoice.foreignUnitPrice | to2DigitsMin }}</div>
    </div>
    <div class="col-2 invoice-total font-weight-bold pl-0" title="Invoice total amount" data-e2e-type="invoice-total-amount">
      {{ total | toCurrency }}
    </div>
  </div>
</template>

<script src="./task-invoice.js"></script>

<style lang="scss" src="./task-invoice.scss"></style>
