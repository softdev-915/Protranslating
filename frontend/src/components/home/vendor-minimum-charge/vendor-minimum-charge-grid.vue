<template>
  <server-pagination-grid
    ref="VendorMinimumChargeGrid"
    grid-name="vendorMinimumCharge"
    title="Vendor Minimum Charge"
    key-prop="number"
    :service="vendorMinimumChargeService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./vendor-minimum-charge-grid.js"></script>
