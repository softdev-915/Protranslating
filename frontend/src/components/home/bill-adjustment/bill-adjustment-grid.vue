<template>
  <server-pagination-grid
    ref="BillAdjustmentGrid"
    grid-name="billAdjustment"
    title="Bill Adjustment"
    key-prop="adjustmentNo"
    :service="billAdjustmentService"
    :can-create="canCreate"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateInline($event)">
  </server-pagination-grid>
</template>

<script src="./bill-adjustment-grid.js"></script>
