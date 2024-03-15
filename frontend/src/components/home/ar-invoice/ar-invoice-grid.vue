<template>
  <div>
    <server-pagination-grid
      ref="invoiceGrid"
      grid-name="invoice"
      title="Invoices"
      key-prop="_id"
      :service="arInvoiceService"
      :can-create="canCreate"
      @grid-edit="onEdit($event)"
      @grid-create-new="onCreateNew($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./ar-invoice-grid.js"></script>
