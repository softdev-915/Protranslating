<template>
  <server-pagination-grid
    ref="DeliveryTypeGrid"
    grid-name="deliveryType"
    title="Delivery Type Grid"
    key-prop="name"
    :service="deliveryTypeService"
    :can-create="canCreate"
    :can-export="false"
    keyProp="_id"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./delivery-type-grid.js"></script>
