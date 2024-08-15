<template>
  <server-pagination-grid
    ref="deliveryMethodGrid"
    grid-name="deliveryMethod"
    title="Delivery method"
    key-prop="_id"
    :service="deliveryMethodService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./delivery-method-grid.js"></script>
