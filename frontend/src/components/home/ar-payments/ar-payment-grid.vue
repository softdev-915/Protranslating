<template>
  <div>
    <server-pagination-grid
      ref="paymentsGrid"
      grid-name="payments"
      title="Payments"
      key-prop="_id"
      :service="service"
      :can-create="canCreate"
      @grid-edit="onEdit"
      @grid-create-new="onCreateNew"
    />
  </div>
</template>
<script src="./ar-payment-grid.js" />