<template>
  <server-pagination-grid
    ref="BillGrid"
    grid-name="bill"
    title="Bill"
    key-prop="number"
    :service="billService"
    :can-create="false"
    @grid-edit="onEdit($event)">
  </server-pagination-grid>
</template>

<script src="./bill-grid.js"></script>
