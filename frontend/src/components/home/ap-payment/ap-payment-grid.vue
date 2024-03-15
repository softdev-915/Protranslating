<template>
  <server-pagination-grid
    ref="ApPaymentGrid"
    grid-name="apPaymentGrid"
    title="AP Payment"
    key-prop="id"
    :service="apPaymentService"
    :can-create="canCreate"
    @grid-create-new="onCreate($event)"
    @grid-edit="onEdit($event)">
  </server-pagination-grid>
</template>

<script src="./ap-payment-grid.js"></script>
