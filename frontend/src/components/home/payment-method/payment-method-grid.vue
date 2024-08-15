<template>
  <server-pagination-grid
    ref="paymentMethodsGrid"
    grid-name="paymentMethod"
    title="Payment methods"
    key-prop="name"
    :service="paymentMethodService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./payment-method-grid.js"></script>
